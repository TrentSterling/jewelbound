import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2),baseline=label.startsWith('before'),base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B008',label);mkdirSync(out,{recursive:true});
const checks=[],frames=[],scenes=[],ok=(name,v)=>{assert.ok(v,name);checks.push(name);},overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
for(const gl of baseline?[false]:[false,true]){
 const backend=gl?'webgl':'webgpu',p=await launch({port:9882,width:480,height:320,mobile:true});
 try{for(const [w,h]of [[480,320],[568,320],[390,320],[320,240],[480,360],[599,320],[740,360],[844,390],[390,844],[1280,800],[480,640]]){
  const name=backend+'-'+w+'x'+h;
  await p.goto('about:blank');await until(()=>p.eval('location.href==="about:blank"&&!window.__jewel'));await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
  await p.goto(base+(gl?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});
  await p.eval(`(()=>{const u=__jewel.app.ui;for(const n of ['text','plaque']){const fn=u[n];u[n]=function(...args){if(window.__titleDraw)window.__titleDraw[n].push(args);return fn.apply(this,args);};}const draw=u.titlePlaque;u.titlePlaque=function(...args){window.__titleDraw={text:[],plaque:[]};try{return draw.apply(this,args);}finally{window.__lastTitle=window.__titleDraw;window.__titleDraw=null;}};__jewel.challenge('moves',{seed:1});__jewel.app.expedition.dismissTour();})()`);await until(()=>p.eval('__jewel.app.phase==="idle"'));
  const tap=async(x,y)=>{await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(90);};
  for(let n=0;n<3;n++){const pair=await p.eval('__jewel.state().legalMoves[0]');for(const i of pair)await tap(...await p.eval(`__jewel.project(${i})`));await until(()=>p.eval(`__jewel.state().moves===${n+1}&&__jewel.app.phase==="idle"`));}
  const capture=async()=>{await p.eval('(()=>{const a=__jewel.app;__jewel.advance(0);a.time=12;a.living.clock=12;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.ui.hideCursor();a.expedition.announcement=null;a.draw()})()');return p.eval(`(()=>{const a=__jewel.app,u=a.ui,r=document.querySelector('#trontAbout > summary').getBoundingClientRect();return {state:{score:a.board.score,moves:a.board.moves,mode:a.expedition.run.mode,cells:a.board.cells.map(c=>[c.type,c.special])},draw:window.__lastTitle,title:u.titleRect,challenge:u.challengePlaqueRect,arrival:u.stageArrivalRect,board:u.boardRect,hits:__jewel.ui().hits,aside:u.challengeAsideRect||null,about:{x:r.x,y:r.y,w:r.width,h:r.height},diagnostics:__jewel.diagnostics()}})()`);};
  const validate=(id,d)=>{ok(id+' no GPU or script errors',d.diagnostics.errors.length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));if(!baseline){const q=d.title,shadow={x:q.x-3,y:q.y,w:q.w+6,h:q.h+8};ok(id+' full title clears About',!overlap(shadow,d.about));ok(id+' title stays on screen',q.x>=0&&q.x+q.w<=__width&&q.y>=0&&q.y+q.h<=__height);ok(id+' title metadata agrees',(!d.challenge||JSON.stringify(d.challenge)===JSON.stringify(q))&&(!d.arrival||JSON.stringify(d.arrival)===JSON.stringify(q)));}};
  let __width=w,__height=h,d=await capture();ok(name+' requested renderer',d.diagnostics.backend.includes(gl?'WebGL':'WebGPU'));ok(name+' three actual swaps',d.state.score===450&&d.state.moves===3);validate(name,d);ok(name+' full 27 counter at original size',d.draw.text.some(t=>t[0]==='27'&&t[3]===20));
  const file=out+'/'+name+'-moves.png',utc=new Date().toISOString();await p.shot(file);frames.push({name,viewport:[w,h],utc,file,...d});
  if(!baseline&&w===480&&h===320){
   const saved=await p.eval('__jewel.net().hash');await tap(d.about.x+d.about.w/2,d.about.y+d.about.h/2);ok(backend+' actual About tap opens',await p.eval('document.getElementById("trontAbout").open'));ok(backend+' About leaves board unchanged',saved===await p.eval('__jewel.net().hash'));
   await p.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await p.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});ok(backend+' Escape closes About',await p.eval('!document.getElementById("trontAbout").open'));validate(backend+' after About close',await capture());
   for(const [rw,rh]of [[390,844],[568,320],[320,240],[480,320]]){__width=rw;__height=rh;await p.call('Emulation.setDeviceMetricsOverride',{width:rw,height:rh,deviceScaleFactor:1,mobile:true});await until(()=>p.eval(`__jewel.app.cssWidth===${rw}&&__jewel.app.cssHeight===${rh}`));d=await capture();validate(backend+' resized '+rw+'x'+rh,d);ok(backend+' resize preserves board '+rw+'x'+rh,saved===await p.eval('__jewel.net().hash'));}
   for(const [mode,puzzle]of [['timed',0],['daily',0],['puzzle',0],['puzzle',1],['puzzle',2],['puzzle',3],['zen',0]]){
    await p.eval(`__jewel.resume();__jewel.challenge(${JSON.stringify(mode)},{seed:1,puzzle:${puzzle}})`);await until(()=>p.eval('__jewel.app.phase==="idle"'));await p.eval('__jewel.app.expedition.run.elapsed=60');d=await capture();const id=backend+' '+mode+puzzle;validate(id,d);
    const value=mode==='timed'?'1:00':mode==='zen'?'JEWELBOUND':String(await p.eval('__jewel.app.expedition.run.limit'));ok(id+' complete title value remains',d.draw.text.some(t=>t[0]===value));scenes.push({id,...d});await p.shot(out+'/'+backend+'-'+mode+puzzle+'.png');
   }
   await p.eval('__jewel.app.ui.stageCallout({...__jewel.app.fx.stageInfo(),n:2,name:"TIDEPOOL"});__jewel.app.ui.sc.birth=11.5');d=await capture();validate(backend+' stage arrival',d);ok(backend+' arrival retains precedence',!!d.arrival&&!d.challenge);scenes.push({id:backend+' arrival',...d});await p.shot(out+'/'+backend+'-arrival.png');
   await p.eval('__jewel.app.ui.sc=null;__jewel.app.startAACompare()');d=await capture();validate(backend+' AA comparison',d);scenes.push({id:backend+' AA',...d});await p.shot(out+'/'+backend+'-aa.png');for(const id of ['aa-off','aa-done']){const hit=d.hits.find(t=>t.id===id);await tap(hit.x+hit.w/2,hit.y+hit.h/2);ok(backend+' real '+id+' works',await p.eval(id==='aa-off'?'__jewel.app.aaCompare&&__jewel.app.aaCompareBypass':'!__jewel.app.aaCompare'));}
   await p.eval('__jewel.app.prefs.motion=false;__jewel.app.prefs.highContrast=true');validate(backend+' comfort',await capture());
   await p.eval('__jewel.app.expedition.enterPhoto();__jewel.app.draw()');ok(backend+' photo remains available',await p.eval('!!__jewel.app.expedition.photo'));await p.eval('__jewel.app.closePanel()');
  }
 }}finally{p.kill();await sleep(800);}
}
writeFileSync(out+'/receipt.json',JSON.stringify({passed:true,baseline,checks,frames,scenes},null,2));console.log(JSON.stringify({passed:checks.length,frames:frames.length,scenes:scenes.length,out}));
