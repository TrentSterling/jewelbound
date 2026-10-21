/* B014: keep menu return controls clear of the real About launcher. Only the
   colliding header is reflowed; body, tabs, scrolling and actions stay intact. */
const jewelcraftPanelBeforeReturn=CabinetUI.prototype.drawPanel;
CabinetUI.prototype.drawPanel=function(...args){
 this.menuReturnClearance=null;
 const a=this.app,m=this.panelLayout(),summary=document.querySelector('#trontAbout > summary');
 if(!a.panelOpen||a.expedition?.photo||!summary||summary.parentElement.open)return jewelcraftPanelBeforeReturn.apply(this,args);
 const r=summary.getBoundingClientRect(),original={x:m.x+m.w-94,y:m.y+12,w:76,h:37};
 if(r.width<=0||r.height<=0||original.x>=r.right||original.x+76<=r.left||original.y>=r.bottom||original.y+40<=r.top)return jewelcraftPanelBeforeReturn.apply(this,args);
 const x=r.left-6-76;
 if(x<m.x+18)return jewelcraftPanelBeforeReturn.apply(this,args);
 const layout=this.menuReturnClearance={original,back:{...original,x},about:{x:r.left,y:r.top,w:r.width,h:r.height},header:null};
 const text=this.text,button=this.button;let headingPending=true;
 this.text=function(t,tx,ty,h,col,align,max,...rest){
  if(headingPending&&align==='left'&&tx>=m.x+20&&tx<=m.x+23&&ty>=m.y+20&&ty<=m.y+25){
   headingPending=false;const available=x-6-tx;
   if(this.measure(t,h)<=available){layout.header={rows:[t],x:tx,y:ty,font:h,max:available};return text.call(this,t,tx,ty,h,col,align,available,...rest);}
   const left=m.x+12,width=x-6-left;
   for(const font of [20,18,16,14,12]){
    const rows=[];let line='',fit=true;
    for(const word of String(t).split(' ')){
     if(this.measure(word,font)>width){fit=false;break;}
     const next=line?line+' '+word:word;
     if(line&&this.measure(next,font)>width){rows.push(line);line=word;}else line=next;
    }
    if(line)rows.push(line);const step=Math.ceil(font*1.35)+1,total=(rows.length-1)*step+font*1.3,y=original.y+(37-total)/2;
    if(!fit||rows.length>2||y<m.y+6||y+total>m.y+55)continue;
    layout.header={rows,x:left,y,font,max:width,step};let result;
    rows.forEach((row,i)=>{result=text.call(this,row,left,y+i*step,font,col,'left',width,...rest);});return result;
   }
   // Keep the complete heading and an operable return button at extreme sizes.
   layout.header={rows:[t],x:left,y:ty,font:h,max:width,fittedFallback:true};return text.call(this,t,left,ty,h,col,align,width,...rest);
  }
  return text.call(this,t,tx,ty,h,col,align,max,...rest);
 };
 this.button=function(id,label,bx,by,w,h,...rest){
  if((id==='close'||id==='announcer-back')&&bx===original.x&&by===original.y&&w===76&&h===37)bx=x;
  return button.call(this,id,label,bx,by,w,h,...rest);
 };
 try{return jewelcraftPanelBeforeReturn.apply(this,args);}finally{this.text=text;this.button=button;}
};
