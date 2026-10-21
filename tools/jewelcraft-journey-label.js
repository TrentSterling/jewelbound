/* B020: readable stage names in narrow Journey rows. Keep the 64px row,
   selection action and button size; use the unused space above the button. */
const jewelcraftBeforeJourneyLabel=CabinetUI.prototype.expeditionPanel;
CabinetUI.prototype.expeditionPanel=function(...args){
 this.journeyLabelLayouts=[];
 if(!this.app.panelOpen||this.tab!=='journey')return jewelcraftBeforeJourneyLabel.apply(this,args);
 const m=this.panelLayout(),x=m.body.x+6,w=m.body.w-19,e=this.app.expedition;
 const text=this.text,button=this.button,layouts=new Map();
 this.text=function(t,tx,ty,font,col,align,max,...rest){
  const k=FX_STAGES.findIndex((s,i)=>t===(i+1)+'  '+s.name);
  if(k>=0&&tx===x+39&&font===14&&max===w-154&&this.measure(t,font)>max){
   const full=w-39,chosen=[14,13,12].find(size=>this.measure(t,size)<=full),unlocked=e.profile.visited.includes(k);
   if(chosen){
    const y=ty-6,bounds=this.toggleLabelBounds(t,chosen),top=unlocked&&bounds?y+1+bounds.ascent-chosen:ty;
    if(bounds&&top+chosen-bounds.ascent>=y&&top+chosen+bounds.descent<=y+(unlocked?16:26)){
     const layout={k,label:t,x:tx,y,font:chosen,max:full,unlocked,titleY:top,buttonY:y+19};
     layouts.set(k,layout);this.journeyLabelLayouts.push(layout);
     return text.call(this,t,tx,top,chosen,col,align,full,...rest);
    }
   }
  }
  // Locked rows have no button, so their status can use the complete text column.
  for(const row of layouts.values())if(!row.unlocked&&tx===row.x&&Math.abs(ty-row.y-29)<1e-7&&font===11&&t==='Keep travelling')max=w-39;
  return text.call(this,t,tx,ty,font,col,align,max,...rest);
 };
 this.button=function(id,label,bx,by,bw,bh,...rest){
  const row=layouts.get(Number(String(id).replace('exp-stage-','')));
  if(row?.unlocked&&id==='exp-stage-'+row.k&&bx===x+w-108&&Math.abs(by-row.y)<1e-7&&bw===108&&bh===42)by=row.buttonY;
  return button.call(this,id,label,bx,by,bw,bh,...rest);
 };
 try{return jewelcraftBeforeJourneyLabel.apply(this,args);}finally{this.text=text;this.button=button;}
};
