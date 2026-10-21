// B004: private hints stay local; real suggested swaps still reach both players.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='local']=process.argv.slice(2),base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B004/coop-'+label);mkdirSync(out,{recursive:true});
let A,B;const receipts=[],check=(name,value)=>{assert.ok(value,name);receipts.push({name,utc:new Date().toISOString()});console.log('PASS '+name)};
async function tap(p,pt,mobile){if(mobile){await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt[0],y:pt[1],id:1,radiusX:5,radiusY:5,force:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await p.mouse('mouseMoved',...pt);await p.mouse('mousePressed',...pt);await p.mouse('mouseReleased',...pt);}await sleep(80);}
try{
 A=await launch({port:9831});await A.goto(base+'#solo=1');await until(()=>A.eval('!!window.__jewel?.ready'),{timeout:60000});await sleep(500);
 await A.eval('__jewel.app.expedition.dismissTour();__jewel.app.openPanel("coop");__jewel.app.ui.activate("coop-host")');const code=await until(()=>A.eval('__jewel.net().code'));
 B=await launch({port:9832,width:390,height:844,mobile:true});await B.goto(base+'?webgl=1#room='+code);await until(()=>B.eval('!!window.__jewel?.ready'),{timeout:60000});await until(async()=>await A.eval('__jewel.net().connected')&&await B.eval('__jewel.net().connected&&__jewel.app.coop.synced'),{timeout:60000});
 for(const [name,p]of[['host',A],['peer',B]]){await p.eval('__jewel.app.expedition.dismissTour();__jewel.app.closePanel();__jewel.app.audio.setMute(true)');check(name+' private and correct renderer',await p.eval('!__jewel.app.coop.publicRoom&&__jewel.net().mode!=="public"')&&(await p.eval('__jewel.diagnostics().backend')).toLowerCase().startsWith(name==='host'?'webgpu':'webgl'));}
 for(const [name,p,other,mobile]of[['host',A,B,false],['peer',B,A,true]]){
  await A.eval('__jewel.challenge("zen",{seed:1})');await until(async()=>await A.eval('__jewel.app.phase==="idle"')&&await B.eval('__jewel.app.phase==="idle"&&__jewel.app.board.moves===0'),{timeout:30000});await until(async()=>await A.eval('__jewel.net().hash')===await B.eval('__jewel.net().hash'),{label:'settled shared board hash'});await sleep(300);
  for(const q of [A,B])await q.eval('__jewel.app.debugManual=true;__jewel.app.hintCells=[];__jewel.app.hintUntil=0;__jewel.app.selected=-1');
  const hashes=[await A.eval('__jewel.net().hash'),await B.eval('__jewel.net().hash')];
  const h=await p.eval('__jewel.ui().hits.find(h=>h.id==="hint")');await tap(p,[h.x+h.w/2,h.y+h.h/2],mobile);
  const pair=await p.eval('__jewel.app.hintCells');check(name+' chosen hint stays local',pair.length===2&&(await other.eval('__jewel.app.hintCells.length'))===0);
  check(name+' Hint leaves both board hashes unchanged',JSON.stringify(hashes)===JSON.stringify([await A.eval('__jewel.net().hash'),await B.eval('__jewel.net().hash')]));
  await p.shot(out+'/'+name+'-hint.png');for(const q of [A,B])await q.eval('__jewel.resume()');
  for(const i of pair)await tap(p,await p.eval(`__jewel.project(${i})`),mobile);
  await until(async()=>await A.eval('__jewel.app.board.moves===1&&__jewel.app.phase==="idle"')&&await B.eval('__jewel.app.board.moves===1&&__jewel.app.phase==="idle"'),{timeout:30000});
  await until(async()=>await A.eval('__jewel.net().hash')===await B.eval('__jewel.net().hash'));
  check(name+' actual hinted swap scores and synchronizes',await A.eval('__jewel.app.board.score>0')&&await B.eval('__jewel.app.board.score>0'));
  check(name+' swap clears hint on both players',await A.eval('__jewel.app.hintCells.length===0')&&await B.eval('__jewel.app.hintCells.length===0'));
 }
 for(const [name,p]of[['host',A],['peer',B]])check(name+' no GPU or script errors',(await p.eval('__jewel.diagnostics().errors')).length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
}finally{A?.kill();B?.kill();await sleep(800);writeFileSync(out+'/results.json',JSON.stringify({passed:receipts.length===12,receipts},null,2));}
console.log(receipts.length+' passed');
