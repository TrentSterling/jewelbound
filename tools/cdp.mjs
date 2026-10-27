// Tiny Chrome DevTools Protocol driver. Zero deps (Node 20+: global fetch + WebSocket).
import {spawn} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, appendFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Also exported for mock-only lifecycle tests; importing this module starts nothing.
export async function startOwnedChrome({width = 1280, height = 800,
  evidenceRoot = 'tools/out/chrome-launches', startupMs = 15000,
  pollMs = 250, shutdownMs = 2000} = {}, runtime = {}) {
  const start = runtime.spawn || spawn, request = runtime.fetch || fetch;
  mkdirSync(evidenceRoot, {recursive: true});
  const receiptDir = mkdtempSync(join(resolve(evidenceRoot), 'launch-'));
  const dir = join(receiptDir, 'profile'); mkdirSync(dir);
  const args = [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    `--window-size=${width},${height}`, '--enable-unsafe-webgpu', '--enable-features=Vulkan', '--disable-features=CalculateNativeWinOcclusion', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
    '--no-first-run', '--no-default-browser-check', '--autoplay-policy=user-gesture-required', '--mute-audio', '--hide-scrollbars',
  ].filter(Boolean);
  const record = {mockProcess: !!runtime.spawn, binary: CHROME, args, profile: dir, receiptDir, cwd: process.cwd(),
    node: process.version, temp: process.env.TEMP, startedUtc: new Date().toISOString(),
    status: 'prepared', pid: null, exit: null, spawnError: null, lastReadinessError: null};
  const persist = () => writeFileSync(join(receiptDir, 'launch.json'), JSON.stringify(record, null, 2));
  for (const name of ['stdout.log','stderr.log']) writeFileSync(join(receiptDir,name), '');
  persist(); let proc, closed = false, spawnError, closing;
  const closeOwned = ({gracefulMs = 0} = {}) => closing ||= (async () => {
    record.cleanup = {requestedUtc: new Date().toISOString(), targetPid: record.pid,
      killRequested: false, scope: 'exact spawned ChildProcess only; no process-name or tree kill'};
    const graceDeadline = Date.now() + gracefulMs;
    while (proc?.pid && !closed && Date.now() < graceDeadline) await sleep(Math.min(20,gracefulMs));
    if (proc?.pid && !closed && proc.exitCode == null) {
      try { record.cleanup.killRequested = proc.kill(); }
      catch (error) { record.cleanup.error = String(error); }
    }
    const deadline = Date.now() + shutdownMs;
    while (proc?.pid && !closed && Date.now() < deadline) await sleep(Math.min(20,shutdownMs));
    record.cleanup.parentExitConfirmed = closed || !!proc && proc.exitCode != null;
    record.cleanup.descendantExit = 'not independently established by this helper'; persist();
    if (proc?.pid && !record.cleanup.parentExitConfirmed) throw new Error(`Owned Chrome cleanup did not confirm PID ${record.pid} exit; receipt: ${receiptDir}`);
  })();
  try {
    proc = start(CHROME, args, {stdio: ['ignore','pipe','pipe'], windowsHide: true});
    record.pid = proc.pid ?? null; record.status = 'spawned'; persist();
    proc.stdout?.on('data', chunk => appendFileSync(join(receiptDir,'stdout.log'),chunk));
    proc.stderr?.on('data', chunk => appendFileSync(join(receiptDir,'stderr.log'),chunk));
    proc.on('error', error => { spawnError = error; record.spawnError = String(error); persist(); });
    proc.on('exit', (code,signal) => { record.exit = {code,signal,atUtc:new Date().toISOString()}; persist(); });
    proc.on('close', () => { closed = true; persist(); });
    const deadline = Date.now() + startupMs; let info;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (closed || record.exit) throw new Error('Chrome exited before readiness');
      try {
        const raw = readFileSync(join(dir,'DevToolsActivePort'),'utf8');
        record.devToolsPortFile = raw;
        const [portText,browserPath] = raw.trim().split(/\r?\n/), port = Number(portText);
        if (!Number.isInteger(port) || port < 1 || port > 65535 || !/^\/devtools\/browser\/[A-Za-z0-9-]+$/.test(browserPath || '')) throw new Error('Incomplete or invalid DevToolsActivePort');
        const response = await request(`http://127.0.0.1:${port}/json/version`, {signal: AbortSignal.timeout(Math.max(1,Math.min(1000,deadline-Date.now())))});
        if (!response.ok) throw new Error('DevTools HTTP '+response.status);
        const candidate = await response.json(), url = new URL(candidate.webSocketDebuggerUrl);
        if (url.protocol !== 'ws:' || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || Number(url.port) !== port || url.pathname !== browserPath) throw new Error('DevTools endpoint does not match owned profile');
        info = candidate; break;
      } catch (error) { record.lastReadinessError = String(error); persist(); }
      await sleep(Math.min(pollMs,Math.max(0,deadline-Date.now())));
    }
    if (!info) throw new Error('Chrome readiness timed out');
    if (spawnError || closed || record.exit) throw new Error('Chrome exited during readiness');
    record.status = 'ready'; record.version = info; persist();
    return {proc,dir,info,receiptDir,closeOwned,record,persist};
  } catch (error) {
    record.status = 'failed'; record.error = String(error); persist();
    try { await closeOwned(); } catch (cleanupError) { throw new AggregateError([error,cleanupError], `${error.message}; cleanup unconfirmed; receipt: ${receiptDir}`, {cause:error}); }
    throw new Error(`${error.message}; receipt: ${receiptDir}`, {cause:error});
  }
}

