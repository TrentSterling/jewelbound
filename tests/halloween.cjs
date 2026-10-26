const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=['jewelcraft-haunted-assets.js','jewelcraft-haunt-beats.js','jewelcraft-halloween.js'].map(p=>fs.readFileSync(path.join(root,'tools',p),'utf8')).join('\n');
const part=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return text.slice(i,j);};
function fixture(){
 const writes=[],meshes=[],uploads=[];
 class JewelApp{applyPreferences(){return 'original';}}
 class CabinetUI{activate(id){return 'original:'+id;}}
 class JewelPresentation{feed(){return 'retained';}reset(){return 'retained';}}
 const renderer={createMesh(data,max){const m={data,max};meshes.push(m);return m;},upload(m,data,count){uploads.push({m,count});m.count=count;m.instances=new Float32Array(data);}};
 const context={JewelApp,CabinetUI,JewelPresentation,readStorage:()=>null,writeStorage:(...x)=>writes.push(x),buildWorld:()=>({classic:true})};vm.createContext(context);
 vm.runInContext(part(html,'const PI=Math.PI','const SHARED_SHADER=')+part(html,'function tintGeo(','function leaf(')+part(html,'function packedInstance(','class ParticlePool')+source+'\nthis.make=buildHalloweenVault;this.choose=jewelboundSeason;',context);
 return {context,renderer,meshes,uploads,writes,JewelApp};
}
test('seasonal geometry stays outside the jewel aperture and uses bounded opaque meshes',()=>{
 const f=fixture(),vault=f.context.make(f.renderer);
 assert.equal(f.meshes.length,3);assert(vault.triangles<8000);assert(vault.bytes<1200000);
 for(const {data,max} of f.meshes){assert(data.every(Number.isFinite));for(let i=0;i<data.length;i+=12){const [x,y,z]=data.slice(i,i+3);if(max===1)assert(!(Math.abs(x)<3.78&&Math.abs(y)<3.78&&z>-.5),'ornament crosses playable aperture');assert([0,1,7,8,10,11].includes(data[i+9]),'opaque material only');}}
 assert(vault.batTriangles<=180,'flight LOD retains the reviewed active triangle budget');
 const crown=f.meshes[1].data;for(let i=1;i<crown.length;i+=12)assert(crown[i]<=5.41,'crown fits original world-height envelope');
});
test('October default respects explicit Classic preference and rejects malformed storage',()=>{
 const {context:c}=fixture();assert.equal(c.choose(null,9),'halloween');assert.equal(c.choose(null,10),'classic');assert.equal(c.choose('classic',9),'classic');assert.equal(c.choose('halloween',2),'halloween');assert.equal(c.choose({season:'halloween'},2),'classic');
});
test('theme selection preserves game state, stores only cosmetic key, and never allocates on switching',()=>{
 const f=fixture(),a=new f.JewelApp();a.renderer=f.renderer;a.world={halloween:f.context.make(f.renderer)};a.prefs={flash:'off'};a.presentation={crownEnergy:5};a.juice=5;a.cssWidth=1280;a.cssHeight=800;a.board={seed:43,score:900,moves:17};a.expedition={profile:{gems:1200},run:{mode:'daily'}};
 const state=JSON.stringify([a.board,a.expedition,a.prefs]),n=f.meshes.length;
 for(let i=0;i<100;i++){assert(a.setSeason(i%2?'classic':'halloween'));a.seasonMeshes();}
 assert.equal(f.meshes.length,n);assert.equal(JSON.stringify([a.board,a.expedition,a.prefs]),state);assert(f.writes.every(w=>w[0]==='jewelbound-season-v1'));assert.equal(a.setSeason('invalid'),false);
 a.setSeason('halloween');assert.equal(a.seasonMeshes().length,2);assert.equal(a.world.halloween.energy,0);a.cssWidth=390;a.cssHeight=844;assert.equal(a.seasonMeshes().length,1);a.expedition.photo={};assert.equal(a.seasonMeshes().length,2);a.setSeason('classic');assert.equal(a.seasonMeshes().length,0);
});
test('board, network, stage effects, playable geometry, audio and source drop remain byte-identical',()=>{
 const ref='517375e72c2daa2fa8bfc5f9056fb58012f8b400',before=execFileSync('git',['show',ref+':index.html'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
 for(const [a,b] of [['class JewelBoard {','const GEM_COLORS='],['function gemGeometry(','const SHARED_SHADER='],['class CoopRoom {','/* Co-op controls, input field,'],['const ANNOUNCER_PACK=','const ANNOUNCER_VISIT='],['class ResonanceFX {','/* Tront patch 7: Resonance music']])assert.equal(part(html,a,b),part(before,a,b),a);
 for(const p of ['versions/gemstogether-v3.2.4.html','tools/expedition.js','tools/music.js','tools/announcer.js','tools/resonance.js','tests/about-browser.cjs','.github/workflows/about-checks.yml']){
  const expected=execFileSync('git',['show',ref+':'+p],{cwd:root,maxBuffer:8*1024*1024});assert.equal(fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n'),expected.toString('utf8').replace(/\r\n/g,'\n'),p);
 }
});
test('earned bat flights stay outside the board, expire, freeze, and respect comfort controls',()=>{
 const f=fixture(),a=new f.JewelApp();Object.assign(a,{renderer:f.renderer,world:{halloween:f.context.make(f.renderer)},prefs:{flash:'off',particles:true,motion:true},presentation:{crownEnergy:0},juice:0,cssWidth:1280,cssHeight:800,season:'halloween'});
 const h=a.world.halloween;h.flightAt=0;h.flightTier=5;
 for(const time of [.02,.2,.8,1.5,2.19]){a.time=time;a.seasonMeshes();assert(h.flight.count<=12);for(let i=0;i<h.flight.count;i++){const m=h.flight.instances.subarray(i*24,i*24+16);for(let v=0;v<h.flight.data.length;v+=12){const [x,y,z]=h.flight.data.subarray(v,v+3),wx=m[0]*x+m[4]*y+m[8]*z+m[12];assert(Math.abs(wx)>4.2,'flight enters tray');}}}
 a.time=1;a.seasonMeshes();const still=Array.from(h.flight.instances);a.frozen=true;a.seasonMeshes();assert.deepEqual(Array.from(h.flight.instances),still);a.frozen=false;
 a.prefs.motion=false;a.seasonMeshes();assert.equal(h.flight.count,0);a.prefs.motion=true;a.prefs.particles=false;a.seasonMeshes();assert.equal(h.flight.count,0);a.prefs.particles=true;a.time=2.21;a.seasonMeshes();assert.equal(h.flight.count,0);
 a.presentation={crownEnergy:1};a.time=1;a.prefs.flash='full';a.seasonMeshes();const full=h.energy;a.prefs.flash='low';a.seasonMeshes();assert.equal(h.energy,full*.35);a.prefs.flash='off';a.seasonMeshes();assert.equal(h.energy,0);
});

test('phone flights project inside the viewport and outside the live tray through camera punch',()=>{
 const f=fixture();
 vm.runInContext(part(html,'const jewelcraftOriginalFraming=cabinetFraming;','/* B006:')+part(html,'const jewelcraftBeforeFooterFraming=cabinetFraming;','const jewelcraftBeforeFooterRail=')+'\nObject.assign(JewelApp.prototype,{'+part(html,' updateCamera(){','\n draw(){')+'});this.projectPoint=(p,a)=>project(p,a.vp,a.cssWidth,a.cssHeight);this.transformPoint=transform;',f.context);
 const a=new f.JewelApp();Object.assign(a,{renderer:f.renderer,world:{halloween:f.context.make(f.renderer)},prefs:{flash:'off',particles:true,motion:true},presentation:{crownEnergy:0},juice:0,season:'halloween',expedition:{}});
 const h=a.world.halloween;h.flightAt=0;h.flightTier=5;
 for(const [w,H] of [[320,568],[320,720],[390,664],[390,844]])for(const punch of [0,1.2])for(const time of [.2,.6,1.2,1.79]){
  Object.assign(a,{cssWidth:w,cssHeight:H,punch,shake:.85,time});a.updateCamera();a.seasonMeshes();assert(h.flight.count>=2&&h.flight.count<=6,`${w}x${H} bounded visible phone flock`);if(time>=.6)assert.equal(h.flight.count,6,'staggered phone flock completes entry');
  const c=[[-3.78,4.02,.9],[3.78,4.02,.9],[-3.78,-4.1,.9],[3.78,-4.1,.9]].map(p=>f.context.projectPoint(p,a)),left=Math.min(...c.map(p=>p[0])),right=Math.max(...c.map(p=>p[0])),top=Math.min(...c.map(p=>p[1])),bottom=Math.max(...c.map(p=>p[1]));
  for(let i=0;i<h.flight.count;i++){
   const m=h.flight.instances.subarray(i*24,i*24+16),points=[];
   for(let j=0;j<h.flight.data.length;j+=12){const p=f.context.projectPoint(f.context.transformPoint(m,h.flight.data.subarray(j,j+3)),a);points.push(p);assert(p[0]>=1&&p[0]<=w-1,'bat clipped by viewport');assert(p[0]<left-2||p[0]>right+2,'bat overlaps tray');assert(p[1]>top+12&&p[1]<bottom-12,'bat enters header or controls');}
   if(time>=.6&&time<=1.2)assert(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))>=6,'held phone silhouette too small');
  }
 }
 a.prefs.motion=false;a.seasonMeshes();assert.equal(h.flight.count,0);a.prefs.motion=true;a.panelOpen=true;a.seasonMeshes();assert.equal(h.flight.count,0);a.panelOpen=false;a.time=2.21;a.seasonMeshes();assert.equal(h.flight.count,0);assert.equal(f.meshes.length,3);
});

test('earned tier integration escalates on one clock, then releases without state or resource growth',()=>{
 const f=fixture(),a=new f.JewelApp();Object.assign(a,{renderer:f.renderer,world:{halloween:f.context.make(f.renderer)},prefs:{flash:'full',particles:true,motion:true},presentation:{crownEnergy:0},juice:0,cssWidth:1280,cssHeight:800,season:'halloween',time:10,board:{seed:43,moves:5},expedition:{profile:{gems:200}}});
 const presentation=new f.context.JewelPresentation();presentation.app=a;const h=a.world.halloween,state=JSON.stringify([a.board,a.expedition]);
 assert.equal(presentation.feed([0,0,0],3,'match',300),'retained');assert.equal(h.beat.rank,1);assert.equal(h.flightAt,10);
 a.time=10.3;presentation.feed([0,0,0],4,'match',600);assert.equal(h.beat.rank,2);assert.equal(h.flightAt,10);
 a.time=10.6;presentation.feed([0,0,0],6,'match',900);assert.equal(h.beat.rank,3);assert.equal(h.flightAt,10);
 a.time=10.9;a.seasonMeshes();assert.equal(h.flight.count,12);assert(h.energy>0&&h.energy<=.4);const fixed=Array.from(h.flight.instances);a.seasonMeshes();assert.deepEqual(Array.from(h.flight.instances),fixed);
 const event=h.beat;presentation.feed([0,0,0],3,'match',300);assert.equal(h.beat,event);assert.equal(h.flightAt,10);
 a.prefs.motion=false;a.seasonMeshes();assert.equal(h.flight.count,0);assert.equal(h.energy,0);a.prefs.motion=true;a.prefs.flash='off';a.seasonMeshes();assert.equal(h.energy,0);
 a.time=12.3;a.seasonMeshes();assert.equal(h.flight.count,0);presentation.feed([0,0,0],1,'blast',100);assert.equal(h.flightAt,12.3);assert.equal(h.beat.rank,3);
 a.setSeason('classic');assert.equal(h.beat,null);assert.equal(h.flight.count,0);presentation.feed([0,0,0],6,'match',900);assert.equal(h.beat,null);
 a.setSeason('halloween');presentation.feed([0,0,0],6,'match',900);assert.equal(presentation.reset(),'retained');assert.equal(h.beat,null);assert.equal(h.flightTier,0);
 assert.equal(JSON.stringify([a.board,a.expedition]),state);assert.equal(f.meshes.length,3);
});
