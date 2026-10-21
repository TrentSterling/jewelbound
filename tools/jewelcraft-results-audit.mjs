// Actual-input compact result audit and matched capture. Target then before|after.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launch,until,sleep} from './cdp.mjs';
const [target='index.html',label='after']=process.argv.slice(2),baseline=label.startsWith('before');
const base=/^https?:/.test(target)?target:pathToFileURL(resolve(target)).href,out=resolve('tools/out/rounds/B006',label);mkdirSync(out,{recursive:true});
const checks=[],frames=[],limits=[];const ok=(name,value)=>{assert.ok(value,name);checks.push(name);};
for(const gl of baseline?[false]:[false,true]){
 const backend=gl?'webgl':'webgpu',p=await launch({port:9862,width:844,height:320,mobile:true});
 try{for(const [w,h]of [[844,320],[844,390],[568,320],[480,320],[740,360],[844,240],[844,180],[1024,459],[844,460],[390,844],[1280,800]]){
  const name=backend+'-'+w+'x'+h;
  await p.goto('about:blank');await until(()=>p.eval('location.href==="about:blank"&&!window.__jewel'));
  await p.call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<1000});
  await p.goto(base+(gl?'?webgl=1':'')+'#solo=1');await until(()=>p.eval('!!window.__jewel?.ready'),{timeout:60000});
  await p.eval(`(()=>{const u=__jewel.app.ui;for(const name of ['text','button','plaque']){const fn=u[name];u[name]=function(...args){if(window.__resultCapture)window.__resultCapture[name].push(args);return fn.apply(this,args);};}const fn=u.drawGameOver;u.drawGameOver=function(){window.__resultCapture={text:[],button:[],plaque:[]};try{return fn.call(this);}finally{window.__lastResult=window.__resultCapture;window.__resultCapture=null;}};__jewel.challenge('moves',{seed:1});__jewel.app.expedition.dismissTour();})()`);
  await until(()=>p.eval('__jewel.app.phase==="idle"'));await p.eval('__jewel.app.board.moves=29');
  const tap=async(x,y)=>{await p.call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1,radiusX:5,radiusY:5}]});await p.call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(80);};
  const hit=async id=>{const q=await p.eval(`__jewel.ui().hits.find(h=>h.id===${JSON.stringify(id)})`);assert.ok(q,id);await tap(q.x+q.w/2,q.y+q.h/2);};
  const pair=await p.eval('__jewel.state().legalMoves[0]');for(const i of pair)await tap(...await p.eval(`__jewel.project(${i})`));
  await until(()=>p.eval('__jewel.expedition().run.finished&&__jewel.app.phase==="idle"'));
  await p.eval('(()=>{const a=__jewel.app;__jewel.advance(0);a.time=12;a.living.clock=12;a.shake=0;a.punch=0;a.ui.toastUntil=0;a.ui.hideCursor();a.draw()})()');
  const data=await p.eval(`(()=>{const a=__jewel.app,r=a.expedition.run;return {state:{score:r.score,moves:r.moves,cleared:r.cleared,reason:r.reason,mode:r.mode,finished:r.finished,cells:a.board.cells.map(c=>[c.type,c.special])},draw:window.__lastResult,rect:a.ui.resultPlaqueRect||null,diagnostics:__jewel.diagnostics()}})()`);
  ok(name+' actual last move finishes and scores',data.state.finished&&data.state.score===150&&data.state.moves===30);
  ok(name+' renderer and no script errors',data.diagnostics.backend.includes(gl?'WebGL':'WebGPU')&&data.diagnostics.errors.length===0&&!p.logs.some(l=>l.startsWith('EXCEPTION')));
  ok(name+' preserves both continuation actions',JSON.stringify(data.draw.button.map(b=>b[0]))===JSON.stringify(['again','exp-endless']));
  if(!baseline){const compact=w>=480&&w>h&&h>=180&&h<460&&!(w===844&&h===180);ok(name+' scope',!!data.rect===compact);
   if(compact){const q=data.rect;ok(name+' full result card in viewport',q.x>=6&&q.y>=6&&q.x+q.w<=w-6&&q.y+q.h<=h-6);
    ok(name+' both actions in card with full touch height',data.draw.button.every(([, ,x,y,bw,bh])=>bh===42&&bw>=150&&x>=q.x&&y>=q.y&&x+bw<=q.x+q.w&&y+bh<=q.y+q.h));
    ok(name+' statistics preserve score and totals',data.draw.text.some(t=>t[0]==='150')&&data.draw.text.some(t=>t[0]==='30 moves / 3 gems'));
   }
  }
  const utc=new Date().toISOString(),file=out+'/'+name+'-result.png';await p.shot(file);frames.push({name,viewport:[w,h],utc,file,pair,...data});
  const usable=data.draw.button.every(([, ,x,y,bw,bh])=>x>=0&&y>=0&&x+bw<=w&&y+bh<=h);
  if(!usable){ok(name+' clipped actions only occur in unchanged fallback',!data.rect);limits.push({name,reason:'Original result renderer retained; action outside viewport. No passing action check claimed.'});continue;}
  if(!baseline){await p.eval('__jewel.resume()');if(data.rect){const q=data.rect,points=[[q.x+8,q.y+q.h-8],[q.x+q.w*.25,q.y+q.h-8],[q.x+q.w*.5,q.y+q.h-8]];for(const [x,y]of points)await tap(x,y);ok(name+' touch result background never opens hidden HUD controls',await p.eval('!__jewel.app.panelOpen&&__jewel.expedition().run.finished'));}
   await hit('again');await until(()=>p.eval('!__jewel.expedition().run.finished&&__jewel.app.phase==="idle"'));ok(name+' real Play again restarts same mode',await p.eval('__jewel.expedition().run.mode==="moves"&&__jewel.state().moves===0'));
   await p.eval('__jewel.app.expedition.finish("RUN COMPLETE");__jewel.app.draw()');await hit('exp-endless');await until(()=>p.eval('__jewel.app.phase==="idle"'));ok(name+' real Return to endless resets normally',await p.eval('__jewel.expedition().run.mode==="zen"&&!__jewel.expedition().run.finished'));
   if(w===844&&h===320){for(const [mode,reason,id]of [['timed','TIME COMPLETE','again'],['daily','DAILY COMPLETE','again'],['puzzle','TRY THIS PUZZLE AGAIN','again'],['puzzle','PUZZLE COMPLETE','exp-next-puzzle']]){
    await p.eval(`__jewel.challenge(${JSON.stringify(mode)},{seed:1,puzzle:0})`);await until(()=>p.eval('__jewel.app.phase==="idle"'));await p.eval(`__jewel.app.expedition.finish(${JSON.stringify(reason)});__jewel.app.draw()`);
    ok(backend+' '+mode+' '+reason+' exact action',await p.eval(`window.__lastResult.button[0][0]===${JSON.stringify(id)}`));await hit(id);await until(()=>p.eval('__jewel.app.phase==="idle"'));ok(backend+' '+mode+' '+reason+' action result',await p.eval(`__jewel.expedition().run.mode===${JSON.stringify(mode)}&&!__jewel.expedition().run.finished${id==='exp-next-puzzle'?'&&__jewel.expedition().run.puzzle===1':''}`));
   }
   await p.eval('__jewel.challenge("moves",{seed:1})');await until(()=>p.eval('__jewel.app.phase==="idle"'));await p.eval('__jewel.app.expedition.finish("RUN COMPLETE");__jewel.app.prefs.motion=false;__jewel.app.prefs.highContrast=true;__jewel.app.draw()');ok(backend+' comfort keeps result actions',await p.eval('window.__lastResult.button.length===2'));await p.shot(out+'/'+backend+'-comfort.png');
   await p.eval('__jewel.app.expedition.enterPhoto();__jewel.app.draw()');ok(backend+' photo delegates without result overlay',await p.eval('!__jewel.app.ui.resultPlaqueRect'));
   }
  }
 }}finally{p.kill();await sleep(800);}
}
writeFileSync(out+'/receipt.json',JSON.stringify({passed:true,baseline,checks,frames,limits},null,2));console.log(JSON.stringify({passed:checks.length,out,frames:frames.length,limits}));
