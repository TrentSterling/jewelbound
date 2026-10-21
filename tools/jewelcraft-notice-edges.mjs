// Real-renderer fade, rotation, settings, mode transitions and exact fallback PNGs.
import assert from'node:assert/strict';import{mkdirSync,readFileSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{pathToFileURL}from'node:url';import{launch,until,sleep}from'./cdp.mjs';
const out=resolve('tools/out/rounds/B015/edges');mkdirSync(out,{recursive:true});const checks=[],frames=[],ok=(n,v)=>{assert.ok(v,n);checks.push(n);};let passed=false;
const p=await launch({port:9873,width:568,height:320,mobile:true});
try{
 await p.goto(pathToFileURL(resolve('index.html')).href+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});await until(()=>p.eval(`getComputedStyle(document.getElementById('loading')).display==='none'||Number(getComputedStyle(document.getElementById('loading')).opacity)===0`));
 ok('actual WebGPU backend',await p.eval('__jewel.diagnostics().backend.startsWith("WebGPU")'));
 await p.eval(`__jewel.challenge('puzzle',{puzzle:0});__jewel.app.expedition.dismissTour();__jewel.advance(3);performance.now=()=>100000;window.__newNotice=__jewel.app.ui.playNotice;window.__oldNotice=function(text,x,y,w){this.plaque(x,y,w,32);this.text(text,x+w/2,y+9,13,UI_ART.highlight,'center',w-20)};`);
 for(const remaining of[2790,2700,2400,0,-130,-259,-261]){
  const d=await p.eval(`(()=>{const a=__jewel.app,u=a.ui;u.toastUntil=100000+(${remaining});a.draw();return{layout:u.playNoticeLayout,pending:u.pendingPlayNotice,opacity:u.ink.opacity,expected:smooth(clamp((2800-(${remaining}))/180))*smooth(clamp(((${remaining})+260)/260))}})()`);
  ok('fade '+remaining+' exact original opacity and cleanup',d.opacity===1&&d.pending===null&&(remaining<-260?!d.layout:d.layout&&Math.abs(d.layout.opacity-d.expected)<1e-9));if(d.layout)ok('fade '+remaining+' stays in safe fixed position',d.layout.y===62&&d.layout.h<=44);
 }
 await p.eval('__jewel.app.ui.toastUntil=102400');
 for(const[w,h,message]of[[390,320,'Clear the marked gems in one move.'],[480,240,'Saved'],[480,300,'Saved'],[480,319,'Saved'],[320,320,'Saved'],[568,320,'Unbreakable'.repeat(50)]]){
  await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});await sleep(120);
  await p.eval(`__jewel.app.ui.toastMessage=${JSON.stringify(message)};__jewel.app.draw()`);ok(w+'x'+h+' original fallback selected',!await p.eval('__jewel.app.ui.playNoticeLayout'));
  const stem=out+'/'+w+'x'+h;await p.shot(stem+'-candidate.png');await p.eval('__jewel.app.ui.playNotice=window.__oldNotice;__jewel.app.draw()');await p.shot(stem+'-original.png');ok(w+'x'+h+' fallback screenshot pixel-identical',readFileSync(stem+'-candidate.png').equals(readFileSync(stem+'-original.png')));await p.eval('__jewel.app.ui.playNotice=window.__newNotice');frames.push({view:[w,h],message,candidate:stem+'-candidate.png',original:stem+'-original.png'});
 }
 await p.call('Emulation.setDeviceMetricsOverride',{width:568,height:320,deviceScaleFactor:1,mobile:true});await sleep(120);
 await p.eval(`__jewel.app.ui.toastMessage='Clear the marked gems in one move.';__jewel.app.draw()`);ok('rotation restores fitted notice from fresh geometry',!!await p.eval('__jewel.app.ui.playNoticeLayout'));
 for(const mode of['timed','moves','daily','zen','puzzle']){
  await p.eval(`__jewel.challenge('${mode}',{seed:1,puzzle:0});__jewel.advance(3);__jewel.app.ui.toastUntil=102400;__jewel.app.draw()`);ok(mode+' mode remains playable with original accessible notice',await p.eval(`__jewel.app.phase==='idle'&&__jewel.app.expedition.run.mode==='${mode}'&&document.getElementById('accessibility-status').textContent===__jewel.app.ui.toastMessage&&__jewel.app.ui.pendingPlayNotice===null`));
 }
 await p.eval(`__jewel.app.openPanel('comfort');__jewel.app.draw()`);ok('menu clears notice state',await p.eval('!__jewel.app.ui.playNoticeLayout&&__jewel.app.ui.pendingPlayNotice===null'));await p.eval('__jewel.app.closePanel();__jewel.app.expedition.enterPhoto();__jewel.app.draw()');ok('photo clears notice state',await p.eval('!__jewel.app.ui.playNoticeLayout&&__jewel.app.ui.pendingPlayNotice===null'));await p.eval('__jewel.app.closePanel()');
 for(const motion of[false,true]){await p.eval(`__jewel.app.prefs.motion=${motion};__jewel.app.prefs.highContrast=true;__jewel.app.ui.toastUntil=102400;__jewel.app.draw()`);ok('motion '+motion+' and high contrast retain readable full notice',await p.eval(`__jewel.app.ui.playNoticeLayout?.rows.join(' ')===__jewel.app.ui.toastMessage`));}
 const sweep=await p.eval(`(()=>{const a=__jewel.app,r=a.ui.playNoticeLayout,card={x:r.x-3,y:r.y,w:r.w+6,h:r.h+8};let clearance=Infinity,points=0;
  for(let t=0;t<40;t+=.11){a.time=t;a.punch=1.2;a.shake=.85;a.updateCamera();
   const groups=[{verts:[-4.22,4.22,.3,4.22,4.22,.3,-4.22,-4.22,.3,4.22,-4.22,.3],stride:3,matrix:a.vp}];
   for(const ac of a.actors.values())groups.push({verts:gemGeometry(ac.tile.type,ac.tile.special).data(),stride:12,matrix:matMul(a.vp,trs(ac.pos,ac.rotation,ac.scale))});
   groups.push({verts:gemGeometry(5,7).data(),stride:12,matrix:matMul(a.vp,trs([0,4.98+Math.sin(t)*.03,.05],[.06,Math.sin(t*.35)*.35,0],[.90,1.23,.9]))});
   for(const g of groups)for(let i=0;i<g.verts.length;i+=g.stride){const p=project(Array.from(g.verts.slice(i,i+3)),g.matrix,a.cssWidth,a.cssHeight);clearance=Math.min(clearance,p[0]-(card.x+card.w));points++;}
  }a.time=12;a.draw();return{clearance,points,card}})()`);ok('actual tray gems and crown clear notice at maximum punch and shake',sweep.clearance>0&&sweep.points>10000);frames.push({animationSweep:sweep});await p.shot(out+'/max-punch-shake.png');
 ok('no renderer or script errors',!(await p.eval('__jewel.diagnostics().errors')).length&&!p.logs.some(l=>l.startsWith('EXCEPTION')));passed=true;
}finally{p.kill();await sleep(800);writeFileSync(out+'/receipt.json',JSON.stringify({passed,checks,frames},null,2));}console.log(JSON.stringify({passed,checks:checks.length}));
