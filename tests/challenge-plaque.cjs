const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tools/jewelcraft-challenge.js'),'utf8');
function setup(mode='timed',elapsed=70,moves=3){
 const labels=[],paints=[],fallback=[],ctx=vm.createContext({CabinetUI:class {},GAME_BRAND:{wordmark:'JEWELBOUND'},EXPEDITION_PUZZLES:[{goal:'targets'},{goal:'blast'},{goal:'prism'},{goal:'chain'}],UI_ART:{highlight:'#fff',dim:'#aaa',brass:'#888'},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
 ctx.CabinetUI.prototype.titlePlaque=function(...args){fallback.push(args);};vm.runInContext(source,ctx);
 const ui=new ctx.CabinetUI();Object.assign(ui,{app:{time:8,board:{moves},expedition:{run:{mode,elapsed,limit:mode==='timed'?120:30}}},ink:{line:(...a)=>paints.push(a),box:(x,y,w,h)=>paints.push([x,y,x+w,y+h])},plaque:()=>{},text:(...a)=>labels.push(a),hits:[]});
 return {ui,labels,paints,fallback};
}
test('counter reads authoritative time and budgets without mutating the run',()=>{
 for(const [mode,elapsed,moves,expected] of [['timed',70,3,'0:50'],['timed',119.1,3,'0:01'],['timed',121,3,'0:00'],['moves',0,3,'27'],['daily',0,29,'1'],['puzzle',0,31,'0']]){
  const {ui,labels}=setup(mode,elapsed,moves),before=JSON.stringify(ui.app);ui.titlePlaque(10,10,350,43,23);
  assert.ok(labels.some(x=>x[0]===expected));assert.equal(JSON.stringify(ui.app),before);assert.equal(ui.hits.length,0);
 }
});
test('ordinary board, stage arrival, photo, practice and finished run retain their title',()=>{
 for(const amend of [u=>u.app.expedition.run.mode='zen',u=>u.sc={birth:7},u=>u.app.expedition.photo={},u=>u.app.practice=true,u=>u.app.auto=true,u=>u.app.expedition.run.finished=true]){
  const {ui,fallback,labels}=setup();amend(ui);ui.titlePlaque(10,10,350,43,23);assert.equal(fallback.length,1);assert.equal(labels.length,0);assert.equal(ui.challengePlaqueRect,null);
 }
});
test('compact and full counters stay within the existing title and add no target',()=>{
 for(const [w,h] of [[350,43],[350,40],[213.8,34],[166,34]]){
  const {ui,paints,labels}=setup();ui.titlePlaque(10,20,w,h,23);
  for(const [x,y,X,Y] of paints){assert.ok(x>=10&&X<=10+w&&y>=20&&Y<=20+h);}
  for(const [,x,y,size] of labels)assert.ok(y>=20&&y+size<=20+h);
  assert.equal(ui.hits.length,0);
 }
});
test('real one-, two- and three-move puzzle budgets remain legible counters',()=>{
 for(const limit of [1,2,3]){const {ui,labels}=setup('puzzle',0,0);ui.app.expedition.run.limit=limit;ui.titlePlaque(10,20,166,34,18);assert.ok(labels.some(x=>x[0]===String(limit)&&x[3]===20));}
});
test('all puzzle win conditions remain visible after the toast, without changing state or targets',()=>{
 const goals=[['CLEAR MARKED GEMS','CLEAR','MARKED'],['FORGE A BLAST GEM','FORGE','BLAST'],['FORGE A PRISM','FORGE','PRISM'],['REACH A 5-WAVE CHAIN','5-WAVE','CHAIN']];
 for(let puzzle=0;puzzle<4;puzzle++)for(const [w,h] of [[350,40],[350,43],[213.8,34],[166,34]]){
  const {ui,labels}=setup('puzzle',0,0);ui.app.time=200;ui.toastUntil=0;ui.app.expedition.run.puzzle=puzzle;const before=JSON.stringify(ui.app);
  ui.titlePlaque(10,20,w,h,23);const words=labels.map(l=>l[0]);
  for(const word of w<250?goals[puzzle].slice(1):goals[puzzle].slice(0,1))assert.ok(words.includes(word));
  for(const [,x,y,size] of labels)assert.ok(y>=20&&y+size<=20+h);
  assert.equal(JSON.stringify(ui.app),before);assert.equal(ui.hits.length,0);
 }
});
test('short-screen secondary status clears the board and bottom controls',()=>{
 const {ui}=setup();Object.assign(ui.app,{cssWidth:844,cssHeight:320});ui.plaqueAt=[73,8,208,159];ui.boardRect={x:305,y:45,w:230,h:230};ui.hits=[{id:'hint',x:12,y:263,w:111,h:42}];
 const layout=ui.challengeStatusLayout();assert.equal(layout.relocated,true);assert.ok(layout.x-8>535);assert.ok(layout.x+layout.w+8<844);assert.ok(layout.y+46<263);assert.ok(layout.y-8>=50);
 ui.app.cssHeight=390;ui.hits[0].y=333;assert.equal(ui.challengeStatusLayout().relocated,false);
 ui.app.cssHeight=800;ui.hits[0].y=718;assert.equal(ui.challengeStatusLayout().relocated,false);
});
test('B002 leaves challenge rules, co-op and audio source unchanged',()=>{
 const {execFileSync}=require('node:child_process');
 for(const name of ['tools/expedition.js','tools/music.js','tools/announcer.js','tools/resonance.js']){
  const before=execFileSync('git',['show','49fdd656:'+name],{cwd:root,encoding:'utf8'}),after=fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');assert.ok(after===before,name+' source changed');
 }
});
