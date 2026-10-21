const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(width=390,height=320){
 const texts=[],plaques=[],ctx=vm.createContext({CabinetUI:class{},UI_ART:{highlight:'#fff',dim:'#aaa'},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});ctx.CabinetUI.prototype.drawHUD=function(){};
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-status.js'),'utf8'),ctx);const ui=new ctx.CabinetUI();
 Object.assign(ui,{app:{cssWidth:width,cssHeight:height,expedition:{run:{finished:false}}},boardRect:{x:width/2-68,y:91,w:136,h:139},titleRect:{x:12,y:10,w:245,h:40},hits:[{id:'hint',x:12,y:height-105,w:86,h:40}],boardBox:()=>({cx:width/2,bw:129}),measure:(t,h)=>t.length*h*.65,text:(...a)=>texts.push(a),plaque:(...a)=>plaques.push(a),lineDivider:()=>{}});
 return {ui,texts,plaques};
}
test('narrow landscape shows full challenge and ghost text at a fixed readable size',()=>{
 for(const [label,detail,ghost,gs]of [['30-MOVE CHALLENGE','27 moves left',false,0],['60 seconds','Resonance scores double',false,0],['60 seconds','Resonance scores double',true,300],['DAILY 2026-10-21','27 moves left',false,0],['Find the spectrum','2 moves left',false,0]]){
  const {ui,texts,plaques}=setup(),state=JSON.stringify(ui.app),hits=JSON.stringify(ui.hits);ui.challengeInlineStatus(label,detail,ghost,gs);
  assert.equal(plaques.length,1);assert.equal(texts.map(t=>t[0]).join(' '),label+' '+(ghost?'ghost '+gs:detail));assert.ok(texts.every(t=>t[3]===11&&ui.measure(t[0],11)<=t[6]));assert.equal(JSON.stringify(ui.app),state);assert.equal(JSON.stringify(ui.hits),hits);
 }
});
test('narrow status including its shadow clears board title and existing controls',()=>{
 for(const width of [375,390,414,419]){const {ui,texts}=setup(width);ui.challengeInlineStatus('30-MOVE CHALLENGE','27 moves left',false,0);const q=ui.challengeAsideRect;
  assert.ok(q&&q.x>=12&&q.x+q.w+3<ui.boardRect.x&&q.y>=104&&q.y+q.h+8<ui.hits[0].y);
  assert.ok(texts.every(([,x,y,h,,,max])=>x>=q.x&&x+max<=q.x+q.w&&y>=q.y&&y+h+3<q.y+q.h));
 }
});
test('390px target fits the measured Windows CHALLENGE glyph width without shrinking',()=>{
 const {ui,texts,plaques}=setup(),measure=ui.measure;
 ui.measure=(text,size)=>text==='CHALLENGE'?89.20083*size/11:measure(text,size);
 ui.challengeInlineStatus('30-MOVE CHALLENGE','27 moves left',false,0);
 assert.equal(plaques.length,1);assert.ok(texts.some(t=>t[0]==='CHALLENGE'&&t[3]===11&&t[6]>=89.20083));
});
test('insufficient space and oversized words retain the complete original drawing',()=>{
 for(const [width,height,word]of [[320,240,'60 seconds'],[390,240,'60 seconds'],[390,844,'60 seconds'],[390,320,'12345678901234567890']]){
  const {ui,texts,plaques}=setup(width,height);ui.challengeInlineStatus(word,'Resonance scores double',true,300);assert.equal(plaques.length,0);assert.deepEqual(texts,[[word+' / ghost 300',width/2,239,11,'#fff','center',121,.12,true]]);
 }
});
test('AA and completed challenges preserve original status and HUD reset clears old metadata',()=>{
 for(const update of [u=>u.app.aaCompare=true,u=>u.app.expedition.run.finished=true]){const {ui,texts,plaques}=setup();update(ui);ui.challengeInlineStatus('60 seconds','Resonance scores double',true,300);assert.equal(plaques.length,0);assert.deepEqual(texts,[['60 seconds / ghost 300',195,239,11,'#fff','center',121,.12,true]]);ui.challengeAsideRect={};ui.drawHUD();assert.equal(ui.challengeAsideRect,null);}
});
