// B013: actual final-move input, result readability, exact actions and boundaries.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after',backend='webgpu']=process.argv.slice(2),before=label.startsWith('before');
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B013',label+'-'+backend);mkdirSync(out,{recursive:true});
for(const name of ['gpu-game-validation','pc1-browser-gpu-capture'])assert.equal(JSON.parse(readFileSync('C:/trontstack/.agentcoord/claims/'+name+'.json')).owner,'codex-jewelbound-b013-20261021');
const checks=[],frames=[],scenes=[],ok=(name,v)=>{assert.ok(v,name);checks.push(name);console.log('PASS '+name)},overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
let passed=false;const p=await launch({port:9892,width:321,height:320,mobile:true});
const tap=async(x,y)=>{await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100)};
const idle=()=>until(()=>p.eval('__jewel.app.phase==="idle"'));
const button=async id=>{const q=await p.eval(`__jewel.ui().hits.find(h=>h.id===${JSON.stringify(id)})`);assert.ok(q,id);await tap(q.x+q.w/2,q.y+q.h/2);};
const freeze=()=>p.eval(`(()=>{const a=__jewel.app;__jewel.advance(0);a.time=20;a.living.clock=20;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.ui.sc=null;a.ui.cm=[];a.ui.flares=[];a.ui.scoreHit=-9;a.ui.hideCursor();a.expedition.announcement=null;a.draw()})()`);
const snapshot=()=>p.eval(`(()=>{const a=__jewel.app,u=a.ui,r=a.expedition.run,about=document.querySelector('#trontAbout > summary').getBoundingClientRect();return {state:{score:r.score,moves:r.moves,cleared:r.cleared,reason:r.reason,mode:r.mode,puzzle:r.puzzle,finished:r.finished,cells:a.board.cells.map(c=>[c.type,c.special])},board:u.boardRect,title:u.titleRect,hits:u.hits,eye:a.eye,target:a.target,rect:u.narrowResultPlaqueRect||null,draw:window.__lastResult,about:{x:about.x,y:about.y,w:about.width,h:about.height},metrics:window.__lastResult.text.map(t=>({text:t[0],size:t[3],effectiveSize:t[3]*Math.min(1,t[6]/u.measure(t[0],t[3])),width:u.measure(t[0],t[3]),max:t[6]})),decorOrder:window.__decorOrder,diagnostics:__jewel.diagnostics()}})()`);
const validate=(name,d)=>{
 ok(name+' all contrast outlines remain below finished results',d.decorOrder.total>0&&d.decorOrder.after===0);
 if(d.state.mode==='puzzle')ok(name+' puzzle outlines remain below finished results',d.decorOrder.gold>0&&d.decorOrder.goldAfter===0);
 ok(name+' no script or GPU errors',d.diagnostics.errors.length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
 if(!d.rect)return;const q=d.rect,hud=d.hits.filter(t=>['hint','play','journey','demo','sound','settings','coop-open'].includes(t.id));
 const full={x:q.x-6,y:q.y-6,w:q.w+12,h:q.h+14};
 ok(name+' full backing and shadows clear About and HUD',full.x>=0&&full.y>=0&&!overlap(full,d.about)&&hud.every(t=>!overlap(full,t)));
 ok(name+' complete actions at full touch height',d.draw.button.length===2&&d.draw.button.every(([,label,x,y,w,h])=>h===42&&w>=132&&x>=q.x&&x+w<=q.x+q.w&&y>=q.y&&y+h+3<=q.y+q.h));
 ok(name+' full readable glyphs',d.metrics.every(t=>t.effectiveSize>=11-.01)&&(d.draw.text.length>=5));
 ok(name+' text vertically contained including descenders',d.draw.text.every((t,i)=>t[2]>=q.y&&t[2]+d.metrics[i].effectiveSize*1.3<q.y+q.h));
 ok(name+' full reason score and statistics',d.draw.text[0][0]===d.state.reason&&d.draw.text.some(t=>t[0]===d.state.score.toLocaleString())&&d.draw.text.map(t=>t[0]).join(' ').includes(d.state.moves+' moves / '+d.state.cleared+' gems'));
 ok(name+' full accessible continuation labels',d.hits.filter(t=>['again','exp-next-puzzle','exp-endless'].includes(t.id)).every(t=>['Play again','Next puzzle','Return to endless'].includes(t.label)));
};
try{
 for(const [w,h]of [[390,844],[1280,800],[568,320],[321,320],[319,320]]){
  const name=w+'x'+h;await p.goto('about:blank');await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<800});
  await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});
  await p.eval(`(()=>{const a=__jewel.app,u=a.ui;for(const name of ['text','button','plaque']){const fn=u[name];u[name]=function(...args){if(window.__resultCapture)window.__resultCapture[name].push(args);return fn.apply(this,args)}}const poly=u.ink.poly;u.ink.poly=function(...args){if(window.__decorOrder&&args[2]==='#ffffff'){window.__decorOrder.total++;if(window.__resultComplete)window.__decorOrder.after++;}if(window.__decorOrder&&args[2]==='#ffe27a'){window.__decorOrder.gold++;if(window.__resultComplete)window.__decorOrder.goldAfter++;}return poly.apply(this,args)};const fn=u.drawGameOver;u.drawGameOver=function(){window.__resultComplete=false;window.__decorOrder={total:0,after:0,gold:0,goldAfter:0};window.__resultCapture={text:[],button:[],plaque:[]};try{return fn.call(this)}finally{window.__lastResult=window.__resultCapture;window.__resultCapture=null;window.__resultComplete=true}};__jewel.challenge('moves',{seed:1});a.expedition.dismissTour();a.prefs.motion=true;if(!a.prefs.highContrast)a.ui.activate('exp-pref-highContrast');})()`);await idle();
  await p.eval('__jewel.app.board.moves=29');const pair=await p.eval('__jewel.state().legalMoves[0]');for(const i of pair)await tap(...await p.eval(`__jewel.project(${i})`));await until(()=>p.eval('__jewel.expedition().run.finished&&__jewel.app.phase==="idle"'));await freeze();
  let d=await snapshot();ok(name+' final-move fixture finishes through actual touch swap',d.state.finished&&d.state.moves===30&&d.state.score===150);ok(name+' selected backend',d.diagnostics.backend.toLowerCase().startsWith(backend));
  if(before){ok(name+' no baseline errors',d.diagnostics.errors.length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));ok(name+' baseline contrast draw order recorded',d.decorOrder.total>0&&(d.rect?d.decorOrder.after===0:d.decorOrder.after>0));}
  if(!before){ok(name+' narrow scope only',!!d.rect===(w>=320&&w<480&&w>=h&&h<460));validate(name,d);}
  const file=out+'/'+name+'-result.png',utc=new Date().toISOString();await p.shot(file);frames.push({name,viewport:[w,h],file,utc,pair,...d});
  if(!before){
   await p.eval('__jewel.resume()');if(d.rect)for(const [x,y]of [[d.rect.x+6,d.rect.y+70],[d.rect.x+d.rect.w/2,d.rect.y+d.rect.h-8]])await tap(x,y);
   if(d.rect)ok(name+' blank card taps never hit hidden HUD actions',await p.eval('__jewel.expedition().run.finished&&!__jewel.app.panelOpen'));
   await button('again');await idle();const active=await p.eval('__jewel.app.draw();window.__decorOrder');ok(name+' active play restores normal outline order',active.total>0&&active.after===active.total);
   ok(name+' real Play again keeps mode and resets normally',await p.eval('!__jewel.expedition().run.finished&&__jewel.expedition().run.mode==="moves"&&__jewel.state().moves===0'));
   await p.eval('__jewel.app.expedition.finish("RUN COMPLETE");__jewel.app.draw()');await button('exp-endless');await idle();ok(name+' real Return to endless works',await p.eval('!__jewel.expedition().run.finished&&__jewel.expedition().run.mode==="zen"'));
  }
  if(!before&&[390,1280].includes(w)){
   for(const [mode,reason,id]of [['timed','TIME COMPLETE','again'],['daily','DAILY COMPLETE','again'],['puzzle','TRY THIS PUZZLE AGAIN','again'],['puzzle','PUZZLE COMPLETE','exp-next-puzzle']]){
    await p.eval(`__jewel.resume();__jewel.challenge('${mode}',{seed:1,puzzle:0})`);await idle();await p.eval(`__jewel.app.expedition.finish('${reason}')`);await freeze();d=await snapshot();const idName=name+'-'+reason;validate(idName,d);ok(idName+' exact action',d.draw.button[0][0]===id);scenes.push({id:idName,...d});
    await p.eval('__jewel.resume()');await button(id);await idle();ok(idName+' actual action preserves mode',await p.eval(`__jewel.expedition().run.mode==='${mode}'&&!__jewel.expedition().run.finished${id==='exp-next-puzzle'?'&&__jewel.expedition().run.puzzle===1':''}`));
   }
   await p.eval('__jewel.challenge("moves",{seed:1})');await idle();await p.eval('__jewel.app.board.score=1234567;__jewel.app.expedition.finish("RUN COMPLETE");__jewel.app.expedition.highlights=[{name:"PRISMATIC RESONANCE",chain:9}]');await freeze();d=await snapshot();validate(name+' long moment and score',d);ok(name+' long full highlight preserved',d.draw.text.map(t=>t[0]).join(' ').includes('PRISMATIC RESONANCE x9'));scenes.push({id:name+'-long',...d});await p.shot(out+'/'+name+'-long.png');
   await p.eval('__jewel.app.ui.focus="exp-endless";__jewel.app.ui.pointer={id:"exp-endless"};__jewel.app.prefs.motion=false;__jewel.app.prefs.highContrast=true;__jewel.app.draw()');const comfort=await snapshot();validate(name+' focused pressed comfort',comfort);ok(name+' contrast outlines draw beneath result with no late overpaint',comfort.decorOrder.total>0&&comfort.decorOrder.after===0);await p.shot(out+'/'+name+'-focus.png');await p.eval('__jewel.app.ui.pointer=null;__jewel.app.ui.activate("exp-pref-highContrast");__jewel.app.draw()');ok(name+' contrast can be disabled normally',await p.eval('!__jewel.app.prefs.highContrast&&window.__decorOrder.total===0'));await p.eval('__jewel.app.ui.activate("exp-pref-highContrast");__jewel.app.draw()');ok(name+' contrast can be restored below result',await p.eval('__jewel.app.prefs.highContrast&&window.__decorOrder.total>0&&window.__decorOrder.after===0'));
   await p.eval('__jewel.app.expedition.highlights=[{name:"X".repeat(100)}];__jewel.app.draw()');ok(name+' huge word uses untouched fallback',await p.eval('!__jewel.app.ui.narrowResultPlaqueRect'));await p.eval('__jewel.app.expedition.highlights=[]');
   await p.eval('document.getElementById("trontAbout").open=true;__jewel.app.draw()');ok(name+' open About uses original renderer',await p.eval('!__jewel.app.ui.narrowResultPlaqueRect'));await p.eval('document.getElementById("trontAbout").open=false');
   await p.eval('__jewel.app.openPanel("play");__jewel.app.draw()');ok(name+' panel restores original decoration order',await p.eval('!__jewel.app.ui.resultDecorUnder'));await p.eval('__jewel.app.closePanel();__jewel.app.expedition.enterPhoto();__jewel.app.draw()');ok(name+' photo restores original decoration order',await p.eval('!__jewel.app.ui.resultDecorUnder'));await p.eval('__jewel.app.closePanel();__jewel.app.startAACompare();__jewel.app.draw()');ok(name+' AA keeps original decoration order',await p.eval('!__jewel.app.ui.resultDecorUnder'));
  }
 }
 passed=true;
}finally{p.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed,before,backend,checks,frames,scenes},null,2));}
console.log(JSON.stringify({passed:checks.length,frames:frames.length,scenes:scenes.length,out}));
