const assert=require('node:assert/strict'),test=require('node:test'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const original=fs.readFileSync(path.join(__dirname,'../versions/gemstogether-v3.2.4.html'),'utf8');
const math=original.slice(original.indexOf('const PI=Math.PI'),original.indexOf('/* Packed vertices:'));
const layer=fs.readFileSync(path.join(__dirname,'../tools/jewelcraft-framing.js'),'utf8');
function fixture(){const c=vm.createContext({});vm.runInContext(math+layer,c);return code=>vm.runInContext(code,c);}
test('ordinary desktop, portrait and wide boundary retain exact original framing',()=>{
 const run=fixture();for(const [w,h]of [[1280,800],[390,844],[320,568],[844,460],[1920,1080],[480,319],[844,179]]){
  assert.equal(run(`JSON.stringify(cabinetFraming(${w},${h}))===JSON.stringify(jewelcraftOriginalFraming(${w},${h}))`),true,`${w}x${h}`);
 }
});
test('compact tray clears title and control rail including maximum camera punch',()=>{
 const run=fixture();for(const [w,h]of [[844,320],[844,390],[740,360],[1024,400],[1024,459],[600,240],[844,180]])for(const punch of [0,1.2]){
  const bounds=run(`(()=>{const w=${w},h=${h},f=cabinetFraming(w,h),y=f.targetY||0,z=f.distance*(1-.045*${punch}),m=matMul(perspective(42*PI/180,w/h,.1,150),lookAt([0,.62+y,z],[0,y,0]));const p=[[-4.22,4.22,.3],[4.22,4.22,.3],[-4.22,-4.22,.3],[4.22,-4.22,.3]].map(v=>project(v,m,w,h));return {top:Math.min(...p.map(v=>v[1])),bottom:Math.max(...p.map(v=>v[1]))}})()`);
  assert.ok(bounds.top>=39&&bounds.bottom<h-57,`${w}x${h}, punch ${punch}: ${JSON.stringify(bounds)}`);
 }
});
test('cache follows viewport changes and yields finite values throughout compact widths',()=>{
 const run=fixture();assert.equal(run('cabinetFraming(844,320)===cabinetFraming(844,320)'),true);
 for(let h=180;h<460;h+=7)for(const w of [600,740,844,1024,1280])assert.equal(run(`(()=>{const f=cabinetFraming(${w},${h});return Number.isFinite(f.distance)&&f.distance>0&&Number.isFinite(f.targetY||0)})()`),true);
 assert.equal(run('cabinetFraming(390,844).targetY===undefined'),true);
});
