// B011: actual touch input, full-caption readability and animated tray clearance.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after',backend='webgpu']=process.argv.slice(2),before=label.startsWith('before');
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B011',label+'-'+backend);mkdirSync(out,{recursive:true});
for(const name of ['gpu-game-validation','pc1-browser-gpu-capture'])assert.equal(JSON.parse(readFileSync('C:/trontstack/.agentcoord/claims/'+name+'.json')).owner,'codex-jewelbound-b011-20261021');
const checks=[],frames=[],scenes=[],ok=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name)},overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
let passed=false;const p=await launch({port:9892,width:321,height:320,mobile:true});
const tap=async(x,y)=>{await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(90)};
const idle=()=>until(()=>p.eval('__jewel.app.phase==="idle"'));
const freeze=()=>p.eval(`(()=>{const a=__jewel.app;__jewel.advance(0);a.time=20;a.living.clock=20;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.ui.sc=null;a.ui.cm=[];a.ui.flares=[];a.ui.scoreHit=-9;a.ui.hideCursor();a.expedition.announcement=null;a.draw()})()`);
const snapshot=()=>p.eval(`(()=>{const a=__jewel.app,u=a.ui;return {state:{score:a.board.score,moves:a.board.moves,cells:a.board.cells.map(c=>[c.type,c.special]),mode:a.expedition.run.mode},board:u.boardRect,title:u.titleRect,score:u.narrowScoreRect,aside:u.challengeAsideRect,hits:u.hits,eye:a.eye,target:a.target,draw:window.__lastStatus,inline:window.__inline,metrics:window.__lastStatus.map(t=>({text:t[0],size:t[3],width:u.measure(t[0],t[3]),max:t[6]})),diagnostics:__jewel.diagnostics()}})()`);
const validate=(name,d)=>{ok(name+' no errors',d.diagnostics.errors.length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));if(d.aside){const q=d.aside,shadow={x:q.x-3,y:q.y,w:q.w+6,h:q.h+8};ok(name+' plaque clears board title score and input targets',![d.board,d.title,d.score,...d.hits].filter(Boolean).some(r=>overlap(shadow,r)));ok(name+' readable full glyph widths',d.metrics.length>=2&&d.metrics.every(t=>t.size>=11&&t.width<=t.max+.01));ok(name+' glyphs contained',d.draw.every(([,x,y,h,,,max])=>x>=q.x&&x+max<=q.x+q.w&&y>=q.y&&y+h+3<q.y+q.h));if(q.compactDetail){const caption=d.inline[2]?'ghost '+d.inline[3]:d.inline[1];ok(name+' exact full caption retained',d.draw.slice(1).map(t=>t[0]).join(' ')===caption);}}};
try{
 for(const [w,h]of [[321,320],[340,320],[375,320],[420,419],[460,459],[480,459],[599,360],[390,844],[1280,800]]){
  await p.goto('about:blank');await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
  await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});
  await p.eval(`(()=>{const a=__jewel.app,u=a.ui,fn=u.text,draw=u.challengeInlineStatus;window.__lastStatus=[];window.__inline=[];u.text=function(...args){if(window.__collect)window.__collect.push(args);return fn.apply(this,args)};u.challengeInlineStatus=function(...args){window.__inline=args;window.__collect=[];try{return draw.apply(this,args)}finally{window.__lastStatus=window.__collect;window.__collect=null}};__jewel.challenge('moves',{seed:1});a.expedition.dismissTour();a.audio.setMute(true)})()`);await idle();
  for(let n=0;n<3;n++){const pair=await p.eval('__jewel.state().legalMoves[0]');for(const i of pair)await tap(...await p.eval('__jewel.project('+i+')'));await until(()=>p.eval(`__jewel.state().moves===${n+1}&&__jewel.app.phase==='idle'`));}
  await freeze();await sleep(150);let d=await snapshot();const name=w+'x'+h;
  ok(name+' selected backend',d.diagnostics.backend.toLowerCase().startsWith(backend));ok(name+' three real swaps score450',d.state.score===450&&d.state.moves===3);validate(name,d);
  if(!before&&[321,460,480].includes(w))ok(name+' compact detail fills former fallback',!!d.aside?.compactDetail);
  const file=out+'/'+name+'-moves.png',utc=new Date().toISOString();await p.shot(file);frames.push({name,viewport:[w,h],file,utc,...d});
  if(!before&&d.aside?.compactDetail){
   await p.eval(`(()=>{const a=__jewel.app;a.punch=1.2;a.shake=.85;a.draw()})()`);
   ok(name+' maximum punch/shake clears full plaque shadow',await p.eval(`(()=>{const a=__jewel.app,q=a.ui.challengeAsideRect,points=[[-4.22,4.22,.3],[-4.22,-4.22,.3]].map(v=>project(v,a.vp,a.cssWidth,a.cssHeight));return points.every(v=>v[0]>q.x+q.w+6)&&Array.from({length:64},(_,i)=>gemContours(a.getActor(i),a).flatMap(loop=>Array.from({length:loop.length/2},(_,j)=>loop[j*2]))).flat().every(x=>x>q.x+q.w+6)})()`));
   await freeze();await tap(d.aside.x+8,d.aside.y+8);ok(name+' plaque adds no interaction',await p.eval('__jewel.state().moves===3&&!__jewel.app.panelOpen'));
  }
  if(!before&&[321,460,480].includes(w)){
   for(const [mode,puzzle,ghost]of[['timed',0,false],['timed',0,true],['daily',0,false],['puzzle',0,false],['puzzle',1,false],['puzzle',2,false],['puzzle',3,false]]){
    await p.eval(`__jewel.resume();__jewel.challenge('${mode}',{seed:1,puzzle:${puzzle}})`);await idle();await p.eval(`(()=>{const a=__jewel.app;a.expedition.run.elapsed=60;a.prefs.ghost=${ghost};a.expedition.profile.bests.timed={score:900,samples:[[0,0],[60,300],[120,900]]}})()`);await freeze();d=await snapshot();const id=name+'-'+mode+puzzle+(ghost?'-ghost':'');validate(id,d);scenes.push({id,...d});
    if(ghost||mode==='puzzle'&&puzzle===2||mode==='timed'&&!ghost){const file=out+'/'+id+'.png';await p.shot(file);scenes.at(-1).file=file;}
    if(!ghost&&mode==='timed'&&w<480)ok(id+' long word stays complete in original fallback',!d.aside&&d.draw.map(t=>t[0]).join(' ')==='60 seconds / Resonance scores double');
    if(ghost)ok(id+' ghost target fully readable',!!d.aside?.compactDetail&&d.draw.slice(1).map(t=>t[0]).join(' ')==='ghost 300');
   }
   await p.eval('__jewel.resume();__jewel.challenge("timed",{seed:1})');await idle();await p.eval('__jewel.app.expedition.run.elapsed=60;__jewel.app.prefs.ghost=true;__jewel.app.expedition.profile.bests.timed={score:999999999999999,samples:[[0,999999999999999]]}');await freeze();d=await snapshot();ok(name+' oversized ghost remains complete',!d.aside&&d.draw[0][0]==='60 seconds / ghost 999999999999999');
   await p.eval('__jewel.resume();__jewel.challenge("moves",{seed:1})');await idle();await freeze();await p.eval('__jewel.app.prefs.motion=false;__jewel.app.prefs.highContrast=true;__jewel.app.draw()');validate(name+' comfort',await snapshot());
   await p.eval('__jewel.app.startAACompare();__jewel.app.draw()');ok(name+' AA keeps original fallback',await p.eval('!__jewel.app.ui.challengeAsideRect&&["aa-on","aa-off","aa-done"].every(id=>__jewel.ui().hits.some(t=>t.id===id))'));const done=await p.eval('__jewel.ui().hits.find(t=>t.id==="aa-done")');await tap(done.x+done.w/2,done.y+done.h/2);ok(name+' actual AA Done remains usable',await p.eval('!__jewel.app.aaCompare'));
   await p.eval('__jewel.app.openPanel("play");__jewel.app.draw()');ok(name+' panel hides compact detail',await p.eval('!__jewel.app.ui.challengeAsideRect?.compactDetail'));await p.eval('__jewel.app.closePanel();__jewel.app.expedition.enterPhoto();__jewel.app.draw()');ok(name+' photo hides compact detail',await p.eval('!__jewel.app.ui.challengeAsideRect'));
   await p.eval('__jewel.app.closePanel();__jewel.app.expedition.finish("TRY THIS PUZZLE AGAIN");__jewel.app.draw()');ok(name+' results hide compact detail',await p.eval('__jewel.expedition().run.finished&&!__jewel.app.ui.challengeAsideRect'));
  }
 }
 passed=true;
}finally{p.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed,before,backend,checks,frames,scenes},null,2))}
console.log(JSON.stringify({passed:checks.length,frames:frames.length,scenes:scenes.length,out}));
