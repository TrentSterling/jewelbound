// B003 private host/phone-peer goal rendering and actual winning pointer input.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const target=process.argv[2]||'index.html',label=process.argv[3]||'local',base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href;
const out=resolve('tools/out/rounds/B003/coop-'+label);mkdirSync(out,{recursive:true});
const goals=['CLEAR MARKED GEMS','FORGE A BLAST GEM','FORGE A PRISM','REACH A 5-WAVE CHAIN'],pairs=[[1,2],[28,36],[53,61],[11,19]],receipts=[];
let A,B;
const check=(name,yes)=>{assert.ok(yes,name);receipts.push({name,utc:new Date().toISOString()});console.log('PASS '+name);};
const text=p=>p.eval(`(()=>{const a=__jewel.app,u=a.ui,t=u.text,f=u.titlePlaque,rows=[];let inside=false;u.titlePlaque=function(...v){inside=true;try{return f.apply(this,v)}finally{inside=false}};u.text=function(...v){if(inside)rows.push(String(v[0]));return t.apply(this,v)};try{a.draw()}finally{u.text=t;u.titlePlaque=f}return rows})()`);
const privateOnly=p=>p.eval('!__jewel.app.coop.publicRoom&&__jewel.net().mode!=="public"');
try{
 A=await launch({port:9824});await A.goto(base+'#solo=1');await until(()=>A.eval('!!window.__jewel?.ready'),{timeout:60000});await sleep(1000);
 await A.eval('__jewel.app.expedition.dismissTour();__jewel.app.openPanel("coop");__jewel.app.ui.activate("coop-host")');
 const code=await until(()=>A.eval('__jewel.net().code'),{label:'private code'});
 B=await launch({port:9825,width:390,height:844,mobile:true});await B.goto(base+'?webgl=1#room='+code);await until(()=>B.eval('!!window.__jewel?.ready'),{timeout:60000});
 await until(async()=>await A.eval('__jewel.net().connected')&&await B.eval('__jewel.net().connected&&__jewel.app.coop.synced'),{timeout:60000,label:'private connection'});
 for(const [name,p]of[['host',A],['peer',B]]){check(name+' stays private',await privateOnly(p));const backend=await p.eval('__jewel.diagnostics().backend');assert.ok(backend.toLowerCase().startsWith(name==='host'?'webgpu':'webgl'));receipts.at(-1).actualBackend=backend;await p.eval('__jewel.app.expedition.dismissTour();__jewel.app.closePanel();__jewel.app.audio.setMute(true)');}
 for(let i=0;i<4;i++){
  await A.eval(`__jewel.challenge('puzzle',{puzzle:${i}})`);
  await until(()=>B.eval(`__jewel.app.expedition.run.mode==='puzzle'&&__jewel.app.expedition.run.puzzle===${i}&&!__jewel.app.expedition.run.finished`),{label:'peer puzzle'});
  await until(async()=>await A.eval('__jewel.app.phase==="idle"')&&await B.eval('__jewel.app.phase==="idle"'),{label:'settled boards'});await sleep(3300);
  for(const [name,p]of[['host',A],['peer',B]]){check(`puzzle ${i+1} goal on ${name}`,(await text(p)).includes(goals[i]));await p.shot(out+`/puzzle-${i+1}-${name}.png`);}
  const p=i<2?A:B,points=await p.eval(`(${JSON.stringify(pairs[i])}).map(i=>__jewel.project(i))`);
  for(const pt of points){if(p===B){await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt[0],y:pt[1],id:1,radiusX:5,radiusY:5,force:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await p.mouse('mouseMoved',...pt);await p.mouse('mousePressed',...pt);await p.mouse('mouseReleased',...pt);}await sleep(100);}
  await until(async()=>await A.eval('__jewel.app.expedition.run.finished')&&await B.eval('__jewel.app.expedition.run.finished'),{timeout:40000,label:'shared puzzle completion'});
  check(`puzzle ${i+1} completes through ${i<2?'host pointer':'peer touch'}`,await A.eval('__jewel.app.expedition.run.reason==="PUZZLE COMPLETE"')&&await B.eval('__jewel.app.expedition.run.reason==="PUZZLE COMPLETE"'));
  await until(async()=>await A.eval('__jewel.net().hash')===await B.eval('__jewel.net().hash'),{label:'matching board hashes'});
  check(`puzzle ${i+1} releases both goal plaques`,!(await text(A)).includes(goals[i])&&!(await text(B)).includes(goals[i]));
 }
 for(const [name,p]of[['host',A],['peer',B]])check(name+' has no GPU/script error',(await p.eval('__jewel.diagnostics().errors')).length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
}finally{A?.kill();B?.kill();await sleep(800);writeFileSync(out+'/results.json',JSON.stringify({passed:receipts.length===20,receipts},null,2));}
console.log(receipts.length+' passed');
