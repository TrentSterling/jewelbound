const assert=require('node:assert/strict'),test=require('node:test'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-hint.js'),'utf8');
function fixture(){
 const paths=[],order=[],seen=[];class CabinetUI{expeditionDecor(){order.push('original');return 17;}}
 const project=p=>[160+p[0]*40,160-p[1]*40,p[2]];
 const ctx={CabinetUI,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),project,gemContours:ac=>{seen.push(ac);const [x,y]=project(ac.pos);return [[x-12,y-12,x+12,y-12,x+12,y+12,x-12,y+12,x-12,y-12]];}};
 vm.runInNewContext(source,ctx);const ui=new CabinetUI(),actors=Array.from({length:64},(_,i)=>({pos:[-3.5+i%8,3.5-Math.floor(i/8),.7],scale:[1,1,1]}));
 ui.app={expedition:{run:{finished:false}},phase:'idle',hintCells:[9,10],hintUntil:20,time:12,cssWidth:390,cssHeight:844,prefs:{motion:true,flash:'full'},board:{adjacent:(i,j)=>Math.abs(i%8-j%8)+Math.abs(Math.floor(i/8)-Math.floor(j/8))===1},getActor:i=>actors[i]};
 ui.hits=[];ui.ink={poly:(points,width,col,alpha)=>{order.push('hint');paths.push({points:[...points],width,col,alpha});}};return {ui,paths,order,seen,actors};
}
test('hint draws the chosen mesh pair and a finite, centred swap link without mutating state',()=>{
 const {ui,paths,seen,actors}=fixture(),before=JSON.stringify(ui.app);ui.drawHintPair();assert.equal(paths.length,10);assert.deepEqual(seen,[actors[9],actors[10]]);
 assert.ok(paths.every(p=>p.points.every(Number.isFinite)));assert.equal(JSON.stringify(ui.app),before);assert.equal(ui.hits.length,0);
 const link=paths[4].points;assert.equal((link[0]+link[2])/2,80);assert.equal(link[1],60);assert.equal(link[3],60);assert.ok(link[0]>60&&link[2]<100);
});
test('invalid, nonadjacent and row-wrapped pairs never draw',()=>{
 for(const pair of [[],[1],[1,2,3],[1,1],[7,8],[-1,0],[63,64],[1,9.5],[0,63]]){const {ui,paths}=fixture();ui.app.hintCells=pair;ui.drawHintPair();assert.equal(paths.length,0,JSON.stringify(pair));}
});
test('hidden, expired, moving and completed game states never expose a hint link',()=>{
 for(const change of [a=>a.panelOpen=true,a=>a.expedition.photo={},a=>a.auto=true,a=>a.gameOver={},a=>a.expedition.run.finished=true,a=>a.phase='swap',a=>a.time=21,a=>a.expedition=null,a=>a.getActor=()=>null]){const {ui,paths}=fixture();change(ui.app);ui.drawHintPair();assert.equal(paths.length,0);}
});
test('hint adds no time-driven motion or flashes and preserves semantic drawing priority',()=>{
 const {ui,paths,order}=fixture();ui.drawHintPair();const first=JSON.stringify(paths);paths.length=0;ui.app.time=19;ui.app.prefs.motion=false;ui.app.prefs.flash='off';ui.drawHintPair();assert.equal(JSON.stringify(paths),first);
 order.length=0;assert.equal(ui.expeditionDecor(),17);assert.equal(order.at(-1),'original');
});
