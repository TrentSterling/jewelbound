const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(){const texts=[],c=vm.createContext({CabinetUI:class{},UI_ART:{dim:'#aaa',highlight:'#fff',muted:'#999',text:'#eee'}});c.CabinetUI.prototype.drawHUD=function(){};vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-narrow-score.js'),'utf8'),c);const ui=new c.CabinetUI();Object.assign(ui,{app:{cssWidth:375,cssHeight:320,time:100,displayScore:1234567,best:9876543},hits:[{id:'play',x:102,y:215,w:82,h:40}],plaque(){},lineDivider(){},text:(...args)=>texts.push(args)});return {ui,texts};}
test('side score retains full values, labels and authoritative state without input targets',()=>{
 for(const [flag,label]of [[null,'Score'],['auto','Demo'],['practice','Lab score'],['coop','Team']]){const {ui,texts}=setup();if(flag)ui.app[flag]=flag==='coop'?{connected:true}:true;const state=JSON.stringify(ui.app),hits=JSON.stringify(ui.hits);ui.narrowScorePlaque(127,81,248,207);assert.equal(texts[0][0],label);assert.equal(texts[1][0],'1,234,567');assert.equal(texts[3][0],'9,876,543');assert.equal(JSON.stringify(ui.app),state);assert.equal(JSON.stringify(ui.hits),hits);assert.equal(ui.plaqueAt,null);}
});
test('side plaque fits beside board above rail and values have their own rows',()=>{
 const {ui,texts}=setup();ui.narrowScorePlaque(127,81,248,207);const r=ui.narrowScoreRect;assert.ok(r.x>=248+12&&r.x+r.w<=363&&r.y+r.h+8<215);
 assert.ok(texts.every(([,x,y,h])=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y+h<=r.y+r.h));assert.ok(texts[3][2]>=texts[2][2]+texts[2][3]);
 ui.drawHUD();assert.equal(ui.narrowScoreRect,null);
});
