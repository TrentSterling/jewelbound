// B010: real browser input and actual mesh bounds in compact landscape.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2),before=label.startsWith('before');
const captureOnly=process.env.CAPTURE_ONLY==='1';
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B010',label);mkdirSync(out,{recursive:true});
const receipts=[],frames=[],scenes=[],check=(name,value,detail)=>{assert.ok(value,name+' '+JSON.stringify(detail??''));receipts.push({name,detail});console.log('PASS '+name)};
async function touch(p,type,pt){await p.call('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:pt[0],y:pt[1],id:1,radiusX:5,radiusY:5,force:1}]});}
async function tap(p,pt){await touch(p,'touchStart',pt);await touch(p,'touchEnd',pt);await p.eval('__jewel.advance(.1)');}
const reset=p=>p.eval(`(()=>{const a=__jewel.app;__jewel.challenge('zen',{seed:1});a.expedition.dismissTour();a.closePanel();a.audio.setMute(true);a.prefs.motion=true;a.prefs.highContrast=false;a.prefs.flash='full';__jewel.advance(3);a.time=20;a.living.clock=20;a.ui.toastUntil=0;a.expedition.announcement=null;a.ui.sc=null;a.ui.scoreHit=-9;a.ui.cm=[];a.ui.flares=[];a.best=0;a.displayScore=0;a.shake=0;a.punch=0;a.selected=-1;a.hover=-1;a.ui.hideCursor();a.hintCells=[];a.hintUntil=0;a.draw()})()`);
const state=p=>p.eval(`(()=>{const a=__jewel.app;return {cells:a.board.cells.map(c=>[c.type,c.special]),score:a.board.score,moves:a.board.moves,phase:a.phase,selected:a.selected,board:a.ui.boardRect,hits:a.ui.hits.map(({id,x,y,w,h})=>({id,x,y,w,h})),eye:a.eye,target:a.target,framing:cabinetFraming(a.cssWidth,a.cssHeight)}})()`);
const geometry=p=>p.eval(`(()=>{const a=__jewel.app,rail=Math.min(...a.ui.hits.filter(h=>['hint','play','journey','demo','sound','settings','coop-open'].includes(h.id)).map(h=>h.y)),bounds=[];
 for(let i=0;i<64;i++){const ac=a.getActor(i),points=gemContours(ac,a).flatMap(loop=>Array.from({length:loop.length/2},(_,j)=>[loop[j*2],loop[j*2+1]]));bounds.push({i,top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1])),pick:a.pick(...__jewel.project(i))});}
 const tray=[[-4.22,4.22,.3],[4.22,4.22,.3],[-4.22,-4.22,.3],[4.22,-4.22,.3]].map(v=>project(v,a.vp,a.cssWidth,a.cssHeight));
 const crownData=gemGeometry(5,7).data(),crownModel=trs([0,4.98+Math.sin(a.time)*.03,.05],[.06,Math.sin(a.time*.35)*.35,0],[.90,1.23,.9]),crownVP=matMul(a.vp,crownModel),crown=[];
 for(let i=0;i<crownData.length;i+=12)crown.push(project(Array.from(crownData.slice(i,i+3)),crownVP,a.cssWidth,a.cssHeight));
 return {crownTop:Math.min(...crown.map(p=>p[1])),rail,title:a.ui.titleRect,score:a.ui.narrowScoreRect,bounds,trayLeft:Math.min(...tray.map(v=>v[0])),trayRight:Math.max(...tray.map(v=>v[0])),trayTop:Math.min(...tray.map(v=>v[1])),trayBottom:Math.max(...tray.map(v=>v[1]))}})()`);
for(const backend of before?['webgpu']:['webgpu','webgl']){
 const p=await launch({port:9881,width:375,height:320,mobile:true});
 try{
  await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await until(()=>p.eval("(()=>{const n=document.getElementById('loading');return !n||getComputedStyle(n).display==='none'||Number(getComputedStyle(n).opacity)===0})()"));
  await p.browser('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out});
  const actualBackend=await p.eval('__jewel.diagnostics().backend');check(backend+' selected renderer',actualBackend.toLowerCase().startsWith(backend));
  for(const [w,h]of (process.env.FOCUSED_PREVIEW==='1'?[[375,320],[390,320]]:[[321,320],[375,320],[390,320],[414,340],[480,320],[568,320],[599,360],[460,459],[480,459],[480,319],[320,240],[600,400],[844,320],[844,460],[390,390],[390,844],[1280,800]])){
   await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
   // Start each matched scene fresh so prior scored swaps cannot leave FX or score-hit history.
   await p.goto('about:blank');await until(()=>p.eval('location.href==="about:blank"&&!window.__jewel'));
   await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await until(()=>p.eval("(()=>{const n=document.getElementById('loading');return !n||getComputedStyle(n).display==='none'||Number(getComputedStyle(n).opacity)===0})()"));
   await until(()=>p.eval(`__jewel.app.cssWidth===${w}&&__jewel.app.cssHeight===${h}`));await reset(p);
   const name=backend+'-'+w+'x'+h,initial=await state(p),g=await geometry(p);check(name+' all cell centres pick their original cells',g.bounds.every(b=>b.pick===b.i));
   check(name+' seven controls remain in viewport',initial.hits.filter(h=>['hint','play','journey','demo','sound','settings','coop-open'].includes(h.id)).length===7&&initial.hits.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=w&&r.y+r.h<=h));
   if(!before&&initial.framing.narrowFit){check(name+' tray and score clear each other',g.score.x>g.trayRight&&g.score.y+g.score.h+8<g.rail,g);check(name+' full tray clears actual title and rail',g.crownTop>=g.title.y+g.title.h+8&&g.trayBottom<g.rail,g);check(name+' all gems clear rail',g.bounds.every(b=>b.bottom<g.rail));}
   const diagnostics=await p.eval('__jewel.diagnostics()');check(name+' scene renderer and diagnostics',diagnostics.backend.toLowerCase().startsWith(backend)&&diagnostics.errors.length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
   const utc=new Date().toISOString();await p.shot(out+'/'+name+'-board.png');frames.push({name,utc,initial,geometry:g,diagnostics});
   if(before||captureOnly||(!initial.framing.narrowFit&&h<460))continue;
   // Edge taps use the lower quarter of each bottom-row cell, not a debug swap.
   for(let i=56;i<64;i++){await p.eval('__jewel.app.selected=-1;__jewel.app.draw()');const pt=await p.eval(`(()=>{const q=cellXY(${i});q[1]-=.28;q[2]=.37;return project(q,__jewel.app.vp,${w},${h}).slice(0,2)})()`);await tap(p,pt);check(name+' lower edge selects '+i,await p.eval(`__jewel.app.selected===${i}&&!__jewel.app.panelOpen`));}
   await reset(p);for(const i of [60,52])await tap(p,await p.eval(`__jewel.project(${i})`));await p.eval('__jewel.advance(4)');check(name+' actual bottom-row tap swap scores',await p.eval('__jewel.app.board.moves===1&&__jewel.app.board.score===150'));
   await reset(p);const pair=await p.eval('[60,52].map(i=>__jewel.project(i))');await touch(p,'touchStart',pair[0]);for(let k=1;k<=6;k++)await touch(p,'touchMove',[pair[0][0]+(pair[1][0]-pair[0][0])*k/6,pair[0][1]+(pair[1][1]-pair[0][1])*k/6]);await touch(p,'touchEnd',pair[1]);await p.eval('__jewel.advance(4)');check(name+' actual bottom-row drag swap scores',await p.eval('__jewel.app.board.moves===1&&__jewel.app.board.score===150'));
   if(initial.framing.narrowFit){
    await reset(p);await p.eval('__jewel.app.selected=60;__jewel.app.prefs.highContrast=true;__jewel.app.punch=1.2;__jewel.app.shake=.85;__jewel.app.draw()');const fx=await geometry(p);check(name+' max punch and contrast keep gems clear',fx.bounds.every(b=>b.bottom<fx.rail)&&fx.crownTop>58&&fx.trayBottom<fx.rail&&fx.score.x>fx.trayRight,fx);await p.shot(out+'/'+name+'-punch.png');
    const sweep=await p.eval(`(()=>{const a=__jewel.app,verts=gemGeometry(5,7).data();let top=Infinity;for(let t=0;t<40;t+=.11){a.time=t;a.punch=1.2;a.shake=.85;a.updateCamera();const m=matMul(a.vp,trs([0,4.98+Math.sin(t)*.03,.05],[.06,Math.sin(t*.35)*.35,0],[.90,1.23,.9]));for(let i=0;i<verts.length;i+=12)top=Math.min(top,project(Array.from(verts.slice(i,i+3)),m,a.cssWidth,a.cssHeight)[1]);}return top})()`);check(name+' animated crown clears title shadow',sweep>58,sweep);
    await p.eval('__jewel.app.prefs.motion=false;__jewel.app.punch=0;__jewel.app.shake=0;__jewel.app.draw()');const calm=await geometry(p);check(name+' reduced-motion gems remain clear',calm.bounds.every(b=>b.bottom<calm.rail));await p.shot(out+'/'+name+'-calm.png');
    await reset(p);await p.eval('__jewel.app.expedition.enterPhoto();__jewel.app.ui.activate("exp-photo-right");__jewel.app.draw()');check(name+' photo keeps original orbit distance',await p.eval('Math.abs(Math.hypot(__jewel.app.eye[0],__jewel.app.eye[2])-jewelcraftOriginalFraming(__jewel.app.cssWidth,__jewel.app.cssHeight).distance)<.00001'));await p.shot(out+'/'+name+'-photo.png');await p.eval('__jewel.app.ui.activate("exp-photo-save");__jewel.app.draw()');await until(()=>p.eval('!!__jewel.app.expedition.lastPhoto'));check(name+' photo exports PNG',await p.eval('__jewel.app.expedition.lastPhoto.size>10000'));await p.eval('__jewel.app.closePanel();__jewel.app.draw()');
   }
   if(w===375&&h===320){
    for(const [mode,opt]of [['moves',{seed:1}],['timed',{seed:1}],['daily',{}],...[0,1,2,3].map(puzzle=>['puzzle',{puzzle}])]){
     await reset(p);await p.eval(`__jewel.challenge(${JSON.stringify(mode)},${JSON.stringify(opt)});__jewel.advance(3);__jewel.app.expedition.announcement=null;__jewel.app.ui.toastUntil=0;__jewel.app.draw()`);
     const q=await geometry(p),id=backend+'-'+mode+(opt.puzzle??'');check(id+' board and side score remain clear',q.score.x>q.trayRight&&q.score.y+q.score.h+8<q.rail&&q.trayTop>58&&q.trayBottom<q.rail);
     check(id+' complete challenge status fits beside tray',await p.eval('!!__jewel.app.ui.challengeAsideRect'));
     const file=out+'/'+id+'.png';await p.shot(file);scenes.push({name:id,utc:new Date().toISOString(),file,geometry:q});
    }
   }
   if([[321,320],[375,320],[460,459]].some(([x,y])=>x===w&&y===h)){
    await reset(p);await p.eval('(()=>{const a=__jewel.app;a.displayScore=1234567;a.best=9876543;const ui=a.ui,fn=ui.text;window.__scoreTexts=[];ui.text=function(...args){window.__scoreTexts.push(args);return fn.apply(this,args)};a.draw()})()');
    const full=await p.eval('window.__scoreTexts.map(t=>t[0])');check(name+' full large score and best displayed',full.includes('1,234,567')&&full.includes('9,876,543'));
    check(name+' score value draws within plaque',await p.eval(`(()=>{const r=__jewel.app.ui.narrowScoreRect,t=window.__scoreTexts.find(t=>t[0]==='1,234,567');return t&&t[3]<=26&&t[2]>=r.y&&t[2]+t[3]<=r.y+r.h})()`));
    await p.shot(out+'/'+name+'-large-values.png');scenes.push({name:name+'-large-values',utc:new Date().toISOString(),texts:full});
    const scoreRect=await p.eval('__jewel.app.ui.narrowScoreRect'),hash=await p.eval('__jewel.net().hash');await tap(p,[scoreRect.x+scoreRect.w/2,scoreRect.y+scoreRect.h/2]);check(name+' side score is inert',hash===await p.eval('__jewel.net().hash')&&await p.eval('!__jewel.app.panelOpen'));
   }
   if(w===375&&h===320){
    await reset(p);await p.eval('__jewel.app.startAACompare();__jewel.app.draw()');check(backend+' AA controls fit viewport',await p.eval("['aa-on','aa-off','aa-done'].every(id=>__jewel.ui().hits.some(t=>t.id===id&&t.x>=0&&t.y>=0&&t.x+t.w<=375&&t.y+t.h<=320))"));
    for(const id of ['aa-off','aa-done']){const hit=await p.eval(`__jewel.ui().hits.find(t=>t.id===${JSON.stringify(id)})`);await tap(p,[hit.x+hit.w/2,hit.y+hit.h/2]);check(backend+' real '+id+' works',await p.eval(id==='aa-off'?'__jewel.app.aaCompare&&__jewel.app.aaCompareBypass':'!__jewel.app.aaCompare'));}
   }
   check(name+' GPU and script clean',(await p.eval('__jewel.diagnostics().errors')).length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
  }
 }finally{p.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed:false,captureOnly,baseline:before,receipts,frames,scenes},null,2));}
}
writeFileSync(out+'/receipt.json',JSON.stringify({passed:true,captureOnly,baseline:before,receipts,frames,scenes},null,2));console.log(JSON.stringify({passed:true,captureOnly,checks:receipts.length,frames:frames.length,out}));

