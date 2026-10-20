// Matched real-input challenge receipts. Requires the shared GPU claim.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2);
assert.ok(['before','after'].includes(label));
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href;
const out=resolve('tools/out/rounds/B002',label+'-matched');mkdirSync(out,{recursive:true});
const receipts=[];
for(const backend of ['webgpu','webgl'])for(const [view,w,h] of [['desktop',1280,800],['phone',390,844],['landscape',844,390],['short',844,320]]){
 const p=await launch({port:9812,width:w,height:h,mobile:view!=='desktop'});
 try{
  await p.goto(base+(backend==='webgl'?'?webgl':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'));
  for(const mode of ['timed','moves','daily','puzzle']){
   await p.eval(`__jewel.challenge('${mode}',{seed:1,puzzle:1});__jewel.app.expedition.dismissTour();__jewel.app.audio.setMute(true);__jewel.app.prefs.muted=true;__jewel.advance(0);__jewel.advance(5)`);
   const pts=await p.eval('__jewel.state().legalMoves[0].map(i=>__jewel.project(i))');
   await p.mouse('mousePressed',...pts[0]);await p.mouse('mouseReleased',...pts[0]);await p.mouse('mousePressed',...pts[1]);await p.mouse('mouseReleased',...pts[1]);
   await p.eval(`__jewel.advance(8);(()=>{const a=__jewel.app;a.expedition.run.elapsed=60;a.time=20;a.living.clock=20;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.ui.hideCursor();a.draw();})()`);
   const state=await p.eval(`(()=>{const a=__jewel.app;return {mode:a.expedition.run.mode,limit:a.expedition.run.limit,elapsed:a.expedition.run.elapsed,moves:a.board.moves,score:a.board.score,cells:a.board.cells.map(c=>[c.type,c.special]),phase:a.phase,finished:a.expedition.run.finished,board:a.ui.boardRect,hits:a.ui.hits.map(({id,x,y,w,h})=>({id,x,y,w,h}))};})()`);
   assert.equal(state.moves,1);assert.equal(state.phase,'idle');assert.equal(state.finished,false);
   if(label==='after'){
    const r=await p.eval('__jewel.app.ui.challengePlaqueRect');assert.ok(r&&r.y+r.h<=state.board.y&&r.x>=0&&r.x+r.w<=w);
    assert.ok(state.hits.every(b=>r.x+r.w<=b.x||b.x+b.w<=r.x||r.y+r.h<=b.y||b.y+b.h<=r.y));
    const secondary=await p.eval('__jewel.app.ui.plaqueAt?__jewel.app.ui.challengeStatusLayout():null');
    if(secondary?.relocated){
     assert.ok(secondary.x-8>=state.board.x+state.board.w&&secondary.x+secondary.w+8<=w);
     assert.ok(state.hits.every(b=>secondary.x+secondary.w+8<=b.x||b.x+b.w<=secondary.x-8||secondary.y+46<=b.y||b.y+b.h<=secondary.y-8));
    }
   }
   await p.shot(`${out}/${backend}-${view}-${mode}.png`);
   receipts.push({backend,view,mode,utc:new Date().toISOString(),state});
   if(label==='after'&&mode==='timed'){
    await p.eval('__jewel.app.expedition.run.elapsed=0;__jewel.app.draw()');
    await p.shot(`${out}/${backend}-${view}-start-time.png`);
    await p.eval(`(()=>{const a=__jewel.app;a.expedition.run.elapsed=112.2;a.draw();})()`);
    await p.shot(`${out}/${backend}-${view}-low-time.png`);
    for(const seconds of [13,19]){
     await p.eval(`__jewel.app.expedition.run.elapsed=${120-seconds};__jewel.app.draw()`);
     await p.shot(`${out}/${backend}-${view}-time-${seconds}.png`);
    }
    // The title must never displace stage names or change the running timer.
    await p.eval(`__jewel.app.ui.stageCallout({...__jewel.app.fx.stageInfo(),n:2,name:'TIDEPOOL'});__jewel.advance(.5)`);
    assert.ok(await p.eval('!!__jewel.app.ui.stageArrivalRect&&!__jewel.app.ui.challengePlaqueRect'));
    await p.eval('__jewel.advance(3)');assert.ok(await p.eval('!!__jewel.app.ui.challengePlaqueRect&&!__jewel.app.ui.stageArrivalRect'));
    await p.eval('__jewel.app.expedition.run.elapsed=119.1;__jewel.app.draw()');
    await p.shot(`${out}/${backend}-${view}-last-second.png`);
    await p.eval('__jewel.advance(8)');assert.equal(await p.eval('__jewel.app.expedition.run.finished'),true);
    assert.equal(await p.eval('__jewel.app.ui.challengePlaqueRect'),null);
   }
   if(label==='after'&&mode==='puzzle')for(const puzzle of [0,2]){
    await p.eval(`__jewel.challenge('puzzle',{puzzle:${puzzle}});__jewel.advance(5);__jewel.app.ui.toastUntil=0;__jewel.app.draw()`);
    assert.equal(await p.eval('__jewel.app.expedition.run.limit'),puzzle===0?1:3);
    await p.shot(`${out}/${backend}-${view}-puzzle-budget-${puzzle===0?1:3}.png`);
   }
   if(label==='after'&&mode==='daily'&&view==='short'){
    await p.eval(`__jewel.challenge('daily');__jewel.advance(.6)`);
    const toast=await p.eval(`(()=>{const a=__jewel.app,u=a.ui,original=u.text,paint=[];u.text=function(...args){if(String(args[0]).startsWith('Daily board:'))paint.push({y:args[2],h:args[3]});return original.apply(this,args);};try{a.draw();}finally{u.text=original;}return {paint,status:u.challengeStatusLayout(),visible:u.toastUntil>a.time};})()`);
    assert.ok(toast.visible&&toast.paint.length>0,'actual daily-start toast is visible');
    assert.ok(toast.paint.every(t=>t.y+t.h+10<toast.status.y-8),'secondary status clears the toast');
    await p.shot(`${out}/${backend}-${view}-daily-toast.png`);
   }
   assert.deepEqual(await p.eval('__jewel.diagnostics().errors'),[]);
  }
  assert.ok(!p.logs.some(x=>x.startsWith('EXCEPTION')));
 }finally{p.kill();await sleep(800);}
}
writeFileSync(out+'/capture.json',JSON.stringify(receipts,null,2));console.log(JSON.stringify({views:receipts.length,out,passed:true},null,2));
