const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const shader=fs.readFileSync(path.join(root,'tools/jewelcraft-stage.js'),'utf8');
const start=html.indexOf('CabinetUI.prototype.drawStage=function()');
const stageHUD=html.slice(start,html.indexOf('\n};',start)+3);
function setup(time=1){
 const ctx=vm.createContext({CabinetUI:class {},GAME_BRAND:{wordmark:'JEWELBOUND'},UI_ART:{highlight:'#fff',edge:'#aaa'},stageHex:()=> '#c0a0ff',clamp:(v,a=0,b=1)=>Math.max(a,Math.min(b,v))});
 vm.runInContext(stageHUD+'\n'+shader,ctx);
 const paints=[],labels=[];
 const ui=new ctx.CabinetUI();
 Object.assign(ui,{app:{time,fx:{stage:1,stageInfo:()=>({n:2,name:'TIDEPOOL',start:5000,end:15000})},displayScore:5120},sc:{birth:0,n:2,name:'TIDEPOOL'},ink:{opacity:1,poly:(points)=>paints.push(points),line:(x,y,X,Y)=>paints.push([x,y,X,Y]),box:(x,y,w,h)=>paints.push([x,y,x+w,y+h])},plaque:(x,y,w,h)=>paints.push([x,y,x+w,y+h]),text:(text,x,y,h,col,align,max)=>labels.push({text,x,y,h,max}),hits:[],boardBox:()=>{throw Error('Stage announcements must not cover the jewel aperture');}});
 return {ui,paints,labels};
}
test('arrival fits the existing desktop, phone and short-landscape title frame',()=>{
 for(const [x,y,w,h,size] of [[465,63,350,43,23],[20,163,350,40,21],[315,14,213.8,34,18],[14,10,292,40,21]]){
  const {ui,paints,labels}=setup();ui.sc.name='AURORA DEEP';ui.sc.loop=true;
  ui.titlePlaque(x,y,w,h,size);
  assert.ok(labels.some(l=>l.text.includes('AURORA DEEP')));
  assert.ok(labels.some(l=>l.text.includes('ENCORE')));
  for(const points of paints)for(let i=0;i<points.length;i+=2){assert.ok(points[i]>=x&&points[i]<=x+w);assert.ok(points[i+1]>=y&&points[i+1]<=y+h);}
  for(const l of labels){assert.ok(l.max<=w-32);assert.ok(l.y>=y&&l.y+l.h<=y+h);}
  assert.equal(ui.hits.length,0,'announcement must not intercept input');
 }
});
test('brand returns outside the existing 2.6-second event and in photo mode',()=>{
 for(const time of [-1,2.61]){const {ui,labels}=setup(time);ui.titlePlaque(0,0,350,40,21);assert.deepEqual(labels.map(l=>l.text),['JEWELBOUND']);assert.equal(ui.stageArrivalRect,null);}
 const {ui,labels}=setup();ui.app.expedition={photo:{}};ui.titlePlaque(0,0,350,40,21);assert.equal(labels[0].text,'JEWELBOUND');
});
test('arrival is stationary and restores opacity during its fade',()=>{
 for(const time of [0,.05,.18,1,2.45,2.6]){const {ui}=setup(time);ui.ink.opacity=.5;ui.titlePlaque(10,20,350,40,21);assert.deepEqual({...ui.stageArrivalRect},{x:10,y:20,w:350,h:40});assert.equal(ui.ink.opacity,.5);}
});
test('stage HUD retains progress, removes the board banner, and expires the event',()=>{
 const {ui,labels,paints}=setup();ui.plaqueAt=[25,100,208,159];ui.drawStage();
 assert.ok(labels.some(l=>l.text==='TIDEPOOL'));assert.ok(paints.length>0);
 for(const points of paints)for(let i=0;i<points.length;i+=2)assert.ok(points[i]<300,'stage HUD must stay left of the board');
 ui.app.time=2.7;ui.drawStage();assert.equal(ui.sc,null);
});
test('round preserves board rules, co-op, audio bytes and stage effects',()=>{
 const before=execFileSync('git',['show','d2fc141:index.html'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
 const part=(text,a,b)=>{const start=text.indexOf(a),end=text.indexOf(b,start+a.length);assert.ok(start>=0&&end>start,'invariant section exists: '+a);return text.slice(start,end);};
 for(const [a,b] of [['class JewelBoard {','const GEM_COLORS='],['class CoopRoom {','/* Co-op controls, input field,'],['const ANNOUNCER_PACK=','const ANNOUNCER_VISIT='],['class ResonanceFX {','/* Tront patch 7: Resonance music']])assert.equal(part(html,a,b),part(before,a,b),a);
});
