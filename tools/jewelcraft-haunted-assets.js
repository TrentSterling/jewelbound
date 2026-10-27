/* Haunted reliquary: production meshes, authored in the game's native Geo format.
   Opaque faceted surfaces and stepped inlays; no textures, lights or alpha. */
function halloweenContour(points){
 const area=points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0);
 return area<0?points.slice().reverse():points;
}
function halloweenInset(g,outline,col,lip,z,depth=.055,inset=.78,floorKind=8){
 outline=halloweenContour(outline);
 const c=outline.reduce((a,p)=>[a[0]+p[0]/outline.length,a[1]+p[1]/outline.length],[0,0]);
 const inner=outline.map(p=>[mix(c[0],p[0],inset),mix(c[1],p[1],inset)]);
 const at=(p,d=0)=>[p[0],p[1],(typeof z==='function'?z(p):z)+d];
 for(let i=0;i<outline.length;i++){
  const j=(i+1)%outline.length;
  g.quad(at(outline[i]),at(outline[j]),at(inner[j],-.018),at(inner[i],-.018),lip,10);
  g.quad(at(inner[i],-.018),at(inner[j],-.018),at(inner[j],-depth),at(inner[i],-depth),color('#17101b'),8);
 }
 halloweenFace(g,inner,col,floorKind,p=>(typeof z==='function'?z(p):z)-depth);
}
function halloweenRelief(g,outline,col,z,depth=.06,inset=.88){
 outline=halloweenContour(outline);
 const c=outline.reduce((a,p)=>[a[0]+p[0]/outline.length,a[1]+p[1]/outline.length],[0,0]);
 const inner=outline.map(p=>[mix(c[0],p[0],inset),mix(c[1],p[1],inset)]);
 for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;g.quad([...outline[i],z-depth],[...outline[j],z-depth],[...inner[j],z],[...inner[i],z],vmul(col,.72+(i%3)*.14),10);}
 halloweenFace(g,inner,col,10,z);
}
function halloweenPumpkin(){
 const g=new Geo(),amber=color('#e87619'),copper=color('#bd8135'),green=color('#658a43');
 // Eight full lobes with recessed seams, a flattened foot and a depressed crown.
 const point=(row,i)=>{const t=row/8*PI,a=i/24*TAU,r=Math.sin(t)*(.465+.065*Math.cos(a*8));return [Math.cos(a)*r,Math.cos(t)*.445-(row<2?.025:0),Math.sin(a)*r];};
 for(let j=0;j<8;j++)for(let i=0;i<24;i++){
  const col=vmul(amber,(i%3===0?.92:i%3===1?.72:1.03)*(j<3?1.12:j>5?.8:1));
  g.quad(point(j,i),point(j,i+1),point(j+1,i+1),point(j+1,i),col,10);
 }
 // Thick cut-amber lips slope into onyx walls and warm recessed cavity floors.
 const face=p=>.606-.16*(p[0]*p[0]+p[1]*p[1]),voidCol=color('#f3a13a');
 for(const s of [-1,1]){
  const eye=[[s*.055,.10],[s*.13,.28],[s*.285,.245],[s*.335,.11],[s*.19,.045]];
  halloweenInset(g,eye,voidCol,color('#ffb54b'),face,.065,.73,11);
  halloweenRelief(g,[[s*.045,.285],[s*.17,.345],[s*.31,.29],[s*.33,.25],[s*.14,.285]],vmul(amber,1.08),.59,.065);
 }
 halloweenInset(g,[[-.062,-.075],[0,.035],[.062,-.075]],voidCol,color('#e6a63d'),face,.065,.60,11);
 const mouth=[[-.335,-.105],[-.22,-.14],[-.19,-.205],[-.12,-.205],[-.12,-.145],[-.025,-.155],[-.025,-.225],[.065,-.225],[.065,-.15],[.19,-.13],[.22,-.19],[.27,-.16],[.335,-.105],[.255,-.30],[.105,-.355],[-.10,-.345],[-.26,-.28]];
 halloweenInset(g,mouth,voidCol,color('#f5a83b'),face,.072,.86,11);
 // A twisted woody stem and two beveled jade leaves, no floating flat triangle.
 g.tube([[0,.37,0],[.01,.49,.015],[.10,.57,.02],[.085,.65,.015]],.058,copper,1,6);
 g.tube([[-.014,.44,.052],[.038,.51,.065],[.12,.565,.05]],.012,color('#e1b45d'),1,4);
 for(const s of [-1,1]){
  halloweenRelief(g,[[s*.02,.42],[s*.16,.51],[s*.31,.49],[s*.22,.38],[s*.09,.365]],green,.12,.05,.75);
  g.tube([[s*.04,.425,.13],[s*.18,.445,.145],[s*.27,.475,.12]],.008,color('#b5bc64'),1,4);
 }
 // Two restrained copper brackets read as a mounted jewel, not an orange ball.
 for(const s of [-1,1])g.tube([[s*.29,-.31,.31],[s*.43,-.04,.30],[s*.38,.19,.28]],.013,copper,1,4);
 return g;
}
function halloweenSkull(){
 const g=new Geo(),ivory=color('#e7d7b8'),warm=color('#b8a58d'),onyx=color('#100f1b'),gold=color('#b28b49');
 const outline=halloweenContour([[-.16,.47],[.16,.47],[.31,.35],[.39,.15],[.33,-.075],[.23,-.18],[.14,-.23],[-.14,-.23],[-.23,-.18],[-.33,-.075],[-.39,.15],[-.31,.35]]);
 const brow=outline.map(([x,y])=>[x*.82,y*.83+.025]),face=outline.map(([x,y])=>[x*.69,y*.70+.045]);
 for(let i=0;i<outline.length;i++){
  const j=(i+1)%outline.length;
  g.quad([outline[i][0]*.88,outline[i][1]*.92,-.22],[outline[j][0]*.88,outline[j][1]*.92,-.22],[...outline[j],.015],[...outline[i],.015],warm,0);
  g.quad([...outline[i],.015],[...outline[j],.015],[...brow[j],.265],[...brow[i],.265],vmul(ivory,i%3===0?.79:1),0);
  g.quad([...brow[i],.265],[...brow[j],.265],[...face[j],.345],[...face[i],.345],ivory,0);
 }
 halloweenFace(g,face,ivory,0,.345);
 for(const s of [-1,1]){
  const orbit=[[s*.055,.13],[s*.115,.255],[s*.265,.225],[s*.29,.08],[s*.20,-.035],[s*.075,.025]];
  halloweenInset(g,orbit,onyx,warm,.415,.062,.79);
  halloweenRelief(g,[[s*.035,.24],[s*.115,.31],[s*.29,.265],[s*.31,.20],[s*.13,.245],[s*.06,.185]],ivory,.438,.09,.87);
  halloweenRelief(g,[[s*.205,.015],[s*.315,.065],[s*.32,-.10],[s*.21,-.225],[s*.17,-.16]],ivory,.34,.12,.76);
 }
 halloweenInset(g,[[-.065,-.15],[0,-.035],[.065,-.15],[0,-.19]],onyx,warm,.425,.06,.73);
 // Narrow jaw with a dark dental arcade and four broad, separated teeth.
 halloweenRelief(g,[[-.23,-.22],[-.15,-.39],[.15,-.39],[.23,-.22],[.17,-.15],[-.17,-.15]],warm,.22,.12,.87);
 halloweenFace(g,[[-.165,-.185],[.165,-.185],[.16,-.32],[-.16,-.32]],onyx,8,.29);
 for(const x of [-.12,-.04,.04,.12])halloweenRelief(g,[[x-.032,-.18],[x+.032,-.18],[x+.029,-.315],[x-.027,-.315]],ivory,.36,.075,.86);
 // Chased diadem follows the skull dome; a single onyx forehead seal.
 g.tube([[-.29,.30,.19],[-.16,.405,.25],[0,.445,.24],[.16,.405,.25],[.29,.30,.19]],.014,gold,1,5);
 halloweenInset(g,[[0,.365],[.048,.31],[0,.265],[-.048,.31]],color('#4b2f65'),gold,.405,.035,.75);
 return g;
}
function halloweenBat(detailed=true){
 const g=new Geo(),ink=color('#70518e'),dark=color('#23172f'),edge=color('#bd9c5c');
 const wing=[[.04,.10],[.20,.28],[.44,.43],[.83,.40],[.68,.12],[.58,-.07],[.43,.03],[.34,-.20],[.22,-.06],[.12,-.28],[.045,-.06]];
 for(const s of [-1,1]){
  const outline=halloweenContour(wing.map(([x,y])=>[s*x,y]));
  if(detailed)for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;g.quad([...outline[i],-.025],[...outline[j],-.025],[...outline[j],.035],[...outline[i],.035],dark,10);}
  halloweenFace(g,outline,ink,10,p=>.04+.08*Math.sin(Math.abs(p[0])*4.5));
  // Raised membrane folds meet substantial leading-edge bones.
  for(const [a,b,c,k] of [ [[.08,.10],[.44,.43],[.58,-.07],1.05],[[.08,.10],[.58,-.07],[.34,-.20],.76],[[.08,.10],[.34,-.20],[.12,-.28],1.22] ]){
   const p=[[s*a[0],a[1],.15],[s*b[0],b[1],.06],[s*c[0],c[1],.06]];if(s>0)p.reverse();g.tri(...p,vmul(ink,k),10);
  }
  if(detailed){
   g.tube(wing.slice(0,4).map(([x,y])=>[s*x,y,.10]),.013,edge,1,5);
   for(const [x,y] of [[.58,-.055],[.34,-.185],[.12,-.265]])g.tube([[s*.08,.11,.15],[s*x,y,.075]],.010,color('#c0a0c5'),0,4);
  }else{
   // At flight scale the same silhouette/folds need only a flat leading rim.
   for(let i=0;i<3;i++){const a=wing[i],b=wing[i+1];halloweenFace(g,[[s*a[0],a[1]-.007],[s*b[0],b[1]-.007],[s*b[0],b[1]+.007],[s*a[0],a[1]+.007]],edge,1,.105);}
  }
 }
 g.append(tintGeo(gemGeometry(3,7),color('#3b284e')),trs([0,-.01,.09],[0,0,0],[.29,.62,.45]));
 g.append(tintGeo(gemGeometry(2,7),color('#514063')),trs([0,.16,.12],[0,0,0],[.28,.25,.34]));
 for(const s of [-1,1]){
  const ear=[[s*.025,.20,.12],[s*.115,.37,.04],[s*.11,.12,.14]],eye=[[s*.027,.175,.23],[s*.065,.185,.21],[s*.055,.15,.23]];
  if(s>0){ear.reverse();eye.reverse();}g.tri(...ear,ink,7);g.tri(...eye,color('#efbd59'),10);
 }
 return g;
}
function buildHalloweenVault(renderer){
 const g=new Geo(),gold=color('#ac8751'),obsidian=color('#292137'),violet=color('#ad86dc'),green=color('#8cb66b');
 const pumpkin=halloweenPumpkin(),skull=halloweenSkull(),bat=halloweenBat();
 const place=(mesh,p,s,rz=0)=>g.append(mesh,trs(p,[0,0,rz],Array.isArray(s)?s:[s,s,s]));
 for(const s of [-1,1]){
  // Rail lanterns keep complete faces below the phone score and on-screen
  // through maximum camera punch; the broad crown carries the desktop hero art.
  place(pumpkin,[s*4.08,3.40,.40],.48,s*-.07);
  place(skull,[s*4.18,-4.06,.46],.78,s*.065);
  // Articulated obsidian pilaster: all carving stays beyond the playable aperture.
  g.box(s*4.30,.03,-.02,.15,7.35,.24,obsidian,0);
  for(const y of [-3.3,-1.6,.1,1.8,3.3]){
   g.box(s*4.30,y,.13,.23,.13,.15,gold,1);
   halloweenRelief(g,[[s*4.19,y+.21],[s*4.30,y+.37],[s*4.41,y+.21],[s*4.30,y+.08]],violet,.20,.06,.77);
  }
  // A suspended lantern on a faceted brass cradle replaces loose pumpkin clutter.
  place(pumpkin,[s*5.43,.04,.47],1.16,s*-.12);
  const arc=[];for(let k=0;k<=8;k++){const a=k/8*PI;arc.push([s*(5.43+Math.cos(a)*.72),.10+Math.sin(a)*.92,.15]);}
  g.tube(arc,.034,gold,1,5);
  g.tube([[s*4.3,.20,.08],[s*4.68,.20,.09],[s*4.88,-.44,.14],[s*5.43,-.67,.17],[s*5.99,-.44,.14]],.035,gold,1,5);
  place(bat,[s*5.08,2.27,.13],.94,s*-.12);
  g.tube([[s*5.08,1.95,.06],[s*5.08,1.53,.06],[s*5.43,1.01,.08]],.018,gold,1,4);
  // Deliberate corner webs: fewer, heavier strands remain readable at game scale.
  const anchor=[s*4.42,3.94,.12];
  for(let k=0;k<5;k++){const a=k/4*PI/2;g.tube([anchor,[anchor[0]+s*Math.cos(a)*1.05,anchor[1]-Math.sin(a)*1.05,.12]],.009,gold,1,4);}
  for(const radius of [.40,.77,1.03]){const p=[];for(let k=0;k<=8;k++){const a=k/8*PI/2,r=radius*(k%2?.86:1);p.push([anchor[0]+s*Math.cos(a)*r,anchor[1]-Math.sin(a)*r,.13]);}g.tube(p,.008,gold,1,4);}
  // Paired crystal candles seated in one architectural plinth, not a prop pile.
  g.box(s*5.01,-3.49,-.03,.97,.19,.66,obsidian,0);g.box(s*5.01,-3.38,.05,1.02,.08,.70,gold,1);
  for(let k=0;k<2;k++){
   const x=s*(4.78+k*.48),y=-2.60-k*.19;
   g.cylinder([x,y-.22,.05],.095,.145,.65+k*.22,obsidian,0,7);
   g.cylinder([x,-3.26,.05],.18,.22,.10,gold,1,8);
   place(tintGeo(gemGeometry(5,7),green),[x,y+.20+k*.08,.08],[.25,.45,.25],s*.07);
  }
 }
 const crownGeo=new Geo();
 // Wide, open-wing reliquary. Its crescent keeps a real negative-space opening.
 crownGeo.append(bat,trs([0,4.97,-.20],[0,0,0],[3.05,.48,.8]));
 const crescent=[[-.18,5.37],[-.52,5.26],[-.76,5.00],[-.79,4.68],[-.59,4.43],[-.29,4.33],[-.10,4.40],[-.38,4.57],[-.46,4.79],[-.35,5.03],[-.10,5.20],[.15,5.24]].map(([x,y])=>[x,(y-4.85)*.64+5.0]);
 halloweenRelief(crownGeo,crescent,color('#d9b66e'),.02,.10,.92);
 crownGeo.append(pumpkin,trs([0,5.0,.20],[0,0,0],[.50,.50,.50]));
 for(const s of [-1,1])crownGeo.tube([[s*.32,4.86,.27],[s*.27,4.70,.33],[s*.10,4.65,.32]],.025,gold,1,5);
 place(skull,[0,-4.44,.49],.43);
 const data=g.data(),crownData=crownGeo.data(),batData=halloweenBat(false).data();
 // Bake the shallow relief, then derive flat normals from its final triangles.
 // Geo.append uses M*n; an anisotropic wing stretch needs these corrected facets.
 for(let i=0;i<crownData.length;i+=36){
  for(let k=0;k<3;k++)crownData[i+k*12+2]*=.6;
  const a=crownData.subarray(i,i+3),b=crownData.subarray(i+12,i+15),c=crownData.subarray(i+24,i+27),n=vnorm(vcross(vsub(b,a),vsub(c,a)));
  for(let k=0;k<3;k++)crownData.set(n,i+k*12+3);
 }
 const mesh=renderer.createMesh(data,1),crown=renderer.createMesh(crownData,1),flight=renderer.createMesh(batData,12),instance=new Float32Array(packedInstance(identity()));
 const crownBounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 for(let i=0;i<crownData.length;i+=12)for(let k=0;k<3;k++){crownBounds.min[k]=Math.min(crownBounds.min[k],crownData[i+k]);crownBounds.max[k]=Math.max(crownBounds.max[k],crownData[i+k]);}
 renderer.upload(mesh,instance,1);renderer.upload(crown,instance,1);
 return {mesh,crown,crownBounds,flight,flightData:new Float32Array(12*24),flightAt:-100,flightTier:0,instance,triangles:(data.length+crownData.length)/36,crownTriangles:crownData.length/36,batTriangles:batData.length/36,bytes:data.byteLength+crownData.byteLength+batData.byteLength,energy:-1};
}
