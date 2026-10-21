const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-narrow-results.js'),'utf8');
function fixture(w=321,h=320){
 const boxes=[],texts=[],buttons=[],r={finished:true,mode:'moves',reason:'RUN COMPLETE',score:450,moves:30,cleared:9};let delegated=0;
 const order=[];
 class CabinetUI{drawGameOver(){delegated++;order.push('original-result');this.resultPlaqueRect=null;}expeditionDecor(){order.push('decor');}drawCursor(){this.expeditionDecor();order.push('cursor');}}
 const summary={parentElement:{open:false},getBoundingClientRect:()=>({width:108,height:40,bottom:52})};
 vm.runInNewContext(source,{CabinetUI,document:{querySelector:()=>summary},UI_ART:{ink:'#000',highlight:'#ffd',text:'#fff',dim:'#aaa',brass:'#ca8',aqua:'#baf'},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))});
 const ui=new CabinetUI();Object.assign(ui,{app:{cssWidth:w,cssHeight:h,expedition:{run:r,highlights:[{name:'CASCADE',chain:1}]}},hits:[{id:'play',x:90,y:h-105,w:80,h:42}],ink:{box:(...a)=>boxes.push(a),line(){}},boardBox:()=>({cy:h*.45}),plaque:(x,y,w,h)=>boxes.push([x-3,y+5,w+6,h+3]),lineDivider(){},measure:(s,h)=>String(s).length*h*.56,text:(...a)=>texts.push(a),button(id,label,x,y,w,h){buttons.push({id,label,x,y,w,h});this.text(label,x+w/2,y+(h-15)/2,15,'#fff','center',w-17,.09,true);this.hits.push({id,label,x,y,w,h});}});
 const plaque=ui.plaque;ui.plaque=(...args)=>{order.push('card');return plaque(...args);};
 return {ui,r,boxes,texts,buttons,summary,order,delegated:()=>delegated};
}
test('excluded surfaces and unfit screens delegate without partial draw or extra hits',()=>{
 for(const [w,h]of [[319,320],[320,321],[390,844],[480,320],[1280,800],[460,460],[321,300]]){const f=fixture(w,h);f.ui.drawGameOver();assert.equal(f.delegated(),1);assert.equal(f.boxes.length+f.texts.length+f.buttons.length,0);assert.equal(f.ui.hits.length,1);}
 for(const state of ['unfinished','panel','photo','aa','about']){const f=fixture();if(state==='unfinished')f.r.finished=false;if(state==='panel')f.ui.app.panelOpen=true;if(state==='photo')f.ui.app.expedition.photo={};if(state==='aa')f.ui.app.aaCompare={};if(state==='about')f.summary.parentElement.open=true;f.ui.drawGameOver();assert.equal(f.delegated(),1,state);assert.equal(f.buttons.length,0);}
});
test('complete surface and button shadows clear About and all existing HUD targets',()=>{
 let fitted=0;for(let w=320;w<480;w+=7)for(let h=318;h<460&&h<=w;h+=11){const f=fixture(w,h);f.ui.drawGameOver();const q=f.ui.narrowResultPlaqueRect;if(!q)continue;fitted++;
  for(const [x,y,width,height]of f.boxes)assert.ok(x>=0&&y>=52&&x+width<=w&&y+height<h-105,`${w}x${h} surface`);
  assert.equal(f.buttons.length,2);for(const b of f.buttons){assert.equal(b.h,42);assert.ok(b.w>=132);assert.ok(b.x>=q.x&&b.x+b.w<=q.x+q.w&&b.y>=q.y&&b.y+b.h+3<=q.y+q.h);}
  for(const [s,x,y,size,,align,max]of f.texts){assert.ok(y>=q.y&&y+size+3<q.y+q.h,`${w}x${h} ${s}`);assert.ok(f.ui.measure(s,size)<=max+.01,`${w}x${h} width ${s}`);}
 }assert.ok(fitted>100);
});
test('all reasons preserve authoritative data, full text, continuation IDs and labels',()=>{
 for(const [mode,reason,id,label]of [['moves','RUN COMPLETE','again','Play again'],['timed','TIME COMPLETE','again','Play again'],['daily','DAILY COMPLETE','again','Play again'],['puzzle','TRY THIS PUZZLE AGAIN','again','Play again'],['puzzle','PUZZLE COMPLETE','exp-next-puzzle','Next puzzle']]){
  const f=fixture();Object.assign(f.r,{mode,reason});const before=JSON.stringify(f.r);f.ui.drawGameOver();assert.equal(f.delegated(),0);assert.equal(JSON.stringify(f.r),before);assert.deepEqual(f.buttons.map(b=>[b.id,b.label]),[[id,label],['exp-endless','Return to endless']]);assert.equal(f.texts[0][0],reason);assert.ok(f.texts.some(t=>t[0]==='450'));assert.ok(f.texts.map(t=>t[0]).join(' ').includes('30 moves / 9 gems'));assert.ok(f.texts.map(t=>t[0]).join(' ').includes('CASCADE x1'));
 }
});
test('unfittable words, scores and body rows fall back atomically',()=>{
 for(const kind of ['word','score','rows','reason']){const f=fixture();if(kind==='word')f.ui.app.expedition.highlights=[{name:'X'.repeat(100)}];if(kind==='score')f.r.score=1e30;if(kind==='rows')f.ui.app.expedition.highlights=[{name:'A B C D '.repeat(50)}];if(kind==='reason')f.r.reason='X'.repeat(100);f.ui.drawGameOver();assert.equal(f.delegated(),1,kind);assert.equal(f.boxes.length+f.texts.length+f.buttons.length,0);assert.equal(f.ui.hits.length,1);}
});
test('button label reflow is scoped and restores the existing text function after errors',()=>{
 const f=fixture(),text=f.ui.text;f.ui.drawGameOver();assert.equal(f.ui.text,text);assert.ok(f.texts.filter(t=>['Return to','endless'].includes(t[0])).every(t=>t[3]===12));
 const broken=fixture(),original=broken.ui.text;broken.ui.button=()=>{throw Error('button failure');};assert.throws(()=>broken.ui.drawGameOver(),/button failure/);assert.equal(broken.ui.text,original);
});
test('decoration renders once below fitted cards; restart and rotation restore original ordering',()=>{
 const f=fixture();f.ui.drawGameOver();f.ui.drawCursor();assert.deepEqual(f.order,['decor','card','cursor']);
 for(const state of ['portrait','unfinished','panel','photo','aa','about','unfit']){
  const g=fixture();g.ui.drawGameOver();g.order.length=0;
  if(state==='portrait')g.ui.app.cssHeight=844;if(state==='unfinished')g.r.finished=false;if(state==='panel')g.ui.app.panelOpen=true;if(state==='photo')g.ui.app.expedition.photo={};if(state==='aa')g.ui.app.aaCompare={};if(state==='about')g.summary.parentElement.open=true;if(state==='unfit')g.r.reason='X'.repeat(100);
  g.ui.drawGameOver();g.ui.drawCursor();assert.deepEqual(g.order,['original-result','decor','cursor'],state);assert.equal(g.ui.narrowResultPlaqueRect,null);
 }
});
