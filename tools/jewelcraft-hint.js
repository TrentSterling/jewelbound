/* B004: expose the existing suggested swap. Read-only drawing; the original
   hint choice, lifetime, socket focus, controls and network state stay intact. */
CabinetUI.prototype.drawHintPair=function(){
 const a=this.app,e=a.expedition,p=this.ink,pair=a.hintCells;
 if(!e||e.photo||a.panelOpen||a.auto||a.gameOver||e.run?.finished||a.phase!=='idle'||a.time>a.hintUntil||pair?.length!==2)return;
 const [i,j]=pair;
 if(!Number.isInteger(i)||!Number.isInteger(j)||i<0||j<0||i>=64||j>=64||!a.board.adjacent(i,j))return;
 const actors=pair.map(k=>a.getActor(k));
 if(actors.some(ac=>!ac||ac.pop||ac.pos[1]>3.75||ac.scale[0]<.001))return;
 // Follow the same transformed mesh silhouette as selection and contrast mode.
 // A dark keyline keeps the ivory edge legible on white and yellow crystals.
 for(const ac of actors)for(const points of gemContours(ac,a)){
  p.poly(points,4,'#070710',.95);p.poly(points,1.7,'#fff0bf',1);
 }
 const centers=actors.map(ac=>project(ac.pos,a.vp,a.cssWidth,a.cssHeight));
 const dx=centers[1][0]-centers[0][0],dy=centers[1][1]-centers[0][1],d=Math.hypot(dx,dy);
 if(!Number.isFinite(d)||d<8)return;
 const ux=dx/d,uy=dy/d,vx=-uy,vy=ux,cx=(centers[0][0]+centers[1][0])/2,cy=(centers[0][1]+centers[1][1])/2;
 const span=d*.22,head=clamp(d*.1,2.5,5.5),x0=cx-ux*span,y0=cy-uy*span,x1=cx+ux*span,y1=cy+uy*span;
 const paths=[[x0,y0,x1,y1],
  [x0+ux*head+vx*head*.65,y0+uy*head+vy*head*.65,x0,y0,x0+ux*head-vx*head*.65,y0+uy*head-vy*head*.65],
  [x1-ux*head+vx*head*.65,y1-uy*head+vy*head*.65,x1,y1,x1-ux*head-vx*head*.65,y1-uy*head-vy*head*.65]];
 for(const points of paths){p.poly(points,4,'#070710',.95);p.poly(points,1.7,'#e4c88e',1);}
};
const jewelcraftHintDecor=CabinetUI.prototype.expeditionDecor;
// Existing selection, marked-target and high-contrast cues retain top priority.
CabinetUI.prototype.expeditionDecor=function(){this.drawHintPair();return jewelcraftHintDecor.call(this);};
