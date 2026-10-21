/* B016: keep a puzzle's target seal inside its own cell. Fixed pixel offsets
   can point at another row when the tray is small. Correct placements stay exact. */
CabinetUI.prototype.drawPuzzleTarget=function(i,q){
 const a=this.app,p=this.ink,c=cellXY(i),legacy={x:q[0]-3,y:q[1]+19,w:6,h:6};
 const cell=[[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]].map(([x,y])=>project([c[0]+x*CELL,c[1]+y*CELL,c[2]],a.vp,a.cssWidth,a.cssHeight).slice(0,2));
 const inside=(x,y)=>{const crosses=cell.map((v,k)=>{const n=cell[(k+1)%4];return(n[0]-v[0])*(y-v[1])-(n[1]-v[1])*(x-v[0]);});return crosses.every(v=>v>=0)||crosses.every(v=>v<=0);};
 const contains=(r,gap=0)=>[[r.x-gap,r.y-gap],[r.x+r.w+gap,r.y-gap],[r.x+r.w+gap,r.y+r.h+gap],[r.x-gap,r.y+r.h+gap]].every(([x,y])=>inside(x,y));
 if(!cell.flat().every(Number.isFinite)||!q.slice(0,2).every(Number.isFinite))return null;
 const area=cell.reduce((sum,v,k)=>{const n=cell[(k+1)%4];return sum+v[0]*n[1]-n[0]*v[1];},0);
 if(Math.abs(area)<.01)return null;
 if(contains(legacy,.6)){p.box(legacy.x,legacy.y,6,6,'#ffe27a',2);return{relocated:false,rect:legacy,cell};}
 const span=Math.min(...cell.map((v,k)=>Math.hypot(v[0]-cell[(k+1)%4][0],v[1]-cell[(k+1)%4][1])));
 const center=project([c[0],c[1]-CELL*.28,c[2]],a.vp,a.cssWidth,a.cssHeight),half=Math.min(3,span*.085),border=Math.min(1,span*.04);
 const rect={x:center[0]-half-border,y:center[1]-half-border,w:(half+border)*2,h:(half+border)*2};
 // Include the antialias fringe; at unusably tiny projections the existing
 // target contour still identifies the gem without drawing a misplaced seal.
 if(span<2||!contains(rect,.6))return{relocated:true,rect:null,cell};
 p.box(rect.x,rect.y,rect.w,rect.h,'#070710',0,1);
 p.box(center[0]-half,center[1]-half,half*2,half*2,'#e4c88e',0,1);
 return{relocated:true,rect,cell,span};
};