export async function launch({width = 1280, height = 800, headless = true, mobile = false, deviceScaleFactor = 1, blockedUrls = [], ...options} = {}) {
  if (!headless) throw new Error('Only headless Chrome is authorized');
  const owned = await startOwnedChrome({width,height,...options});
  const {proc,dir,info,closeOwned} = owned;
  let ws;
  try {
  ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { const timer=setTimeout(()=>rej(new Error('DevTools WebSocket open timeout')),5000); ws.onopen=()=>{clearTimeout(timer);res();}; ws.onerror=e=>{clearTimeout(timer);rej(e);}; });
  let seq = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const {res, rej, timer} = pending.get(m.id); clearTimeout(timer); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) for (const l of listeners) l(m);
  };
  ws.onclose=()=>{for(const {rej,timer} of pending.values()){clearTimeout(timer);rej(new Error('Owned DevTools connection closed'));}pending.clear();};
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++seq; const timer=setTimeout(()=>{pending.delete(id);rej(new Error('DevTools timeout: '+method));},method==='Browser.close'?2000:30000); pending.set(id, {res, rej,timer}); try { ws.send(JSON.stringify({id, method, params, sessionId})); } catch(error) { clearTimeout(timer);pending.delete(id);rej(error); } });
  const {targetId} = await send('Target.createTarget', {url: 'about:blank'});
  const {sessionId} = await send('Target.attachToTarget', {targetId, flatten: true});
  const logs = [];
  listeners.push(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
    if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  });
  const call = (method, params) => send(method, params, sessionId);
  await call('Page.enable'); await call('Runtime.enable'); await call('Log.enable');
  if (blockedUrls.length) {
    await call('Network.enable');
    await call('Network.setBlockedURLs', {urls: blockedUrls});
  }
  await call('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor, mobile});
  if (mobile) await call('Emulation.setTouchEmulationEnabled', {enabled:true,maxTouchPoints:1});
  const page = {
    logs, proc, dir, receiptDir: owned.receiptDir, call, browser:send,
    mouse: (type,x,y,button='left',buttons=type==='mouseReleased'?0:({left:1,right:2,middle:4}[button]??0)) => call('Input.dispatchMouseEvent',{type,x,y,button,clickCount:1,buttons}),
    front: () => { throw new Error('Desktop focus changes are prohibited; headless gates do not need Page.bringToFront'); },
    init: source => call('Page.addScriptToEvaluateOnNewDocument', {source}),
    viewport: (width,height,deviceScaleFactor=1) => call('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor,mobile:false}),
    goto: url => call('Page.navigate', {url}),
    eval: async (expr) => { const r = await call('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true}); if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; },
    shot: async (file) => { const {data} = await call('Page.captureScreenshot', {format: 'png'}); const fs = await import('node:fs'); fs.writeFileSync(file, Buffer.from(data, 'base64')); return file; },
    kill: async () => { try { await send('Browser.close'); } catch(error) { owned.record.closeMessage=String(error);owned.persist(); } finally { try { ws.close(); } catch {} await closeOwned({gracefulMs:500}); } },
  };
  return page;
  } catch(error) { owned.record.status='attachment-failed';owned.record.error=String(error);owned.persist();try { ws?.close(); } catch {} try { await closeOwned(); } catch(cleanupError) { throw new AggregateError([error,cleanupError],`${error.message}; cleanup unconfirmed; receipt: ${owned.receiptDir}`,{cause:error}); }throw error; }
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function until(fn, {timeout = 30000, every = 250, label = 'condition'} = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { const v = await fn(); if (v) return v; await sleep(every); }
  throw new Error('timeout waiting for ' + label);
}
