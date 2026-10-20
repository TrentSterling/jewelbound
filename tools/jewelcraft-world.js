function buildWorld(renderer){
 const g=new Geo(),gold=color('#9e8051'),paleGold=color('#ddc995'),darkGold=color('#514431'),stone=color('#121220'),black=color('#070912'),cyan=color('#9a85df'),rng=new SeededRandom(19081);
 // A jeweller's tray cut from obsidian. The playable aperture and socket anchors
 // are unchanged: input, previews, and accessibility outlines use real geometry.
 bevelBox(g,[0,0,-.38],8.56,8.56,.64,stone,0,.18,.29);
 bevelBox(g,[0,0,-.065],7.78,7.78,.16,black,0,.045,.09);
 for(let i=0;i<64;i++){
  const [x,y]=cellXY(i);
  bevelBox(g,[x,y,.002],.90,.90,.105,color('#1c192b'),0,.028,.06);
  bevelBox(g,[x,y,.057],.805,.805,.02,color('#090b16'),0,.013,.035);
  for(let sx of [-1,1])for(let sy of [-1,1]){
   const c=[x+sx*.392,y+sy*.392,.077];
   g.tube([[c[0]-sx*.09,c[1],c[2]],c,[c[0],c[1]-sy*.09,c[2]]],.0085,darkGold,1,4);
  }
 }
 frameRect(g,0,0,8.17,8.17,.01,.29,color('#211b2b'),0);
 frameRect(g,0,0,8.44,8.44,-.02,.026,gold);
 frameRect(g,0,0,7.83,7.83,.12,.018,paleGold);
 frameRect(g,0,0,8.14,8.14,.107,.026,vmul(cyan,.28),3);
 // Inlaid lozenges, separated by generous stretches of unadorned black stone.
 for(let side=0;side<4;side++)for(let k of [-3,-1.5,0,1.5,3]){
  const convert=(x,y)=>side===0?[x,y,.166]:side===1?[x,-y,.166]:side===2?[y,x,.166]:[-y,x,.166];
  g.tube([convert(k-.11,4.08),convert(k,4.13),convert(k+.11,4.08),convert(k,4.03),convert(k-.11,4.08)],.006,gold,1,4);
 }
 for(let sx of [-1,1])for(let sy of [-1,1]){
  const relief=sy<0?.10:0,p=[sx*4.10,sy*4.10,.15+relief*.5],mount=new Geo();
  bevelBox(mount,[0,0,0],.44,.44,.19+relief,stone,0,.065,.09);
  g.append(mount,trs(p,[0,0,PI/4]));
  g.append(tintGeo(gemGeometry(5,7),color('#9f87dc')),trs([p[0],p[1],.30+relief],[0,0,0],[.30,.35,.30]));
  const z=.28+relief;
  g.tube([[p[0],p[1]+.30,z],[p[0]+.25,p[1],z],[p[0],p[1]-.30,z],[p[0]-.25,p[1],z],[p[0],p[1]+.30,z]],.012,paleGold,1,5);
 }
 // Low, sculpted base; the fine metal edge catches the studio light.
 bevelBox(g,[0,-4.48,-.17],8.78,.36,.98,stone,0,.08,.15);
 bevelBox(g,[0,-4.69,-.20],8.95,.10,1.02,gold,1,.022,.05);
 for(let s of [-1,1]){
  bevelBox(g,[s*3.35,-5.00,-.16],.64,.54,.68,stone,0,.08,.12);
  bevelBox(g,[s*3.35,-5.24,-.16],.78,.07,.78,gold,1,.015,.03);
  g.tube([[s*.40,-4.45,.39],[s*1.1,-4.45,.39],[s*1.3,-4.40,.39],[s*3.95,-4.40,.39]],.009,gold,1,4);
 }
 g.append(tintGeo(gemGeometry(5,7),color('#bf9cdd')),trs([0,-4.45,.38],[0,0,0],[.36,.36,.30]));
 // Crown and side crystals retain the existing effect emitter locations.
 g.cylinder([0,4.46,-.1],.20,.37,.30,stone,0,8);
 for(let s of [-1,1])g.tube([[s*.95,4.23,-.06],[s*.54,4.40,-.05],[s*.30,4.65,-.05]],.017,gold,1,6);
 for(let s of [-1,1]){
  const x=s*5.36;
  bevelBox(g,[x,-.60,.02],.54,.14,.50,stone,0,.04,.08);
  g.tube([[s*4.24,-.08,-.03],[s*4.85,-.08,.02],[x,-.50,.07]],.025,gold,1,6);
  g.append(tintGeo(gemGeometry(3,7),color('#b7a0e9')),trs([x,-.04,.17],[.05,0,0],[.40,.95,.40]));
  g.tube([[x,-.61,.12],[x-.39,-.04,.12],[x,.65,.12],[x+.39,-.04,.12],[x,-.61,.12]],.012,gold,1,5);
 }
 // Quiet midnight vault: angular masonry and engraved floor, no sea or garden.
 g.quad([-90,-5.45,12],[90,-5.45,12],[90,-5.45,-100],[-90,-5.45,-100],color('#090911'),0);
 // A deep interior wall closes the floor's horizon, behind the layered ribs.
 g.quad([-90,-5.45,-70],[90,-5.45,-70],[90,90,-70],[-90,90,-70],color('#171127'),0);
 g.cylinder([0,-5.66,-.1],10.8,11.0,.42,color('#13111d'),0,12);
 for(const r of [8.8,10.4])g.ring([0,-5.44,-.1],r,.012,darkGold,1,'y',96);
 for(let s of [-1,1]){
  for(let layer=0;layer<2;layer++){
   const x=s*(7.1+layer*2.3),z=-6.8-layer*7;
   bevelBox(g,[x,.3,z],.85,11.5,1.1,color('#1c182a'),0,.16,.18);
   bevelBox(g,[x,-4.8,z],1.24,1.1,1.42,stone,0,.12,.16);
   g.tube([[x,-4.1,z+.57],[x,5.8,z+.57]],.012,darkGold,1,4);
   const a=[[x,-3.5,z],[x,4.0,z],[x*.80,5.7,z],[x*.45,7.1,z],[0,8.0,z]];
   g.tube(a,.16,color('#292333'),0,5);
   g.tube(a.map(p=>[p[0],p[1]-.15,p[2]+.17]),.012,darkGold,1,4);
  }
  for(let j=0;j<5;j++){
   const x=s*(6.8+j*.66),z=-6-j*1.7,scale=.55+rng.next()*.60;
   g.append(tintGeo(gemGeometry(j%2?3:5,7),color(j%2?'#685492':'#414c76')),trs([x,-4.8+scale*.7,z],[.12,s*.16,s*(.1+j*.08)],[scale,scale*(2+j*.22),scale]));
  }
  for(let j=0;j<3;j++){
   const sc=.32+j*.14;
   g.append(tintGeo(gemGeometry(j%2?3:5,7),color('#8b72b5')),trs([s*(5.8+j*.4),-5.1+sc*.6,2.3-j*.3],[.08,s*.2,s*.2],[sc,sc*1.8,sc]));
  }
 }
 // Slow floating cut-crystal clusters replace the distant garden silhouettes.
 const cluster=new Geo();
 for(let i=0;i<5;i++){
  const x=(i-2)*.38,sc=.5+(i===2?.45:0);
  cluster.append(tintGeo(gemGeometry(i%2?3:5,7),color(i%2?'#645385':'#546488')),trs([x,-Math.abs(i-2)*.25,0],[0,.3,(i-2)*-.18],[sc,sc*1.75,sc]));
 }
 const islandMesh=renderer.createMesh(cluster.data(),8),islands=[];
 for(let i=0;i<7;i++)islands.push({base:[(i-3)*8,-.7+(i%3)*1.1,-30-(i%2)*8],scale:.7+(i%3)*.2,bob:.09,speed:.13,twist:.035,pitch:.012,roll:.012,phase:i*1.7,tint:[.7,.7,.85]});
