import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='local']=process.argv.slice(2),base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B008/coop-'+label);mkdirSync(out,{recursive:true});
let A,B,passed=false;const checks=[],ok=(name,v)=>{assert.ok(v,name);checks.push({name,utc:new Date().toISOString()});console.log('PASS '+name);};
const tap=async(p,x,y)=>{await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(80);};
const synced=()=>until(async()=>await A.eval('__jewel.app.phase==="idle"')&&await B.eval('__jewel.app.phase==="idle"')&&await A.eval('__jewel.net().hash')===await B.eval('__jewel.net().hash'),{timeout:60000});
const swap=async(p)=>{const n=await p.eval('__jewel.state().moves'),pair=await p.eval('__jewel.state().legalMoves[0]');for(const i of pair)await tap(p,...await p.eval(`__jewel.project(${i})`));await until(()=>p.eval(`__jewel.state().moves===${n+1}`));await synced();};
const counter=(p,value)=>p.eval(`(()=>{const q=__jewel.app.ui.challengePlaqueRect,r=document.querySelector('#trontAbout > summary').getBoundingClientRect();return q&&window.__titleText.some(t=>t[0]===${JSON.stringify(value)}&&t[3]===20)&&!(q.x-3<r.right&&q.x+q.w+3>r.left&&q.y<r.bottom&&q.y+q.h+8>r.top)})()`);
try{
 A=await launch({port:9884,width:480,height:320,mobile:true});await A.goto(base+'#solo=1');await until(()=>A.eval('!!window.__jewel?.ready'),{timeout:60000});await A.eval('__jewel.app.expedition.dismissTour();__jewel.app.openPanel("coop");__jewel.app.ui.activate("coop-host")');const code=await until(()=>A.eval('__jewel.net().code'));
 B=await launch({port:9885,width:390,height:320,mobile:true});await B.goto(base+'?webgl=1#room='+code);await until(()=>B.eval('!!window.__jewel?.ready'),{timeout:60000});await until(async()=>await A.eval('__jewel.net().connected')&&await B.eval('__jewel.net().connected&&__jewel.app.coop.synced'),{timeout:60000});
 for(const [name,p,backend]of [['host',A,'WebGPU'],['peer',B,'WebGL']]){await p.eval(`(()=>{const a=__jewel.app,u=a.ui,text=u.text,draw=u.titlePlaque;u.text=function(...args){if(window.__inTitle)window.__titleText.push(args);return text.apply(this,args);};u.titlePlaque=function(...args){window.__titleText=[];window.__inTitle=true;try{return draw.apply(this,args);}finally{window.__inTitle=false;}};a.expedition.dismissTour();a.closePanel()})()`);ok(name+' private room and renderer',await p.eval('!__jewel.app.coop.publicRoom')&&(await p.eval('__jewel.diagnostics().backend')).includes(backend));}
 await A.eval('__jewel.challenge("moves",{seed:1})');await synced();for(let i=0;i<3;i++)await swap(A);ok('three actual host swaps synchronize',await A.eval('__jewel.state().score===450&&__jewel.state().moves===3')&&await B.eval('__jewel.state().score===450&&__jewel.state().moves===3'));
 for(const [name,p]of [['host',A],['peer',B]]){ok(name+' full 27 counter clears About',await counter(p,'27'));await p.shot(out+'/'+name+'-title.png');}
 await swap(B);ok('actual peer swap updates both visible counters',await counter(A,'26')&&await counter(B,'26'));
 const hash=await B.eval('__jewel.net().hash');await B.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await until(()=>B.eval('__jewel.app.cssHeight===844'));ok('peer portrait preserves shared board and clear counter',hash===await B.eval('__jewel.net().hash')&&await counter(B,'26'));
 await B.call('Emulation.setDeviceMetricsOverride',{width:390,height:320,deviceScaleFactor:1,mobile:true});await until(()=>B.eval('__jewel.app.cssHeight===320'));ok('peer landscape counter stays clear without reset',hash===await B.eval('__jewel.net().hash')&&await counter(B,'26'));
 await A.eval('__jewel.app.expedition.finish("RUN COMPLETE")');await until(()=>B.eval('__jewel.expedition().run.finished'));ok('shared finished results keep original title behavior',await A.eval('!__jewel.app.ui.challengePlaqueRect&&!!__jewel.app.ui.resultPlaqueRect')&&await B.eval('!__jewel.app.ui.challengePlaqueRect'));
 for(const [name,p]of [['host',A],['peer',B]])ok(name+' no runtime errors',(await p.eval('__jewel.diagnostics().errors')).length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));passed=true;
}finally{A?.kill();B?.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed,checks},null,2));}
console.log(checks.length+' passed');
