// B001 matched stage-arrival receipts. Requires the shared browser/GPU lease.
// node tools/jewelcraft-stage-audit.mjs [file-or-url] [before|after]
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2);
assert.ok(['before','after'].includes(label));
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href;
const out=resolve('tools/out/rounds/B001',label);mkdirSync(out,{recursive:true});
const receipts=[];
for(const backend of ['webgpu','webgl'])for(const [view,w,h] of [['desktop',1280,800],['phone',390,844],['landscape',844,390]]){
 const page=await launch({port:9790,width:w,height:h,mobile:view!=='desktop',deviceScaleFactor:1});
 try{
  await page.goto(base+(backend==='webgl'?'?webgl':'')+'#solo=1');
  await until(()=>page.eval('!!window.__jewel?.ready'),{timeout:60000});
  await page.eval('__jewel.challenge("zen",{seed:1})');
  await until(()=>page.eval('__jewel.app.phase==="idle"'),{timeout:20000});
  // Sound off uses the game's normal visual clock; a live audio downbeat cannot
  // be fast-forwarded with the manual screenshot clock. Audio has its own gate.
  await page.eval(`(()=>{const a=__jewel.app;a.audio.setMute(true);a.prefs.muted=true;__jewel.advance(0);a.expedition.dismissTour();a.board.score=4970;a.displayScore=4970;a.ui.toastUntil=0;})()`);
  const pair=await page.eval('__jewel.state().legalMoves[0]');
  const points=await page.eval(`(${JSON.stringify(pair)}).map(i=>__jewel.project(i))`);
  await page.mouse('mousePressed',...points[0]);
  for(let i=1;i<=8;i++)await page.mouse('mouseMoved',points[0][0]+(points[1][0]-points[0][0])*i/8,points[0][1]+(points[1][1]-points[0][1])*i/8);
  await page.mouse('mouseReleased',...points[1]);
  await page.eval(`(()=>{const a=__jewel.app;for(let i=0;i<600&&!a.ui.sc;i++)__jewel.advance(1/60);if(!a.ui.sc)throw Error('Real swap did not trigger travel');for(let i=0;i<84;i++)__jewel.advance(1/60);a.ui.hideCursor();})()`);
  const state=await page.eval(`(()=>{const a=__jewel.app;return {score:a.board.score,moves:a.board.moves,cells:a.board.cells.map(c=>[c.type,c.special]),phase:a.phase,stage:a.ui.sc?.name,arrival:a.ui.stageArrivalRect||null,board:a.ui.boardRect,hits:a.ui.hits.map(({id,x,y,w,h})=>({id,x,y,w,h}))};})()`);
  assert.equal(state.moves,1);assert.equal(state.stage,'TIDEPOOL');
  if(label==='after'){
   const r=state.arrival;assert.ok(r&&r.y+r.h<=state.board.y,'arrival must stay above all gems');
   assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=w&&r.y+r.h<=h,'arrival stays in viewport');
   assert.ok(state.hits.every(b=>r.x+r.w<=b.x||b.x+b.w<=r.x||r.y+r.h<=b.y||b.y+b.h<=r.y),'arrival clears controls');
  }
  await page.shot(`${out}/${backend}-${view}.png`);
  if(label==='after'&&view==='landscape'){
   await page.eval(`__jewel.app.ui.stageCallout({...__jewel.app.fx.stageInfo(),n:12,name:'PRISM HEART',loop:true});__jewel.advance(.5)`);
   const fontSize=await page.eval(`(()=>{const u=__jewel.app.ui;return 14*Math.min(1,(u.titleRect.w-64)/u.measure('PRISM HEART',14));})()`);
   assert.ok(fontSize>=12,'compact encore stage name remains legible');
   await page.shot(`${out}/${backend}-landscape-encore.png`);
  }
  await page.eval('__jewel.advance(4)');
  assert.equal(await page.eval('__jewel.app.ui.sc'),null,'event expires');
  // A normal move after arrival must still complete through the input path.
  const next=await page.eval('__jewel.state().legalMoves[0].map(i=>__jewel.project(i))');
  await page.mouse('mousePressed',...next[0]);await page.mouse('mouseReleased',...next[0]);
  await page.mouse('mousePressed',...next[1]);await page.mouse('mouseReleased',...next[1]);
  await page.eval('__jewel.advance(8)');assert.equal(await page.eval('__jewel.state().moves'),2);
  const d=await page.eval('__jewel.diagnostics()');assert.equal(d.errors.length,0);assert.ok(!page.logs.some(x=>x.startsWith('EXCEPTION')));
  receipts.push({backend,view,viewport:[w,h],capturedUtc:new Date().toISOString(),state,errors:d.errors});
 }finally{page.kill();await sleep(800);}
}
writeFileSync(`${out}/capture.json`,JSON.stringify(receipts,null,2));console.log(JSON.stringify({out,views:receipts.length,passed:true},null,2));
