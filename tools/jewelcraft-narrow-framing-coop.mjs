// B010: lower-row input across private players with different camera framing.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='local']=process.argv.slice(2),base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B010/coop-'+label);mkdirSync(out,{recursive:true});
let A,B,passed=false;const receipts=[],check=(name,value)=>{assert.ok(value,name);receipts.push({name,utc:new Date().toISOString()});console.log('PASS '+name)};
async function touch(p,type,pt){await p.call('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:pt[0],y:pt[1],id:1,radiusX:5,radiusY:5,force:1}]});}
try{
 A=await launch({port:9882,width:375,height:320,mobile:true});await A.goto(base+'#solo=1');await until(()=>A.eval('!!window.__jewel?.ready'),{timeout:60000});await A.eval('__jewel.app.expedition.dismissTour();__jewel.app.openPanel("coop");__jewel.app.ui.activate("coop-host")');const code=await until(()=>A.eval('__jewel.net().code'));
 B=await launch({port:9883,width:390,height:844,mobile:true});await B.goto(base+'?webgl=1#room='+code);await until(()=>B.eval('!!window.__jewel?.ready'),{timeout:60000});await until(async()=>await A.eval('__jewel.net().connected')&&await B.eval('__jewel.net().connected&&__jewel.app.coop.synced'),{timeout:60000});
 for(const [name,p,backend]of[['host',A,'webgpu'],['peer',B,'webgl']]){await p.eval('__jewel.app.expedition.dismissTour();__jewel.app.closePanel();__jewel.app.audio.setMute(true)');check(name+' private room and renderer',await p.eval('!__jewel.app.coop.publicRoom&&__jewel.net().mode!=="public"')&&(await p.eval('__jewel.diagnostics().backend')).toLowerCase().startsWith(backend));}
 for(const [name,p,drag]of[['host',A,false],['peer',B,true]]){
  if(drag){await B.call('Emulation.setDeviceMetricsOverride',{width:390,height:320,deviceScaleFactor:1,mobile:true});await until(()=>B.eval('__jewel.app.cssWidth===390&&__jewel.app.cssHeight===320'));}
  await A.eval('__jewel.challenge("zen",{seed:1})');await until(async()=>await A.eval('__jewel.app.phase==="idle"&&__jewel.app.board.moves===0')&&await B.eval('__jewel.app.phase==="idle"&&__jewel.app.board.moves===0'));await until(async()=>await A.eval('__jewel.net().hash')===await B.eval('__jewel.net().hash'));await sleep(300);
  const pts=await p.eval('[60,52].map(i=>__jewel.project(i))');
  if(drag){await touch(p,'touchStart',pts[0]);for(let k=1;k<=6;k++)await touch(p,'touchMove',[pts[0][0]+(pts[1][0]-pts[0][0])*k/6,pts[0][1]+(pts[1][1]-pts[0][1])*k/6]);await touch(p,'touchEnd',pts[1]);}
  else for(const pt of pts){await touch(p,'touchStart',pt);await touch(p,'touchEnd',pt);await sleep(120);}
  await until(async()=>await A.eval('__jewel.app.board.moves===1&&__jewel.app.phase==="idle"')&&await B.eval('__jewel.app.board.moves===1&&__jewel.app.phase==="idle"'));
  await until(async()=>await A.eval('__jewel.net().hash')===await B.eval('__jewel.net().hash'));
  check(name+' lower-row '+(drag?'drag after rotation':'tap')+' synchronizes',await A.eval('__jewel.app.board.score===150')&&await B.eval('__jewel.app.board.score===150'));
  for(const [who,q]of[['host',A],['peer',B]]){check(name+' action leaves '+who+' controls closed',await q.eval('!__jewel.app.panelOpen'));await q.shot(out+'/'+name+'-swap-'+who+'.png');}
 }
 for(const [name,p]of[['host',A],['peer',B]])check(name+' no GPU or script errors',(await p.eval('__jewel.diagnostics().errors')).length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
 passed=true;
}finally{A?.kill();B?.kill();await sleep(800);writeFileSync(out+'/results.json',JSON.stringify({passed,receipts},null,2));}
console.log(receipts.length+' passed');
