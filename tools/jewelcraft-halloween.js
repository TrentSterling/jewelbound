/* Halloween vault: opaque, merged jewellery, local cosmetic preference only.
   The playable jewels, their contours, co-op state and progression are unchanged. */
const JEWELBOUND_SEASON_KEY='jewelbound-season-v1';
function jewelboundSeason(saved=readStorage(JEWELBOUND_SEASON_KEY,null),month=new Date().getMonth()){
 return saved==='halloween'||saved==='classic'?saved:month===9?'halloween':'classic';
}
// Ear-clipped concave faces retain scalloped wing and tooth silhouettes instead
// of overlapping triangle fans. Each carving is made once at world creation.
function halloweenFace(g,points,col,kind,z=.0){
 const area=points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0);
 const ids=points.map((_,i)=>i);if(area<0)ids.reverse();
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const at=p=>[p[0],p[1],typeof z==='function'?z(p):z];
 for(let budget=points.length*points.length;ids.length>2&&budget-->0;){
  let clipped=false;
  for(let i=0;i<ids.length;i++){
   const ai=ids[(i+ids.length-1)%ids.length],bi=ids[i],ci=ids[(i+1)%ids.length],a=points[ai],b=points[bi],c=points[ci];
   if(cross(a,b,c)<=1e-8)continue;
   if(ids.some(k=>k!==ai&&k!==bi&&k!==ci&&cross(a,b,points[k])>=-1e-8&&cross(b,c,points[k])>=-1e-8&&cross(c,a,points[k])>=-1e-8))continue;
   g.tri(at(a),at(b),at(c),col,kind);ids.splice(i,1);clipped=true;break;
  }
  if(!clipped)throw Error('Invalid Halloween carving contour');
 }
 return g;
}
function halloweenCarve(g,outline,inside,z,scale=.76){
 const center=outline.reduce((p,q)=>[p[0]+q[0]/outline.length,p[1]+q[1]/outline.length],[0,0]);
 const inner=outline.map(p=>[center[0]+(p[0]-center[0])*scale,center[1]+(p[1]-center[1])*scale]);
 const dark=color('#090813');
 // Unlit cavity walls cannot reflect a white studio highlight into an eye.
 for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length,a=outline[i],b=outline[j],c=inner[j],d=inner[i];g.quad([...a,z+.012],[...b,z+.012],[...c,z],[...d,z],dark,8);}
 halloweenFace(g,inner,inside,8,z);
}
function halloweenPumpkin(){
 const g=new Geo(),amber=color('#ed861f'),dark=color('#171021'),gold=color('#ba9858');
 const point=(row,i)=>{const t=row/8*PI,a=i/16*TAU,r=Math.sin(t)*(.49+.035*Math.cos(a*8));return [Math.cos(a)*r,Math.cos(t)*.43,Math.sin(a)*r];};
 for(let j=0;j<8;j++)for(let i=0;i<16;i++){
  const c=vmul(amber,.78+.22*(i%2));
  g.quad(point(j,i),point(j,i+1),point(j+1,i+1),point(j+1,i),c,10);
 }
 // Deep black-onyx inlays follow the front facets; no alpha or light objects.
 const ember=color('#381407');
 for(const s of [-1,1])halloweenCarve(g,[[s*.055,.075],[s*.31,.10],[s*.235,.28]],ember,.553,.64);
 halloweenCarve(g,[[-.063,-.065],[.063,-.065],[0,.035]],dark,.558,.65);
 const mouth=[[-.32,-.11],[-.20,-.13],[-.17,-.20],[-.10,-.20],[-.10,-.14],[.04,-.15],[.04,-.215],[.115,-.215],[.15,-.14],[.32,-.11],[.23,-.29],[.11,-.33],[-.09,-.32],[-.23,-.27]];
 halloweenCarve(g,mouth,ember,.548,.79);
 // Sparse chased-brass ribs frame the amber lobes without turning it into a cage.
 for(const s of [-1,1])g.tube([[s*.31,-.27,.30],[s*.42,0,.30],[s*.30,.28,.27]],.008,gold,1,4);
 g.tube([[0,.38,0],[.035,.57,.015],[.14,.64,.025]],.055,gold,1,5);
 g.tri([.04,.47,.05],[.29,.52,.06],[.14,.38,.13],color('#668c49'),7);
 return g;
}
function halloweenSkull(){
 const g=new Geo(),ivory=color('#e4d6bd'),onyx=color('#110e19');
 const outline=[[-.16,.46],[.16,.46],[.31,.34],[.37,.16],[.32,-.05],[.23,-.15],[.13,-.22],[-.13,-.22],[-.23,-.15],[-.32,-.05],[-.37,.16],[-.31,.34]];
 const inset=outline.map(([x,y])=>[x*.83,y*.84+.02]);
 for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;g.quad([...outline[i],.02],[...outline[j],.02],[...inset[j],.27],[...inset[i],.27],vmul(ivory,i%3===0?.86:1),0);g.quad([...outline[j],-.15],[...outline[i],-.15],[...outline[i],.02],[...outline[j],.02],vmul(ivory,.72),0);}
 halloweenFace(g,inset,ivory,0,.27);
 g.box(0,-.255,.07,.34,.16,.23,onyx,8);
 for(const s of [-1,1]){
  const eye=[[s*.055,.17],[s*.12,.25],[s*.265,.205],[s*.255,.055],[s*.14,.015],[s*.065,.07]];
  halloweenCarve(g,eye,onyx,.292,.80);
  g.tri([s*.24,-.105,.24],[s*.32,.01,.18],[s*.20,-.25,.21],ivory,0);
 }
 halloweenCarve(g,[[-.055,-.14],[0,-.035],[.055,-.14],[0,-.17]],onyx,.30,.72);
 for(const x of [-.14,-.07,0,.07,.14])g.box(x,-.29,.24,.052,.16-Math.abs(x)*.20,.07,ivory,0);
 g.tube([[-.20,-.33,.13],[-.13,-.41,.15],[.13,-.41,.15],[.20,-.33,.13]],.035,ivory,0,5);
 return g;
}
function halloweenBat(){
 const g=new Geo(),ink=color('#70518e'),edge=color('#b39b68');
 const wing=[[.04,.10],[.20,.28],[.44,.43],[.83,.40],[.68,.12],[.58,-.07],[.43,.03],[.34,-.20],[.22,-.06],[.12,-.28],[.045,-.06]];
 for(const s of [-1,1]){
  halloweenFace(g,wing.map(([x,y])=>[s*x,y]),ink,10,p=>.035+.07*Math.sin(Math.abs(p[0])*4.5));
  g.tube(wing.slice(0,4).map(([x,y])=>[s*x,y,.10]),.008,edge,1,4);
  for(const [x,y] of [[.58,.07],[.34,-.08],[.12,-.20]])g.tube([[s*.08,.13,.12],[s*x,y,.08]],.006,color('#ae85b4'),0,4);
 }
 g.append(tintGeo(gemGeometry(3,7),color('#33223e')),trs([0,0,.065],[0,0,0],[.25,.57,.35]));
 for(const s of [-1,1])g.tri([s*.025,.20,.09],[s*.115,.37,.03],[s*.11,.12,.10],ink,7);
 return g;
}
function buildHalloweenVault(renderer){
 const g=new Geo(),gold=color('#ac8751'),violet=color('#ad86dc'),green=color('#8cb66b');
 const pumpkin=halloweenPumpkin(),skull=halloweenSkull(),bat=halloweenBat();
 const place=(mesh,p,s,rz=0)=>g.append(mesh,trs(p,[0,0,rz],Array.isArray(s)?s:[s,s,s]));
 // Jewel-cut lantern finials and ivory memento-mori at the original mounts.
 for(const s of [-1,1]){
  place(pumpkin,[s*4.12,4.09,.38],.64,s*-.09);
  place(skull,[s*4.13,-4.08,.46],.73,s*.08);
  place(pumpkin,[s*5.40,-.02,.45],1.15,s*-.12);
  g.tube([[s*4.28,-.08,.17],[s*5.03,-.08,.22],[s*5.4,-.57,.24]],.032,gold,1,5);
  // Amethyst bats perch outside the playable aperture.
  place(bat,[s*5.05,2.25,.13],.80,s*-.15);
  place(bat,[s*7.35,1.55,-5],.85,s*.10);
  // Fine gold cobweb filigree stays strictly outside the tray.
  const anchor=[s*4.30,3.95,.12];
  for(let k=0;k<5;k++){
   const a=k/4*PI/2;
   g.tube([anchor,[anchor[0]+s*Math.cos(a)*1.12,anchor[1]-Math.sin(a)*1.12,.12]],.007,gold,1,4);
  }
  for(const radius of [.35,.66,.98]){
   const points=[];for(let k=0;k<=8;k++){const a=k/8*PI/2,r=radius*(k%2?.85:1);points.push([anchor[0]+s*Math.cos(a)*r,anchor[1]-Math.sin(a)*r,.13]);}
   g.tube(points,.006,gold,1,4);
  }
  // Three spectral-green crystal candles, built into the lower side pedestals.
  for(let k=0;k<3;k++){
   const x=s*(4.75+k*.30),y=-2.6-k*.18;
   g.cylinder([x,y-.22,.05],.105,.14,.65+k*.16,color('#343046'),0,7);
   g.cylinder([x,y-.55-k*.08,.05],.19,.23,.10,gold,1,8);
   place(tintGeo(gemGeometry(5,7),green),[x,y+.19+k*.08,.08],[.24,.43,.24],s*.07);
  }
  // Distant pumpkin grotto, recessed behind UI and the cabinet.
  for(let k=0;k<3;k++)place(pumpkin,[s*(6.1+k*1.1),-4.65+k*.05,-3.8-k*2],.85+k*.24,s*(k-.5)*.2);
  g.tube([[s*4.27,-3.85,.14],[s*4.45,-3.10,.08],[s*4.33,-2.2,.09],[s*4.53,-1.3,.05]],.035,color('#413748'),0,5);
  for(let k=0;k<4;k++)place(tintGeo(gemGeometry(5,7),violet),[s*(4.43+k%2*.16),-3.5+k*.55,.12],[.18,.29,.16],s*(.6+k*.15));
 }
 // Amber crown with onyx wings; it replaces the original crown only in this theme.
 const crownGeo=new Geo();
 crownGeo.append(pumpkin,trs([0,4.72,.15],[0,0,0],[.68,.68,.68]));
 crownGeo.append(bat,trs([0,4.63,-.15],[0,0,0],[1.65,.86,.8]));
 place(skull,[0,-4.44,.49],.46);
 const data=g.data(),crownData=crownGeo.data(),batData=bat.data(),mesh=renderer.createMesh(data,1),crown=renderer.createMesh(crownData,1),flight=renderer.createMesh(batData,12),instance=new Float32Array(packedInstance(identity()));
 renderer.upload(mesh,instance,1);
 renderer.upload(crown,instance,1);
 return {mesh,crown,flight,flightData:new Float32Array(12*24),flightAt:-100,flightTier:0,instance,triangles:(data.length+crownData.length)/36,crownTriangles:crownData.length/36,batTriangles:batData.length/36,bytes:data.byteLength+crownData.byteLength+batData.byteLength,energy:-1};
}
const jewelboundOriginalWorld=buildWorld;
buildWorld=function(renderer){const w=jewelboundOriginalWorld(renderer);w.halloween=buildHalloweenVault(renderer);return w;};
// Invert only the projected z-plane. This keeps the existing opaque bat mesh
// inside measured phone gutters without a HUD overlay or a new render pass.
function halloweenScreenPoint(m,w,h,x,y,z){
 const u=x/w*2-1,v=1-y/h*2,A=m[0]-u*m[3],B=m[4]-u*m[7],C=u*(m[11]*z+m[15])-m[8]*z-m[12];
 const D=m[1]-v*m[3],E=m[5]-v*m[7],F=v*(m[11]*z+m[15])-m[9]*z-m[13],det=A*E-B*D;
 return [(C*E-B*F)/det,(A*F-C*D)/det,z];
}
function halloweenPhoneFlight(a,h,age,envelope){
 if(a.panelOpen||a.aaCompare||a.expedition?.run?.finished)return 0;
 const w=a.cssWidth,H=a.cssHeight,f=cabinetFraming(w,H),y=f.targetY||0;
 const stable=matMul(perspective(42*PI/180,w/H,.1,150),lookAt([0,.62+y,f.distance],[0,y,0],[0,1,0]));
 // Union the live and stable tray envelope: shake/punch never move the flock
 // into a jewel, score plaque or lower control rail. No stale HUD rectangles.
 const corners=[];for(const m of [a.vp,stable])for(const x of [-3.78,3.78])for(const y of [-4.1,4.02])corners.push(project([x,y,.9],m,w,H));
 const left=Math.min(...corners.map(p=>p[0])),right=Math.max(...corners.map(p=>p[0]));
 const top=Math.max(project([-4.02,4.02,.9],a.vp,w,H)[1],project([-4.02,4.02,.9],stable,w,H)[1])+24;
 const bottom=Math.min(project([4.02,-4.1,.9],a.vp,w,H)[1],project([4.02,-4.1,.9],stable,w,H)[1])-24;
 const span=bottom-top,n=Math.min(3,h.flightTier);let count=0;
 if(span<48)return 0;
 for(const side of [-1,1]){
  const available=(side<0?left:w-right)-8,width=Math.min(19,available*.83);
  if(width<7)continue;
  for(let k=0;k<n;k++){
   const cx=(side<0?left/2:w-(w-right)/2)+Math.sin(age*5+k)*.6;
   const cy=bottom-(age/2.2*.65+k*.105)*span,sc=width/1.66*envelope*(.86+k*.07);
   const p=halloweenScreenPoint(a.vp,w,H,cx,cy,.65),px=halloweenScreenPoint(a.vp,w,H,cx+1,cy,.65),py=halloweenScreenPoint(a.vp,w,H,cx,cy-1,.65);
   const m=identity();m[0]=(px[0]-p[0])*sc;m[1]=(px[1]-p[1])*sc;m[4]=(py[0]-p[0])*sc;m[5]=(py[1]-p[1])*sc;m[10]=Math.hypot(m[0],m[1])*.35;m.set(p,12);
   h.flightData.set(packedInstance(m,[1,1,1],0,-1),count++*24);
  }
 }
 return count;
}
const jewelboundOriginalPreferences=JewelApp.prototype.applyPreferences;
JewelApp.prototype.applyPreferences=function(...args){
 if(!this.season)this.season=jewelboundSeason();
 return jewelboundOriginalPreferences.apply(this,args);
};
JewelApp.prototype.setSeason=function(season){
 if(!['classic','halloween'].includes(season))return false;
 if(this.season!==season&&this.world?.halloween){this.world.halloween.flightAt=-100;this.world.halloween.flight.count=0;}
 this.season=season;writeStorage(JEWELBOUND_SEASON_KEY,season);return true;
};
JewelApp.prototype.seasonMeshes=function(){
 const h=this.world.halloween;if(this.season!=='halloween')return [];
 // Existing earned crown energy warms cut-amber facets, with no new flash clock.
 const energy=({off:0,low:.35}[this.prefs.flash]??1)*Math.min(.40,this.presentation.crownEnergy*.20+this.juice*.08);
 if(energy!==h.energy){h.instance.set(packedInstance(identity(),[1,1,1],energy,-1));this.renderer.upload(h.mesh,h.instance,1);this.renderer.upload(h.crown,h.instance,1);h.energy=energy;}
 // The existing portrait HUD occludes the crown's middle. Omit it as a whole
 // rather than leave a fragment between the title and score. Photos keep it.
 const portrait=this.cssWidth<600&&this.cssHeight>this.cssWidth&&!this.expedition?.photo;
 const meshes=portrait?[h.mesh]:[h.mesh,h.crown],age=this.time-h.flightAt;
 if(this.prefs.particles&&this.prefs.motion&&age>=0&&age<2.2){
  const n=Math.min(6,h.flightTier+1),envelope=Math.min(1,age/.18,(2.2-age)/.4);let count=0;
  if(portrait)count=halloweenPhoneFlight(this,h,age,envelope);
  else for(const s of [-1,1])for(let k=0;k<n;k++){
   const t=age+k*.12,sc=(.20+k*.018)*envelope;
   // Begin above the side HUD cards so repeated cascades cannot hide the flock.
   const p=[s*(4.72+k*.35+age*.22),2.65+t*.85,.36];
   const m=trs(p,[0,s*Math.sin(t*10+k)*.35,s*(-.12+.1*Math.sin(t*3))],[sc,sc,sc]);
   h.flightData.set(packedInstance(m,[1,1,1],0,-1),count++*24);
  }
  this.renderer.upload(h.flight,h.flightData.subarray(0,count*24),count);if(count)meshes.push(h.flight);
 }else h.flight.count=0;
 return meshes;
};
const jewelboundSeasonFeed=JewelPresentation.prototype.feed;
JewelPresentation.prototype.feed=function(center,cascade,mode,points){
 const result=jewelboundSeasonFeed.call(this,center,cascade,mode,points),a=this.app,h=a.world.halloween;
 if(a.season==='halloween'&&(cascade>=3||mode==='prism'||mode==='blast')){h.flightAt=a.time;h.flightTier=Math.max(2,Math.min(5,cascade));}
 return result;
};
const jewelboundSeasonReset=JewelPresentation.prototype.reset;
JewelPresentation.prototype.reset=function(...args){
 const h=this.app.world?.halloween;if(h){h.flightAt=-100;h.flight.count=0;}
 return jewelboundSeasonReset.apply(this,args);
};
const jewelboundSeasonActivate=CabinetUI.prototype.activate;
CabinetUI.prototype.activate=function(id,...args){
 if(id==='jewelbound-season'){this.app.setSeason(this.app.season==='halloween'?'classic':'halloween');return;}
 return jewelboundSeasonActivate.call(this,id,...args);
};
