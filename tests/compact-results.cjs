const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-results.js'),'utf8');
function fixture(w,h,mode='moves',reason='RUN COMPLETE'){
 const marks=[],buttons=[],texts=[],r={finished:true,mode,reason,score:123456789,moves:30,cleared:189};let fallback=0;
 class CabinetUI{drawGameOver(){fallback++;}}
 vm.runInNewContext(source,{CabinetUI,UI_ART:{ink:'#000',text:'#fff',dim:'#aaa',highlight:'#ff0',brass:'#da0',aqua:'#caf'},clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
 const ui=new CabinetUI();Object.assign(ui,{app:{cssWidth:w,cssHeight:h,panelOpen:false,expedition:{run:r,highlights:[{name:'CASCADE',chain:3}]}},hits:[{id:'play',x:0,y:h-(w<600?105:57),w,h:42}],ink:{box:(...a)=>marks.push(a),line(){}},boardBox:()=>({cy:h/2}),plaque:(...a)=>marks.push(a),lineDivider(){},text:(...a)=>texts.push(a),button:(...a)=>buttons.push(a)});
 return {ui,r,buttons,texts,marks,fallback:()=>fallback};
}
test('ordinary portrait, desktop, open panels and unfinished runs delegate unchanged',()=>{
 for(const [w,h] of [[390,844],[1280,800],[844,460],[479,320],[320,320],[844,179]]){const f=fixture(w,h);f.ui.drawGameOver();assert.equal(f.fallback(),1);assert.equal(f.buttons.length,0);}
 for(const key of ['panelOpen','unfinished']){const f=fixture(844,320);if(key==='panelOpen')f.ui.app.panelOpen=true;else f.r.finished=false;f.ui.drawGameOver();assert.equal(f.fallback(),1);}
});
test('compact result cards and both 42px actions remain inside viewport across supported sizes',()=>{
 for(const w of [480,568,600,740,844,1024,1280])for(const h of [180,200,213,214,240,320,390,459]){
  const f=fixture(w,h);f.ui.drawGameOver();const q=f.ui.resultPlaqueRect;if(!q){assert.equal(f.fallback(),1);continue;}assert.ok(q.x>=6&&q.y>=6&&q.x+q.w<=w-6&&q.y+q.h<=h-6,`${w}x${h}`);
  assert.ok(q.y+q.h+6<f.ui.hits[0].y,`${w}x${h}: result must clear underlying HUD controls`);
  assert.equal(f.buttons.length,2);for(const [id,,x,y,bw,bh]of f.buttons){assert.equal(bh,42);assert.ok(bw>=150&&x>=q.x&&y>=q.y&&x+bw<=q.x+q.w&&y+bh<=q.y+q.h,`${w}x${h} ${id}`);}
  const first=f.buttons[0],second=f.buttons[1];assert.ok(first[3]+first[5]<second[3]);
  for(const [text,,y,height] of f.texts)assert.ok(y>=q.y&&y+height<=q.y+q.h,`${w}x${h}: ${text}`);
 }
});
test('all modes retain original result values and exact continuation action IDs',()=>{
 for(const [mode,reason,id]of [['timed','TIME COMPLETE','again'],['moves','RUN COMPLETE','again'],['daily','DAILY COMPLETE','again'],['puzzle','TRY THIS PUZZLE AGAIN','again'],['puzzle','PUZZLE COMPLETE','exp-next-puzzle']]){
  const f=fixture(844,320,mode,reason),before=JSON.stringify(f.r);f.ui.drawGameOver();assert.deepEqual(f.buttons.map(b=>b[0]),[id,'exp-endless']);assert.equal(f.texts[0][0],reason);assert.equal(f.texts[1][0],f.r.score.toLocaleString());assert.equal(JSON.stringify(f.r),before);
 }
});
