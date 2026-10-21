const assert=require('node:assert/strict'),test=require('node:test'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../versions/gemstogether-v3.2.4.html'),'utf8'),math=source.slice(source.indexOf('const PI=Math.PI'),source.indexOf('/* Packed vertices:'));
function fixture(){const c=vm.createContext({});vm.runInContext(math+fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-framing.js'),'utf8'),c);return code=>vm.runInContext(code,c);}
test('narrow landscape tray clears title shadow and two-row controls at full punch',()=>{
 const run=fixture();for(const [w,h]of [[375,320],[390,320],[414,340],[480,320],[568,320],[599,360],[460,400],[480,459]])for(const punch of [0,1.2]){
  const g=run(`(()=>{const w=${w},h=${h},f=cabinetFraming(w,h),z=f.distance*(1-.045*${punch}),y=f.targetY||0,m=matMul(perspective(42*PI/180,w/h,.1,150),lookAt([0,.62+y,z],[0,y,0]));const p=[[-4.22,4.22,.3],[4.22,4.22,.3],[-4.22,-4.22,.3],[4.22,-4.22,.3]].map(v=>project(v,m,w,h));return {narrow:f.narrowFit,top:Math.min(...p.map(v=>v[1])),bottom:Math.max(...p.map(v=>v[1]))}})()`);
  assert.equal(g.narrow,true);assert.ok(g.top>58&&g.bottom<h-105,`${w}x${h} punch${punch}: ${JSON.stringify(g)}`);
 }
});
test('portrait, too-short and tall screens keep original framing',()=>{
 const run=fixture();for(const [w,h]of [[390,844],[390,390],[320,240],[480,319],[480,460],[600,400],[1280,800]])assert.equal(run(`JSON.stringify(cabinetFraming(${w},${h}))===JSON.stringify(jewelcraftOriginalFraming(${w},${h}))`),true,`${w}x${h}`);
});
test('narrow fitting caches safely through rotation and preserves layout class',()=>{
 const run=fixture();assert.equal(run('cabinetFraming(390,320)===cabinetFraming(390,320)'),true);assert.equal(run('cabinetFraming(390,844).narrowFit===undefined'),true);
 for(let h=320;h<460;h+=7)for(const w of [375,390,414,480,568,599])if(w>h)assert.equal(run(`(()=>{const f=cabinetFraming(${w},${h});return Number.isFinite(f.distance)&&Number.isFinite(f.targetY||0)&&f.wide===jewelcraftOriginalFraming(${w},${h}).wide})()`),true);
});
test('actual animated crown clears title through camera punch and shake',()=>{
 const runtime=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),c=vm.createContext({});
 const camera=runtime.match(/^ updateCamera\(\).*$/m)[0],crown=runtime.match(/r\.upload\(this\.world\.crown,new Float32Array\(packedInstance\((trs\(\[0,4\.98.*?\]\)),color/)[1];
 vm.runInContext(runtime.slice(runtime.indexOf('const PI=Math.PI'),runtime.indexOf('const SHARED_SHADER='))+fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-framing.js'),'utf8')+`;const actualCamera={${camera}}.updateCamera,actualCrown=function(){return ${crown}};`,c);
 const minimum=vm.runInContext(`(()=>{const raw=gemGeometry(5,7).data(),vertices=[...new Map(Array.from({length:raw.length/12},(_,i)=>{const p=Array.from(raw.slice(i*12,i*12+3));return [p.join(),p]})).values()];let minimum=Infinity;
  for(let h=320;h<460;h+=1){const a={cssWidth:Math.max(375,h+1),cssHeight:h,prefs:{motion:true},shake:.85,punch:1.2};for(let time=0;time<126;time+=.5){a.time=time;actualCamera.call(a);const m=matMul(a.vp,actualCrown.call(a));for(const p of vertices)minimum=Math.min(minimum,project(p,m,a.cssWidth,h)[1]);}}return minimum})()`,c);
 assert.ok(minimum>58,'crown enters title shadow: '+minimum);
});
