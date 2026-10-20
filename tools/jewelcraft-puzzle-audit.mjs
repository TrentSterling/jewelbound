// B003: matched puzzle goals after their toast expires, plus real winning input.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2);assert.ok(['before','after','live'].includes(label));
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B003',label);mkdirSync(out,{recursive:true});
const goals=[['CLEAR MARKED GEMS','CLEAR','MARKED'],['FORGE A BLAST GEM','FORGE','BLAST'],['FORGE A PRISM','FORGE','PRISM'],['REACH A 5-WAVE CHAIN','5-WAVE','CHAIN']],pairs=[[1,2],[28,36],[53,61],[11,19]],receipts=[];let wins=0;
const plaque=p=>p.eval(`(()=>{const a=__jewel.app,u=a.ui,text=u.text,title=u.titlePlaque,rows=[];let inside=false;u.titlePlaque=function(...v){inside=true;try{return title.apply(this,v)}finally{inside=false}};u.text=function(...v){if(inside){const [s,x,y,h,col,align,max]=v,width=Math.min(this.measure(s,h),max??Infinity);rows.push({text:String(s),x:align==='center'?x-width/2:align==='right'?x-width:x,y,w:width,h:h*Math.min(1,(max??Infinity)/this.measure(s,h))})}return text.apply(this,v)};try{a.draw()}finally{u.text=text;u.titlePlaque=title}return {rect:u.titleRect,rows,toastVisible:u.toastUntil+260>performance.now()}})()`);
const state=p=>p.eval(`(()=>{const a=__jewel.app,r=a.expedition.run;return {puzzle:r.puzzle,mode:r.mode,limit:r.limit,moves:a.board.moves,score:a.board.score,phase:a.phase,finished:r.finished,cells:a.board.cells.map(c=>[c.type,c.special]),targets:a.board.cells.map((c,i)=>r.targets.includes(c.id)?i:-1).filter(i=>i>=0),board:a.ui.boardRect,hits:a.ui.hits.map(({id,x,y,w,h})=>({id,x,y,w,h}))}})()`);
async function tap(p,point,mobile){if(mobile){await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point[0],y:point[1],id:1,radiusX:5,radiusY:5,force:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await p.mouse('mouseMoved',...point);await p.mouse('mousePressed',...point);await p.mouse('mouseReleased',...point);}await p.eval('__jewel.advance(.1)');}
for(const backend of ['webgpu','webgl'])for(const [view,w,h] of [['desktop',1280,800],['phone',390,844],['small-phone',320,568],['landscape',844,390],['short',844,320]]){
 const mobile=view!=='desktop',p=await launch({port:9822,width:w,height:h,mobile});
 try{
  await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await sleep(1000);
  const actualBackend=await p.eval('__jewel.diagnostics().backend');assert.ok(actualBackend.toLowerCase().startsWith(backend),'actual '+backend+' renderer');
  for(let puzzle=0;puzzle<4;puzzle++){
   await p.eval(`__jewel.app.time=12;__jewel.challenge('puzzle',{puzzle:${puzzle}});__jewel.app.expedition.dismissTour();__jewel.app.audio.setMute(true);__jewel.app.prefs.muted=true;__jewel.advance(8);(()=>{const a=__jewel.app;a.time=20;a.living.clock=20;a.shake=0;a.punch=0;a.ui.hideCursor();a.draw()})()`);
   await until(()=>p.eval('__jewel.app.ui.toastUntil+260<=performance.now()'),{timeout:6000,label:'real toast expiry'});
   const before=await state(p),paint=await plaque(p);assert.equal(before.moves,0);assert.equal(before.finished,false);assert.equal(paint.toastVisible,false,'introductory goal toast has expired');
   const words=paint.rows.map(r=>r.text),wanted=paint.rect.w<250?goals[puzzle].slice(1):goals[puzzle].slice(0,1);
   if(label!=='before'){
    for(const word of wanted){const row=paint.rows.find(r=>r.text===word);assert.ok(row,word+' remains visible');assert.ok(row.h>=9.9,word+' legible size');assert.ok(row.x>=paint.rect.x&&row.x+row.w<paint.rect.x+paint.rect.w-100&&row.y>=paint.rect.y&&row.y+row.h<=paint.rect.y+paint.rect.h-5,'goal stays in its side of the plaque');}
    assert.ok(paint.rect.y+paint.rect.h<=before.board.y,'plaque clears board');
    assert.ok(before.hits.every(b=>paint.rect.x+paint.rect.w<=b.x||b.x+b.w<=paint.rect.x||paint.rect.y+paint.rect.h<=b.y||b.y+b.h<=paint.rect.y),'plaque clears inputs');
    await p.eval('__jewel.app.time=80;__jewel.app.prefs.motion=false;__jewel.app.prefs.flash="off"');const later=await plaque(p);assert.deepEqual(later.rows,paint.rows,'goal survives time and reduced motion');assert.deepEqual(await state(p),before,'goal never mutates game or input state');await p.eval('__jewel.app.time=20;__jewel.app.prefs.motion=true;__jewel.app.prefs.flash="full"');
   }else assert.ok(words.includes('PUZZLE'));
   await p.eval('__jewel.app.draw()');const utc=new Date().toISOString();await p.shot(`${out}/${backend}-${view}-puzzle-${puzzle+1}.png`);receipts.push({backend,actualBackend,view,puzzle,utc,state:before,paint});
   if(label!=='before'&&((backend==='webgpu'&&view==='desktop')||(backend==='webgl'&&view==='phone'))){
    const pts=await p.eval(`(${JSON.stringify(pairs[puzzle])}).map(i=>__jewel.project(i))`);for(const pt of pts)await tap(p,pt,mobile);await p.eval('__jewel.advance(30)');
    assert.ok(await p.eval('__jewel.app.expedition.run.finished&&__jewel.app.expedition.run.reason==="PUZZLE COMPLETE"'),'real winning gesture completes puzzle');const ended=await plaque(p);assert.ok(!ended.rows.some(r=>wanted.includes(r.text)),'finished puzzle releases its goal plaque');wins++;
   }
   assert.deepEqual(await p.eval('__jewel.diagnostics().errors'),[]);
  }
  if(label!=='before')for(const [mode,expected] of [['timed','MINUTES'],['moves','MOVES'],['daily','DAILY']]){
   await p.eval(`__jewel.challenge('${mode}',{seed:1});__jewel.advance(8)`);const paint=await plaque(p);assert.ok(paint.rows.some(r=>r.text.includes(mode==='timed'&&paint.rect.h<40?'TIMED':expected)),'non-puzzle title remains');assert.ok(!paint.rows.some(r=>goals.flat().includes(r.text)),'puzzle goal does not leak into another mode');
  }
  assert.ok(!p.logs.some(x=>x.startsWith('EXCEPTION')));
 }finally{p.kill();await sleep(800);}
}
writeFileSync(out+'/capture.json',JSON.stringify({receipts,wins},null,2));console.log(JSON.stringify({out,views:receipts.length,realWinningGestures:wins,passed:true},null,2));
