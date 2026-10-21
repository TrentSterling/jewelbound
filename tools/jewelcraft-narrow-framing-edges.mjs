// Matched near-square challenge fallbacks requested by independent review.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const out=resolve('tools/out/rounds/B010/edge-comparison');mkdirSync(out,{recursive:true});const frames=[];
for(const [label,target]of[['before','../jewelbound-b009/index.html'],['after','index.html']])for(const [w,h]of[[321,320],[460,459]]){
 const p=await launch({port:9884,width:w,height:h,mobile:true});try{
  await p.goto(pathToFileURL(resolve(target)).href+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await until(()=>p.eval("(()=>{const n=document.getElementById('loading');return !n||getComputedStyle(n).display==='none'||Number(getComputedStyle(n).opacity)===0})()"));
  await p.eval(`(()=>{const a=__jewel.app;__jewel.challenge('moves',{seed:1});a.expedition.dismissTour();a.closePanel();__jewel.advance(3);a.audio.setMute(true);a.time=20;a.living.clock=20;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.expedition.announcement=null;a.ui.sc=null;a.ui.cm=[];a.ui.flares=[];a.ui.scoreHit=-9;a.best=0;a.displayScore=0;a.ui.hideCursor();const fn=a.ui.text;window.__texts=[];a.ui.text=function(...args){window.__texts.push(args);return fn.apply(this,args)};a.draw()})()`);
  await sleep(200);await p.eval('__jewel.app.draw()');await sleep(100);
  const data=await p.eval(`(()=>{const a=__jewel.app;return {cells:a.board.cells.map(c=>[c.type,c.special]),score:a.board.score,moves:a.board.moves,hits:a.ui.hits,board:a.ui.boardRect,aside:a.ui.challengeAsideRect,texts:window.__texts.filter(t=>/30 moves|CHALLENGE|Settings|Co-op Room/.test(t[0])),diagnostics:__jewel.diagnostics()}})()`);
  assert.equal(data.score,0);assert.equal(data.moves,0);assert.deepEqual(data.diagnostics.errors,[]);assert.ok(!p.logs.some(x=>x.startsWith('EXCEPTION')));
  const utc=new Date().toISOString(),file=out+'/'+label+'-'+w+'x'+h+'-moves.png';await p.shot(file);frames.push({label,viewport:[w,h],utc,file,...data});
 }finally{p.kill();await sleep(800);}
}
for(const w of[321,460]){const [b,a]=frames.filter(f=>f.viewport[0]===w);assert.deepEqual(b.cells,a.cells);assert.deepEqual(b.hits,a.hits);}
writeFileSync(out+'/receipt.json',JSON.stringify({passed:true,frames},null,2));console.log('4 matched near-square mode captures passed');
