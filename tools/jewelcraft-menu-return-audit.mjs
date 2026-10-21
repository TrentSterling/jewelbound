// B014: actual touch return controls, measured About clearance, and menu preservation.
import assert from 'node:assert/strict';import{mkdirSync,readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{pathToFileURL}from'node:url';import{launch,until,sleep}from'./cdp.mjs';
const[target='index.html',label='after',backend='webgpu']=process.argv.slice(2),before=label.startsWith('before'),base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B014',label+'-'+backend);mkdirSync(out,{recursive:true});
for(const n of ['gpu-game-validation','pc1-browser-gpu-capture'])assert.equal(JSON.parse(readFileSync('C:/trontstack/.agentcoord/claims/'+n+'.json')).owner,'codex-jewelbound-b014-20261021');
const checks=[],frames=[],ok=(n,v)=>{assert.ok(v,n);checks.push(n);},overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const p=await launch({port:9892,width:568,height:320,mobile:true});let passed=false;
const tap=async(x,y)=>{await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(120);};
const idle=()=>until(()=>p.eval('__jewel.app.phase==="idle"'));
try{
 for(const[w,h]of[[568,320],[390,320],[320,320],[360,640],[568,640],[844,390],[390,844],[1280,800]]){
  const view=w+'x'+h;await p.goto('about:blank');await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});
  await p.eval(`(()=>{const a=__jewel.app,u=a.ui,text=u.text;u.text=function(...args){if(window.__panelText)window.__panelText.push(args);return text.apply(this,args)};const draw=u.drawPanel;u.drawPanel=function(...args){window.__panelText=[];try{return draw.apply(this,args)}finally{window.__lastPanelText=window.__panelText;window.__panelText=null}};__jewel.challenge('moves',{seed:1});a.expedition.dismissTour();})()`);await idle();
  const pair=await p.eval('__jewel.state().legalMoves[0]');for(const i of pair)await tap(...await p.eval(`__jewel.project(${i})`));await until(()=>p.eval('__jewel.state().moves===1&&__jewel.app.phase==="idle"'));
  await p.eval('__jewel.advance(0);__jewel.app.time=20;__jewel.app.living.clock=20;__jewel.app.shake=0;__jewel.app.punch=0;__jewel.app.ui.toastUntil=0');
  for(const tab of (process.env.B014_TABS?process.env.B014_TABS.split(','):['play','journey','moments','comfort','music-toys','display','audio','coop','announcer'])){
   const name=view+'-'+tab;await p.eval(`document.getElementById('trontAbout').open=false;__jewel.app.closePanel();__jewel.app.openPanel('${tab}');__jewel.app.jewelcraftPanelAt=10;__jewel.app.draw()`);
   const d=await p.eval(`(()=>{const a=__jewel.app,u=a.ui,r=document.querySelector('#trontAbout>summary').getBoundingClientRect(),back=u.hits.find(h=>h.id==='${tab==='announcer'?'announcer-back':'close'}');return {state:{cells:a.board.cells.map(c=>[c.type,c.special]),score:a.board.score,moves:a.board.moves,mode:a.expedition.run.mode},panel:u.panelLayout(),scroll:u.scroll,maxScroll:u.maxScroll,hits:u.hits,back,about:{x:r.x,y:r.y,w:r.width,h:r.height},headerTexts:window.__lastPanelText.filter(t=>t[5]==='left'&&t[2]<u.panelLayout().y+59),clearance:u.menuReturnClearance||null,diagnostics:__jewel.diagnostics()}})()`);
   ok(name+' correct renderer',d.diagnostics.backend.toLowerCase().startsWith(backend));ok(name+' return action retains its full accessible label',d.back&&d.back.label===(tab==='announcer'?'Audio':'Back'));
   if(!before){ok(name+' About and return targets do not overlap',!overlap(d.back,d.about));ok(name+' return stays within panel header',d.back.x>=d.panel.x&&d.back.y>=d.panel.y&&d.back.x+d.back.w<=d.panel.x+d.panel.w&&d.back.y+d.back.h<=d.panel.y+59);ok(name+' other controls stay clear of return',d.hits.filter(b=>b.id!==d.back.id).every(b=>!overlap(b,d.back)));}
   const file=out+'/'+name+'.png',utc=new Date().toISOString();if(['play','announcer','coop'].includes(tab))await p.shot(file);
   await tap(d.back.x+d.back.w/2,d.back.y+d.back.h/2);const afterTap=await p.eval('({panelOpen:__jewel.app.panelOpen,tab:__jewel.app.ui.tab,aboutOpen:document.getElementById("trontAbout").open,state:{cells:__jewel.app.board.cells.map(c=>[c.type,c.special]),score:__jewel.app.board.score,moves:__jewel.app.board.moves,mode:__jewel.app.expedition.run.mode}})');
   const blocked=d.back.x+d.back.w/2>=d.about.x&&d.back.x+d.back.w/2<d.about.x+d.about.w&&d.back.y+d.back.h/2>=d.about.y&&d.back.y+d.back.h/2<d.about.y+d.about.h;
   if(before&&blocked)ok(name+' baseline obstruction reproduced',afterTap.aboutOpen&&afterTap.panelOpen);else ok(name+' actual touch reaches original return action',!afterTap.aboutOpen&&(tab==='announcer'?afterTap.panelOpen&&afterTap.tab==='audio':!afterTap.panelOpen));
   ok(name+' return does not reset the board',JSON.stringify(afterTap.state)===JSON.stringify(d.state));ok(name+' no script or renderer errors',!d.diagnostics.errors.length&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
   frames.push({name,view,tab,viewport:[w,h],utc,file:['play','announcer','coop'].includes(tab)?file:null,...d,afterTap});
  }
 }
 passed=true;
}finally{p.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed,before,backend,checks,frames},null,2));}
console.log(JSON.stringify({passed,checks:checks.length,frames:frames.length,out}));
