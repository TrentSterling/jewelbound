/* B008: keep the cabinet title and challenge counter clear of About.
   Move only a colliding title; board framing and input targets stay intact. */
const jewelcraftTitleBeforeAbout=CabinetUI.prototype.titlePlaque;
CabinetUI.prototype.titlePlaque=function(x,y,w,h,brandSize){
 const a=this.app;
 if(a.cssHeight<=640&&!a.expedition?.photo){
  const summary=document.querySelector('#trontAbout > summary');
  if(summary&&!summary.parentElement.open){
   // One read of the stable DOM layout, with no DOM writes in the render loop.
   // Measuring the real control also handles local fonts and viewport changes.
   const r=summary.getBoundingClientRect();
   if(r.width>0&&r.height>0&&x-3<r.right&&x+w+3>r.left&&y<r.bottom&&y+h+8>r.top){
    const right=Math.min(a.cssWidth-12,r.left-12),width=Math.min(w,right-12);
    if(width>=166){w=width;x=Math.max(12,Math.min(x,right-w));}
   }
  }
 }
 return jewelcraftTitleBeforeAbout.call(this,x,y,w,h,brandSize);
};
