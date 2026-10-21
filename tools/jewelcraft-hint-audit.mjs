// B004 matched real Hint input, selected/marked/contrast cues and swap follow-through.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2),base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href;
const out=resolve('tools/out/rounds/B004',label);mkdirSync(out,{recursive:true});const receipts=[];let swaps=0;
const state=p=>p.eval(`(()=>{const a=__jewel.app,r=a.expedition.run;return {mode:r.mode,puzzle:r.puzzle,score:a.board.score,best:a.best,displayScore:a.displayScore,moves:a.board.moves,cells:a.board.cells.map(c=>[c.type,c.special]),pair:a.hintCells,selected:a.selected,phase:a.phase,targets:a.board.cells.map((c,i)=>r.targets?.includes(c.id)?i:-1).filter(i=>i>=0),hits:a.ui.hits.map(({id,x,y,w,h})=>({id,x,y,w,h}))}})()`);
const paint=p=>p.eval(`(()=>{const a=__jewel.app,p=a.ui.ink,f=p.poly,paths=[];p.poly=function(points,width,col,alpha){paths.push({points:[...points],width,col,alpha})};try{a.ui.drawHintPair?.()}finally{p.poly=f}return paths})()`);
async function tap(p,pt,mobile){if(mobile){await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt[0],y:pt[1],id:1,radiusX:5,radiusY:5,force:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await p.mouse('mouseMoved',...pt);await p.mouse('mousePressed',...pt);await p.mouse('mouseReleased',...pt);}await p.eval('__jewel.advance(.1)');}
const hint=async(p,mobile)=>{const h=await p.eval('__jewel.ui().hits.find(h=>h.id==="hint")');assert.ok(h);await tap(p,[h.x+h.w/2,h.y+h.h/2],mobile);};
for(const backend of ['webgpu','webgl'])for(const [view,w,h] of [['desktop',1280,800],['phone',390,844],['small-phone',320,568],['short',844,320]]){
 const mobile=view!=='desktop',p=await launch({port:9830,width:w,height:h,mobile});
 try{
  await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await until(()=>p.eval("(()=>{const n=document.getElementById('loading');return !n||getComputedStyle(n).display==='none'||Number(getComputedStyle(n).opacity)===0})()"),{label:'loading overlay fully gone'});
  const actualBackend=await p.eval('__jewel.diagnostics().backend');assert.ok(actualBackend.toLowerCase().startsWith(backend));
  const seeds=await p.eval(`(()=>{const a=__jewel.app,seeds={};for(let s=1;s<80;s++){__jewel.challenge('zen',{seed:s});__jewel.advance(3);const pair=a.bestMove(false),axis=Math.abs(pair[1]-pair[0])===1?'horizontal':'vertical';seeds[axis]??=s;if(Object.keys(seeds).length===2)break;}return seeds})()`);assert.equal(Object.keys(seeds).length,2);
  for(const scene of ['horizontal','vertical','contrast','marked']){
   const puzzle=scene==='marked';await p.eval(`(()=>{const a=__jewel.app;a.time=12;__jewel.challenge('${puzzle?'puzzle':'zen'}',${JSON.stringify(puzzle?{puzzle:0}:{seed:seeds[scene==='vertical'?'vertical':'horizontal']})});a.expedition.dismissTour();a.audio.setMute(true);a.prefs.highContrast=${scene==='contrast'};__jewel.advance(3);a.time=20;a.living.clock=20;a.ui.toastUntil=0;a.best=0;a.displayScore=0;a.shake=0;a.punch=0;a.ui.hideCursor();a.draw()})()`);
   // Selecting the actual suggested gem, then pressing the actual Hint button.
   const selected=await p.eval('__jewel.app.bestMove(false)[0]');await tap(p,await p.eval(`__jewel.project(${selected})`),mobile);await hint(p,mobile);
   await p.eval('__jewel.app.ui.hideCursor();__jewel.app.draw()');
   const before=await state(p),paths=await paint(p);assert.equal(before.selected,selected);assert.equal(before.pair.length,2);
   if(label!=='before'){
    assert.equal(paths.length,10);assert.ok(paths.every(v=>v.points.every(Number.isFinite)));
    assert.deepEqual(await state(p),before,'drawing preserves all board/input state');
    await p.eval('__jewel.app.prefs.motion=false;__jewel.app.prefs.flash="off"');assert.deepEqual(await paint(p),paths,'no time-driven motion/flash added');
    await p.eval('__jewel.app.prefs.motion=true;__jewel.app.prefs.flash="full"');
   }
   const utc=new Date().toISOString();await p.shot(`${out}/${backend}-${view}-${scene}.png`);receipts.push({view,backend,actualBackend,scene,utc,state:before,paths});
   if(label!=='before'&&scene==='vertical'){
    // First gem is already selected; one real pointer/touch selects its hinted neighbour.
    await tap(p,await p.eval(`__jewel.project(${before.pair[1]})`),mobile);await p.eval('__jewel.advance(5)');assert.ok(await p.eval('__jewel.app.board.moves===1&&__jewel.app.board.score>0'));assert.equal((await paint(p)).length,0);swaps++;
   }
   if(label!=='before'&&scene==='horizontal'){
    await p.eval('__jewel.advance(4.1)');assert.equal((await paint(p)).length,0,'original four-second hint expiry');
   }
   assert.deepEqual(await p.eval('__jewel.diagnostics().errors'),[]);
  }
  assert.ok(!p.logs.some(l=>l.startsWith('EXCEPTION')));
 }finally{p.kill();await sleep(800);}
}
writeFileSync(out+'/capture.json',JSON.stringify({receipts,swaps,passed:true},null,2));console.log(JSON.stringify({out,frames:receipts.length,actualHintedSwaps:swaps,passed:true},null,2));
