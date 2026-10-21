// B015: actual renderer geometry and matched puzzle notices, including fallbacks.
import assert from 'node:assert/strict';import{mkdirSync,readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{pathToFileURL}from'node:url';import{launch,until,sleep}from'./cdp.mjs';
const[target='index.html',label='after',backend='webgpu']=process.argv.slice(2),before=label==='before',base=pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B015',label+'-'+backend);mkdirSync(out,{recursive:true});
for(const n of['gpu-game-validation','pc1-browser-gpu-capture'])assert.equal(JSON.parse(readFileSync('C:/trontstack/.agentcoord/claims/'+n+'.json')).owner,'codex-jewelbound-b015-20261021');
const checks=[],frames=[],ok=(n,v)=>{assert.ok(v,n);checks.push(n);},overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y,shadow=r=>({x:r.x-3,y:r.y,w:r.w+6,h:r.h+8});let passed=false;
const p=await launch({port:9872,width:568,height:320,mobile:true});
try{
 for(const[w,h]of[[568,320],[390,320],[320,320],[640,360],[844,390],[390,844],[1280,800]]){
  await p.goto('about:blank');await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});await p.goto(base+(backend==='webgl'?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await until(()=>p.eval(`(()=>{const n=document.getElementById('loading');return !n||getComputedStyle(n).display==='none'||Number(getComputedStyle(n).opacity)===0})()`));
  await p.eval(`(()=>{const u=__jewel.app.ui,text=u.text,plaque=u.plaque,draw=u.drawHUD;window.__calls=[];u.drawHUD=function(...args){window.__calls=[];return draw.apply(this,args)};u.text=function(...args){window.__calls.push(['text',...args,this.ink.opacity]);return text.apply(this,args)};u.plaque=function(...args){window.__calls.push(['plaque',...args,this.ink.opacity]);return plaque.apply(this,args)};performance.now=()=>100000;})()`);
  for(let puzzle=0;puzzle<4;puzzle++){
   const name=w+'x'+h+'-puzzle'+puzzle;
   await p.eval(`(()=>{const a=__jewel.app;__jewel.challenge('puzzle',{puzzle:${puzzle}});a.expedition.dismissTour();__jewel.advance(3);a.time=12;a.living.clock=12;a.shake=0;a.punch=0;a.ui.toastUntil=102400;window.__calls=[];a.draw();})()`);
   const d=await p.eval(`(()=>{const a=__jewel.app,u=a.ui,r=document.querySelector('#trontAbout>summary').getBoundingClientRect();return{state:{cells:a.board.cells.map(c=>[c.type,c.special]),score:a.board.score,moves:a.board.moves,mode:a.expedition.run.mode,puzzle:a.expedition.run.puzzle},board:u.boardRect,title:u.titleRect,aside:u.challengeAsideRect,score:u.narrowScoreRect||u.plaqueAt,hits:u.hits,about:{x:r.x,y:r.y,w:r.width,h:r.height},message:u.toastMessage,accessible:document.getElementById('accessibility-status').textContent,until:u.toastUntil,opacity:u.ink.opacity,layout:u.playNoticeLayout||null,calls:window.__calls,diagnostics:__jewel.diagnostics()}})()`);
   ok(name+' expected renderer',d.diagnostics.backend.toLowerCase().startsWith(backend));ok(name+' notice and accessible message retained',d.message===d.accessible&&d.until===102400);ok(name+' idle without errors',d.diagnostics.phase==='idle'&&!d.diagnostics.errors.length&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
   if(!before&&w===568&&puzzle===0)ok(name+' formerly obstructing notice now fits',!!d.layout);
   if(d.layout){const l=d.layout;ok(name+' complete readable words',l.rows.join(' ')===d.message&&l.font>=12);const s=shadow(l),board={x:d.board.x-d.board.w*.07-4,y:d.board.y-d.board.h*.07-4,w:d.board.w*1.14+8,h:d.board.h*1.14+8},score=Array.isArray(d.score)?{x:d.score[0],y:d.score[1],w:d.score[2],h:d.score[3]}:d.score;ok(name+' clear of goal controls details score tray and About',[d.title,d.aside,score,...d.hits].filter(Boolean).map(shadow).concat([board,d.about]).every(r=>!overlap(s,r)));ok(name+' no clipping or opacity leak',s.x>=0&&s.y>=0&&s.x+s.w<=w&&s.y+s.h<=h&&d.opacity===1);}
   const file=out+'/'+name+'.png',utc=new Date().toISOString();if(puzzle===0||w===568)await p.shot(file);frames.push({name,viewport:[w,h],puzzle,utc,file:puzzle===0||w===568?file:null,...d});
  }
 }
 passed=true;
}finally{p.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed,before,backend,checks,frames},null,2));}console.log(JSON.stringify({passed,checks:checks.length,frames:frames.length,out}));
