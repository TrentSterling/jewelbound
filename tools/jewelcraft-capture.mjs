// Matched visual receipts: fixed seed, one real pointer swap, fixed presentation clock.
// node tools/jewelcraft-capture.mjs before|after [file-or-url]
import {launch, until, sleep} from './cdp.mjs';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [label='after',target='index.html']=process.argv.slice(2);
if(!/^[a-z-]+$/.test(label))throw Error('Use a simple receipt label');
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href;
const out=resolve('tools/out/jewelcraft',label);mkdirSync(out,{recursive:true});
const receipts=[];
for(const [name,w,h] of [['desktop',1280,800],['phone',390,844],['landscape',844,390]]){
 const p=await launch({port:9772,width:w,height:h,mobile:name!=='desktop',deviceScaleFactor:1});
 try{
  await p.goto(base+'#solo=1');await until(()=>p.eval(`(()=>{if(document.getElementById('fatal-buttons')?.style.display==='block')throw Error(document.getElementById('failure-detail').textContent);return !!window.__jewel?.ready})()`),{timeout:60000});
  await p.eval('__jewel.challenge("zen",{seed:1})');
  await until(()=>p.eval('__jewel.app.phase==="idle"'),{timeout:20000});await sleep(500);
  const pair=await p.eval('__jewel.state().legalMoves[0]');
  const pts=await p.eval(`(${JSON.stringify(pair)}).map(i=>__jewel.project(i))`);
  await p.mouse('mouseMoved',...pts[0]);await p.mouse('mousePressed',...pts[0]);
  for(let i=1;i<=8;i++){await p.mouse('mouseMoved',pts[0][0]+(pts[1][0]-pts[0][0])*i/8,pts[0][1]+(pts[1][1]-pts[0][1])*i/8);await sleep(20);}
  await p.mouse('mouseReleased',...pts[1]);
  await until(()=>p.eval('__jewel.state().moves===1&&__jewel.app.phase==="idle"'),{timeout:20000});await sleep(1800);
  await p.eval(`(()=>{const a=__jewel.app;__jewel.advance(0);a.time=12;a.living.clock=12;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.ui.hideCursor();a.draw();})()`);
  await p.shot(out+'/'+name+'-board.png');
  if(name!=='landscape'){
   for(const tab of ['play','audio']){
    await p.eval(`__jewel.app.openPanel(${JSON.stringify(tab)});__jewel.advance(.4)`);
    await p.shot(out+'/'+name+'-'+tab+'.png');
   }
  }
  const d=await p.eval('__jewel.diagnostics()');
  if(d.errors.length||p.logs.some(x=>x.startsWith('EXCEPTION')))throw Error(JSON.stringify(d));
  receipts.push({name,viewport:[w,h],pair,state:await p.eval('({score:__jewel.state().score,moves:__jewel.state().moves,cells:__jewel.state().cells.map(c=>[c.type,c.special])})'),backend:d.backend,errors:d.errors});
 }catch(error){console.error(p.logs.slice(-8));throw error;}finally{p.kill();await sleep(800);}
}
writeFileSync(out+'/capture.json',JSON.stringify(receipts,null,2));console.log(JSON.stringify({out,views:receipts.map(({name,state,backend,errors})=>({name,score:state.score,moves:state.moves,backend,errors}))},null,2));
