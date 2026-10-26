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
const jewelboundOriginalWorld=buildWorld;
buildWorld=function(renderer){const w=jewelboundOriginalWorld(renderer);w.halloween=buildHalloweenVault(renderer);return w;};
// Invert only the projected z-plane. This keeps the existing opaque bat mesh
// inside measured phone gutters without a HUD overlay or a new render pass.
function halloweenScreenPoint(m,w,h,x,y,z){
 const u=x/w*2-1,v=1-y/h*2,A=m[0]-u*m[3],B=m[4]-u*m[7],C=u*(m[11]*z+m[15])-m[8]*z-m[12];
 const D=m[1]-v*m[3],E=m[5]-v*m[7],F=v*(m[11]*z+m[15])-m[9]*z-m[13],det=A*E-B*D;
 return [(C*E-B*F)/det,(A*F-C*D)/det,z];
}
function halloweenPhoneFlight(a,h,age,rank){
 if(a.panelOpen||a.aaCompare||a.expedition?.run?.finished)return 0;
 const w=a.cssWidth,H=a.cssHeight,f=cabinetFraming(w,H),y=f.targetY||0;
 const stable=matMul(perspective(42*PI/180,w/H,.1,150),lookAt([0,.62+y,f.distance],[0,y,0],[0,1,0]));
 // Union the live and stable tray envelope: shake/punch never move the flock
 // into a jewel, score plaque or lower control rail. No stale HUD rectangles.
 const corners=[];for(const m of [a.vp,stable])for(const x of [-3.78,3.78])for(const y of [-4.1,4.02])corners.push(project([x,y,.9],m,w,H));
 const left=Math.min(...corners.map(p=>p[0])),right=Math.max(...corners.map(p=>p[0]));
 const top=Math.max(project([-4.02,4.02,.9],a.vp,w,H)[1],project([-4.02,4.02,.9],stable,w,H)[1])+24;
 const bottom=Math.min(project([4.02,-4.1,.9],a.vp,w,H)[1],project([4.02,-4.1,.9],stable,w,H)[1])-24;
 const span=bottom-top;let count=0;
 if(span<48)return 0;
 for(const side of [-1,1]){
  const available=(side<0?left:w-right)-8,width=Math.min(19,available*.83);
  if(width<7)continue;
  for(let k=0;k<3;k++){
   const pose=halloweenBeatPose(side,k,age,rank);if(pose.visibility<=0)continue;
   const cx=(side<0?left/2:w-(w-right)/2)+Math.sin(age*5+k)*.6;
   const cy=bottom-(age/2.2*(.51+rank*.047)+k*.105)*span,sc=width/1.66*pose.visibility*(.86+k*.07);
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
 if(this.season!==season&&this.world?.halloween){this.world.halloween.beat=null;this.world.halloween.flightAt=-100;this.world.halloween.flightTier=0;this.world.halloween.flight.count=0;}
 this.season=season;writeStorage(JEWELBOUND_SEASON_KEY,season);return true;
};
JewelApp.prototype.seasonMeshes=function(){
 const h=this.world.halloween;if(this.season!=='halloween')return [];
 const age=this.time-h.flightAt,rank=h.beat?halloweenBeatRank(h.beat,this.time):halloweenBeat(h.flightTier).rank;
 // Earned beat warmth follows one smooth envelope on the simulation clock.
 // Reduced motion/particles retain only the pre-existing cabinet warmth.
 const beatEnergy=this.prefs.motion&&this.prefs.particles?halloweenBeatEnergy(age,rank):0;
 const energy=({off:0,low:.35}[this.prefs.flash]??1)*Math.min(.40,Math.max(this.presentation.crownEnergy*.20+this.juice*.08,beatEnergy));
 if(energy!==h.energy){h.instance.set(packedInstance(identity(),[1,1,1],energy,-1));this.renderer.upload(h.mesh,h.instance,1);this.renderer.upload(h.crown,h.instance,1);h.energy=energy;}
 // The existing portrait HUD occludes the crown's middle. Omit it as a whole
 // rather than leave a fragment between the title and score. Photos keep it.
 const portrait=this.cssWidth<600&&this.cssHeight>this.cssWidth&&!this.expedition?.photo;
 const meshes=portrait?[h.mesh]:[h.mesh,h.crown];
 if(this.prefs.particles&&this.prefs.motion&&age>=0&&age<2.2){
  let count=0;
  if(portrait)count=halloweenPhoneFlight(this,h,age,rank);
  else for(const s of [-1,1])for(let k=0;k<6;k++){
   const pose=halloweenBeatPose(s,k,age,rank);if(pose.scale<=0)continue;
   const m=trs(pose.pos,pose.rotation,[pose.scale,pose.scale,pose.scale]);
   h.flightData.set(packedInstance(m,[1,1,1],0,-1),count++*24);
  }
  this.renderer.upload(h.flight,h.flightData.subarray(0,count*24),count);if(count)meshes.push(h.flight);
 }else h.flight.count=0;
 return meshes;
};
const jewelboundSeasonFeed=JewelPresentation.prototype.feed;
JewelPresentation.prototype.feed=function(center,cascade,mode,points){
 const result=jewelboundSeasonFeed.call(this,center,cascade,mode,points),a=this.app,h=a.world.halloween;
 if(a.season==='halloween'&&halloweenBeat(cascade,mode).rank){
  h.beat=halloweenMergeBeat(h.beat,a.time,cascade,mode);h.flightAt=h.beat.at;if(Number.isFinite(cascade))h.flightTier=Math.max(h.flightTier,cascade);
 }
 return result;
};
const jewelboundSeasonReset=JewelPresentation.prototype.reset;
JewelPresentation.prototype.reset=function(...args){
 const h=this.app.world?.halloween;if(h){h.beat=null;h.flightAt=-100;h.flightTier=0;h.flight.count=0;}
 return jewelboundSeasonReset.apply(this,args);
};
const jewelboundSeasonActivate=CabinetUI.prototype.activate;
CabinetUI.prototype.activate=function(id,...args){
 if(id==='jewelbound-season'){this.app.setSeason(this.app.season==='halloween'?'classic':'halloween');return;}
 return jewelboundSeasonActivate.call(this,id,...args);
};
