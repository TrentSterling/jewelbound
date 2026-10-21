/* B015: fit a colliding short-screen notice beside the tray, keeping the
   complete message, goal and counter readable. Other notices stay unchanged. */
CabinetUI.prototype.playNotice=function(text,x,y,w){
 const original=()=>{this.plaque(x,y,w,32);this.text(text,x+w/2,y+9,13,UI_ART.highlight,'center',w-20);};
 const a=this.app,t=this.titleRect;
 if(!this.narrowScoreRect||a.cssHeight>=460||a.panelOpen||a.expedition?.photo||a.aaCompare||a.expedition?.run.finished||a.practice||a.auto||!t||x-3>=t.x+t.w+3||x+w+3<=t.x-3||y>=t.y+t.h+8||y+40<=t.y)return original();
 this.pendingPlayNotice={text,message:this.toastMessage,x,y,w,opacity:this.ink.opacity,original};
};
const jewelcraftBeforeNotice=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(...args){
 this.pendingPlayNotice=null;this.playNoticeLayout=null;
 try{
  const result=jewelcraftBeforeNotice.apply(this,args),n=this.pendingPlayNotice;
  if(!n)return result;
  const opacity=this.ink.opacity;
  try{
   this.ink.opacity=n.opacity;
   const a=this.app,b=this.boardRect,t=this.titleRect;
   const shadow=r=>({x:r.x-3,y:r.y,w:r.w+6,h:r.h+8});
   const overlap=(r,s)=>r.x<s.x+s.w+3&&r.x+r.w>s.x-3&&r.y<s.y+s.h+3&&r.y+r.h>s.y-3;
   const score=this.narrowScoreRect||(this.plaqueAt&&{x:this.plaqueAt[0],y:this.plaqueAt[1],w:this.plaqueAt[2],h:this.plaqueAt[3]});
   const summary=document.querySelector('#trontAbout > summary'),about=summary?.getBoundingClientRect();
   const obstacles=[t,score,this.challengeAsideRect,...this.hits].filter(Boolean).map(shadow);
   if(about?.width)obstacles.push({x:about.x,y:about.y,w:about.width,h:about.height});
   // Stable board geometry plus a gutter for maximum punch/shake.
   const gx=b.w*.07+4,gy=b.h*.07+4;
   obstacles.push({x:b.x-gx,y:b.y-gy,w:b.w+2*gx,h:b.h+2*gy});
   const right=Math.ceil(b.x+b.w+gx+11),regions=[{x:12,w:Math.floor(b.x-gx-23)},{x:right,w:Math.floor(a.cssWidth-right-12)}];
   for(const region of regions){for(const font of [13,12]){
    const inner=region.w-16,rows=[];let line='',fits=inner>=64;
    for(const word of String(n.message).split(' ')){
     if(this.measure(word,font)>inner){fits=false;break;}
     const next=line?line+' '+word:word;
     if(line&&this.measure(next,font)>inner){rows.push(line);line=word;}else line=next;
    }
    if(line)rows.push(line);
    const step=font+4,rect={x:region.x,y:t.y+t.h+12,w:region.w,h:8+rows.length*step},extent=shadow(rect);
    if(!fits||!rows.length||extent.x<0||extent.y<0||extent.x+extent.w>a.cssWidth||extent.y+extent.h>a.cssHeight||obstacles.some(o=>overlap(extent,o)))continue;
    // This compact card fades in place; sliding would consume its safe gutter.
    this.playNoticeLayout={...rect,font,step,rows,opacity:n.opacity,original:{x:n.x,y:n.y,w:n.w,h:32}};
    this.plaque(rect.x,rect.y,rect.w,rect.h);
    rows.forEach((row,i)=>this.text(row,rect.x+8,rect.y+4+i*step,font,UI_ART.highlight,'left',inner));
    return result;
   }}
   n.original();return result;
  }finally{this.ink.opacity=opacity;}
 }finally{this.pendingPlayNotice=null;}
};
