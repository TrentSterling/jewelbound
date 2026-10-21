const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(width=321,height=320){
 const texts=[],ctx=vm.createContext({CabinetUI:class{},UI_ART:{highlight:'#fff',dim:'#aaa'},cabinetFraming:()=>({narrowFit:true}),clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});ctx.CabinetUI.prototype.drawHUD=function(){};
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-status.js'),'utf8'),ctx);const ui=new ctx.CabinetUI();
 Object.assign(ui,{app:{cssWidth:width,cssHeight:height,expedition:{run:{mode:'moves',finished:false}}},boardRect:{x:102.26,y:87.12,w:116.12,h:118.51},titleRect:{x:12,y:10,w:175.92,h:40},narrowScoreRect:{x:240,y:87,w:69,h:114},hits:[{id:'hint',x:12,y:height-105,w:69,h:40}],boardBox:()=>({cx:160.38,bw:110.05}),measure:(s,h)=>s.length*h*.66,text:(...args)=>texts.push(args),plaque:()=>{},lineDivider:()=>{}});
 return {ui,texts,ctx};
}
test('compact fallback preserves complete move budget without changing state or targets',()=>{
 const {ui,texts}=setup(),state=JSON.stringify(ui.app),hits=JSON.stringify(ui.hits);ui.challengeInlineStatus('30-MOVE CHALLENGE','27 moves left',false,0);
 assert.ok(ui.challengeAsideRect?.compactDetail);assert.equal(texts.map(t=>t[0]).join(' '),'Moves 27 moves left');assert.ok(texts.every(t=>t[3]===11&&ui.measure(t[0],11)<=t[6]));assert.equal(JSON.stringify(ui.app),state);assert.equal(JSON.stringify(ui.hits),hits);
 const q=ui.challengeAsideRect;assert.ok(q.x+q.w+6<94.65&&q.y+q.h+8<215);
});
test('all excluded surfaces decline compact fallback',()=>{
 for(const change of [u=>u.narrowScoreRect=null,u=>u.app.expedition.run.finished=true,u=>u.app.aaCompare=true,u=>u.app.expedition.photo={},u=>u.app.panelOpen=true,u=>u.app.practice=true,u=>u.app.auto=true,u=>u.app.expedition.run.mode='zen']){const {ui,texts}=setup();change(ui);assert.equal(ui.challengeFallbackPlaque('30-MOVE CHALLENGE','27 moves left'),false);assert.equal(texts.length,0);}
 const {ui,ctx}=setup();ctx.cabinetFraming=()=>({});assert.equal(ui.challengeFallbackPlaque('30-MOVE CHALLENGE','27 moves left'),false);
});
test('long words and values keep the complete existing inline fallback',()=>{
 for(const caption of ['Resonance scores double','ghost 999999999999999999']){const {ui,texts}=setup();ui.app.expedition.run.mode='timed';ui.measure=(s,h)=>s==='Resonance'?79.308*h/11:s.length*h*.66;ui.challengeInlineStatus('60 seconds',caption,false,0);assert.equal(texts.length,1);assert.equal(texts[0][0],'60 seconds / '+caption);assert.equal(ui.challengeAsideRect,undefined);}
});
test('limited height declines plaque; drawHUD clears stale metadata',()=>{const {ui,texts}=setup();ui.hits[0].y=145;assert.equal(ui.challengeFallbackPlaque('Moves','27 moves left'),false);assert.equal(texts.length,0);ui.challengeAsideRect={};ui.drawHUD();assert.equal(ui.challengeAsideRect,null);});
