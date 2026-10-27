// MOCKS ONLY: no child process, Chrome, renderer, network, input or audio.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {startOwnedChrome,launch} from '../tools/cdp.mjs';
const root='tools/out/chrome-launch-mocks';
const options={evidenceRoot:root,startupMs:60,pollMs:2,shutdownMs:30};
const path='/devtools/browser/mock-owned';
function fake(onStart=()=>{}) {
 const observed={kills:0};
 observed.spawn=(binary,args,opts)=>{
  const p=new EventEmitter();p.pid=424242;p.exitCode=null;p.stdout=new PassThrough();p.stderr=new PassThrough();
  observed.proc=p;observed.binary=binary;observed.args=args;observed.opts=opts;
  observed.profile=args.find(a=>a.startsWith('--user-data-dir=')).split('=').slice(1).join('=');
  p.kill=()=>{observed.kills++;p.exitCode=0;queueMicrotask(()=>{p.emit('exit',0,'SIGTERM');p.emit('close',0,'SIGTERM');});return true;};
  queueMicrotask(()=>onStart(p,observed));return p;
 };return observed;
}
function port(o,text='43123\n'+path+'\n'){writeFileSync(join(o.profile,'DevToolsActivePort'),text);}
const response=(p=path)=>({ok:true,json:async()=>({Browser:'Chrome/mock',webSocketDebuggerUrl:'ws://127.0.0.1:43123'+p})});
const receipt=o=>JSON.parse(readFileSync(join(o.profile,'..','launch.json'),'utf8'));
test('owned readiness persists exact binary, flags, PID, profile and raw output; cleanup is idempotent',async()=>{
 const o=fake((p,o)=>{port(o);p.stdout.write('owned stdout\n');p.stderr.write('owned stderr\n');});
 const r=await startOwnedChrome(options,{spawn:o.spawn,fetch:async()=>response()});
 assert.equal(r.record.status,'ready');assert.equal(r.record.pid,424242);assert.equal(r.record.mockProcess,true);
 assert(o.args.includes('--headless=new'));assert(o.args.includes('--mute-audio'));assert(!o.args.includes('--no-sandbox'));assert.equal(o.opts.windowsHide,true);
 assert.equal(readFileSync(join(r.receiptDir,'stderr.log'),'utf8'),'owned stderr\n');assert.equal(readFileSync(join(r.receiptDir,'stdout.log'),'utf8'),'owned stdout\n');
 await r.closeOwned();await r.closeOwned();assert.equal(o.kills,1);assert.equal(receipt(o).cleanup.parentExitConfirmed,true);
});
test('early nonzero exit retains stderr and code instead of reporting only timeout',async()=>{
 const o=fake((p)=>{p.stderr.write('mock startup reason\n');p.exitCode=7;p.emit('exit',7,null);p.emit('close',7,null);});
 await assert.rejects(startOwnedChrome(options,{spawn:o.spawn,fetch:async()=>{throw Error('unexpected request');}}),/exited before readiness/);
 assert.equal(receipt(o).exit.code,7);assert.equal(o.kills,0);assert.match(readFileSync(join(o.profile,'..','stderr.log'),'utf8'),/mock startup reason/);
});
test('spawn error is retained and never mistaken for readiness',async()=>{
 const o=fake(p=>{p.pid=undefined;p.emit('error',new Error('mock EACCES'));p.emit('close',null,null);});
 await assert.rejects(startOwnedChrome(options,{spawn:o.spawn,fetch:async()=>response()}),/mock EACCES/);assert.match(receipt(o).spawnError,/EACCES/);assert.equal(o.kills,0);
});
test('partial port file can finish writing, then endpoint must match the owned profile',async()=>{
 const o=fake((p,o)=>{port(o,'43123\n');setTimeout(()=>port(o),5);});
 const r=await startOwnedChrome(options,{spawn:o.spawn,fetch:async()=>response()});assert.equal(receipt(o).devToolsPortFile,'43123\n'+path+'\n');await r.closeOwned();
});
test('foreign DevTools endpoint is rejected; timeout retains the actual readiness reason',async()=>{
 const o=fake((p,o)=>port(o));
 await assert.rejects(startOwnedChrome({...options,startupMs:25},{spawn:o.spawn,fetch:async()=>response('/devtools/browser/foreign')}),/readiness timed out/);
 assert.match(receipt(o).lastReadinessError,/does not match owned profile/);assert.equal(o.kills,1);
});
test('HTTP wait is aborted at the remaining startup deadline',async()=>{
 const o=fake((p,o)=>port(o)),keepAlive=setTimeout(()=>{},1000);let aborted=false;
 try {await assert.rejects(startOwnedChrome({...options,startupMs:25},{spawn:o.spawn,fetch:async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new Error('mock request aborted'));},{once:true}))}),/readiness timed out/);}
 finally {clearTimeout(keepAlive);}assert(aborted);assert.equal(o.kills,1);assert.match(receipt(o).lastReadinessError,/mock request aborted/);
});
test('an unexplained missing port times out once and closes only its owned child',async()=>{
 const o=fake();await assert.rejects(startOwnedChrome({...options,startupMs:20},{spawn:o.spawn,fetch:async()=>{throw Error('must not fetch');}}),/readiness timed out/);
 assert.equal(o.kills,1);assert.match(receipt(o).lastReadinessError,/ENOENT/);assert.equal(receipt(o).cleanup.targetPid,424242);
});
test('headed launch is rejected before any process starts',async()=>{await assert.rejects(launch({headless:false}),/Only headless Chrome/);});

test('unconfirmed exact-child termination fails the gate and retains cleanup evidence',async()=>{
 for(const killResult of [false,true]){
  const o=fake((p,o)=>{port(o);p.kill=()=>{o.kills++;return killResult;};});
  const r=await startOwnedChrome(options,{spawn:o.spawn,fetch:async()=>response()});
  await assert.rejects(r.closeOwned(),/did not confirm PID 424242 exit/);
  assert.equal(receipt(o).cleanup.parentExitConfirmed,false);assert.equal(o.kills,1);
 }
});

test('startup failure retains its cause when exact-child cleanup also fails',async()=>{
 const o=fake(p=>{p.kill=()=>false;});
 await assert.rejects(startOwnedChrome({...options,startupMs:20},{spawn:o.spawn}),error=>error instanceof AggregateError&&/readiness timed out/.test(error.cause.message)&&/did not confirm/.test(error.errors[1].message));
 assert.match(receipt(o).error,/readiness timed out/);assert.equal(receipt(o).cleanup.parentExitConfirmed,false);
});
test('graceful exit avoids force termination and late stdout is retained',async()=>{
 const o=fake((p,o)=>port(o));const r=await startOwnedChrome(options,{spawn:o.spawn,fetch:async()=>response()});
 setTimeout(()=>{o.proc.stdout.write('last output\n');o.proc.exitCode=0;o.proc.emit('exit',0,null);o.proc.emit('close',0,null);},5);
 await r.closeOwned({gracefulMs:30});assert.equal(o.kills,0);assert.equal(receipt(o).cleanup.parentExitConfirmed,true);assert.match(readFileSync(join(r.receiptDir,'stdout.log'),'utf8'),/last output/);
});
