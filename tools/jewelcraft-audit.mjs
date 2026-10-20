// Jewelbound's branded-audio boundary, on both real GPU backends. Solo only.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const target=process.argv[2]||'index.html';
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href;
let passed=0;
for(const backend of ['webgpu','webgl']){
 const page=await launch({port:9774});
 const check=(name,value)=>{assert.ok(value,name);passed++;console.log(`PASS ${backend}: ${name}`);};
 try{
  await page.goto(base+(backend==='webgl'?'?webgl':'')+'#solo=1');
  await until(()=>page.eval('!!window.__jewel?.ready'),{timeout:60000});
  await page.eval('__jewel.app.audio.start()');
  await sleep(400);
  check('old welcome is silent after starting sound',await page.eval('__jewel.announcer().history.length===0'));
  check('both branded previews are blocked',await page.eval(`!__jewel.app.announcer.request('welcome',{preview:true})&&!__jewel.app.announcer.request('welcome-back',{preview:true})`));
  check('ordinary celebration accepted',await page.eval(`__jewel.app.announcer.request('brilliant',{preview:true})`));
  await until(()=>page.eval(`__jewel.announcer().history.some(h=>h.key==='brilliant')`),{timeout:10000});
  check('approved celebration decoded and played',await page.eval('__jewel.announcer().stats.played===1&&__jewel.announcer().stats.errors===0'));
  await page.eval(`__jewel.app.ui.activate('announcer-on')`);
  check('voice switch stops playback immediately',await page.eval('!__jewel.announcer().enabled&&!__jewel.announcer().speaking'));
  check('disabled voice refuses preview',await page.eval(`!__jewel.app.announcer.request('brilliant',{preview:true})`));
  await page.eval(`__jewel.app.openPanel('announcer');__jewel.app.ui.scroll=10000`);
  await sleep(250);
  check('voice panel offers an unbranded preview',await page.eval(`__jewel.ui().hits.some(h=>h.id==='announcer-preview-brilliant')&&!__jewel.ui().hits.some(h=>h.id==='announcer-preview-welcome-back')`));
  const diagnostics=await page.eval('__jewel.diagnostics()');
  check('no GPU or script errors',diagnostics.errors.length===0&&!page.logs.some(x=>x.startsWith('EXCEPTION')));
 }finally{page.kill();await sleep(700);}
}
console.log(`${passed} passed, 0 failed`);
