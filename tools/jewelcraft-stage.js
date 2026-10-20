/* B001: announce a new stage in the cabinet's existing title plate. The jewel
   aperture stays visible throughout travel; no new hit target or input path. */
CabinetUI.prototype.titlePlaque=function(x,y,w,h,brandSize){
 const a=this.app,p=this.ink,o=this.sc,age=o?a.time-o.birth:-1,L=2.6;
 const arrival=o&&age>=0&&age<=L&&!a.expedition?.photo;
 this.titleRect={x,y,w,h};this.stageArrivalRect=arrival?{x,y,w,h}:null;
 this.plaque(x,y,w,h,!!arrival);
 if(!arrival){
  this.text(GAME_BRAND.wordmark,x+w/2,y+(h===40?11:9),brandSize,UI_ART.highlight,'center',w-(h===40?30:34),.12,true);
  return;
 }
 const old=p.opacity,fade=Math.min(1,age/.18)*Math.min(1,(L-age)/.3);
 // No sliding or scaling: the announcement occupies the same frame at every
 // age and remains calm with either reduced-motion preference enabled.
 p.opacity=old*fade;
 try{
  const cx=x+w/2,cy=y+h/2,col=stageHex(o),label='STAGE '+o.n+(o.loop?' / ENCORE':'');
  for(const sx of [-1,1]){
   const px=cx+sx*(w/2-18);
   p.poly([px,cy-7,px+5,cy,px,cy+7,px-5,cy,px,cy-7],1,UI_ART.edge,.9);
   p.line(px,cy-3,px,cy+3,2,col,1);
  }
  if(h<40){
   const compactLabel=(o.loop?'ENCORE ':'STAGE ')+o.n;
   this.text(compactLabel,cx,y+3,9,col,'center',w-64,.1);
   this.text(o.name,cx,y+15,14,UI_ART.highlight,'center',w-64,.12,true);
  }else{
   this.text(label,cx,y+6,9,col,'center',w-64,.1);
   this.text(o.name,cx,y+17,20,UI_ART.highlight,'center',w-64,.12,true);
  }
 }finally{p.opacity=old;}
};
