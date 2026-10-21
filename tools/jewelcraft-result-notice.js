/* B021: a fitting, complete notice uses the result card's empty text gap
   when About covers the original toast on a short portrait screen. */
CabinetUI.prototype.resultNoticeInk=function(t,size,max){
 const family=size>=20||this.clean(t)===GAME_BRAND.wordmark?'display':'body',font=this.ink.fonts[family];
 const width=this.measure(t,size),effective=size*Math.min(1,max/width);
 if(family==='body'){const bounds=this.toggleLabelBounds(t,effective);return bounds?{...bounds,size:effective}:null;}
 if(!font.resultNoticeBounds){
  const ctx=this.ink.glyphCanvas.getContext('2d'),old=ctx.font,bounds={};
  try{
   ctx.font='400 64px Georgia, "Times New Roman", serif';
   for(const ch of Object.keys(font.glyphs)){
    const m=ctx.measureText(ch);
    if(!Number.isFinite(m.actualBoundingBoxAscent)||!Number.isFinite(m.actualBoundingBoxDescent))return null;
    bounds[ch]={ascent:m.actualBoundingBoxAscent/font.cap,descent:m.actualBoundingBoxDescent/font.cap};
   }
  }finally{ctx.font=old;}
  font.resultNoticeBounds=bounds;
 }
 let ascent=0,descent=0;
 for(const ch of this.clean(t)){
  const b=font.resultNoticeBounds[ch]||font.resultNoticeBounds['?'];if(!b)return null;
  ascent=Math.max(ascent,b.ascent*effective);descent=Math.max(descent,b.descent*effective);
 }
 return {ascent,descent,size:effective};
};
const jewelcraftBeforeResultNotice=CabinetUI.prototype.playNotice;
CabinetUI.prototype.playNotice=function(text,x,y,w){
 const original=()=>jewelcraftBeforeResultNotice.call(this,text,x,y,w),a=this.app,r=a.expedition?.run;
 const about=document.querySelector('#trontAbout'),ab=about?.querySelector('summary')?.getBoundingClientRect();
 if(!r?.finished||a.cssWidth<280||a.cssWidth>=480||a.cssWidth>=a.cssHeight||a.cssHeight<460||a.cssHeight>=640||a.panelOpen||a.expedition?.photo||a.aaCompare||a.practice||a.auto||about?.open||!ab)return original();
 if(!(x-3<ab.right&&x+w+3>ab.left&&y<ab.bottom&&y+40>ab.top))return original();
 const {cx,cy,bw}=this.boardBox(),W=bw*.91,H=Math.min(440,Math.max(330,bw*.84)),top=cy-H/2,max=W-24;
 const reason=this.resultNoticeInk(r.reason,Math.min(27,bw*.067),max),score=this.resultNoticeInk((r.score||0).toLocaleString(),Math.min(60,bw*.14),max);
 if(!reason||!score)return original();
 const band={top:top+25+reason.size+reason.descent+1+3,bottom:top+76+score.size-score.ascent-3};
 const message=String(this.toastMessage),font=11,rows=[];let line='';
 for(const word of message.split(' ')){
  if(this.measure(word,font)>max)return original();
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,font)>max){rows.push(line);line=word;}else line=next;
 }
 if(line)rows.push(line);
 if(!rows.length||rows.length>2)return original();
 const bounds=rows.map(row=>this.toggleLabelBounds(row,font));if(bounds.some(b=>!b))return original();
 const gap=2,height=bounds.reduce((sum,b)=>sum+b.ascent+b.descent,0)+(rows.length-1)*gap;
 if(!Number.isFinite(band.top)||!Number.isFinite(band.bottom)||height>band.bottom-band.top)return original();
 let inkTop=band.top+(band.bottom-band.top-height)/2;
 const ys=bounds.map(b=>{const at=inkTop+b.ascent-font;inkTop+=b.ascent+b.descent+gap;return at;});
 const rect={x:cx-max/2,y:ys[0]+font-bounds[0].ascent,w:max,h:height};
 const overlaps=q=>rect.x<q.x+q.w&&rect.x+rect.w>q.x&&rect.y<q.y+q.h&&rect.y+rect.h>q.y;
 if(rect.x<0||rect.x+rect.w>a.cssWidth||rect.y<0||rect.y+rect.h>a.cssHeight||overlaps({x:ab.x,y:ab.y,w:ab.width,h:ab.height})||this.hits.some(overlaps))return original();
 this.resultNoticeLayout={message,rows,font,ys,bounds,gap,max,cx,band,opacity:this.ink.opacity,result:{x:cx-W/2,y:top,w:W,h:H},original:{text,x,y,w}};
 this.pendingResultNotice={run:r,layout:this.resultNoticeLayout};
};
const jewelcraftBeforeResultNoticeHUD=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(...args){this.resultNoticeLayout=null;this.pendingResultNotice=null;return jewelcraftBeforeResultNoticeHUD.apply(this,args);};
const jewelcraftBeforeResultNoticeGameOver=CabinetUI.prototype.drawGameOver;
CabinetUI.prototype.drawGameOver=function(...args){
 const pending=this.pendingResultNotice;this.pendingResultNotice=null;
 const result=jewelcraftBeforeResultNoticeGameOver.apply(this,args);
 if(pending&&pending.run===this.app.expedition?.run&&pending.run.finished&&!this.app.panelOpen){
  const l=pending.layout,opacity=this.ink.opacity;
  try{this.ink.opacity=l.opacity;l.rows.forEach((row,i)=>this.text(row,l.cx,l.ys[i],l.font,UI_ART.highlight,'center',l.max));}finally{this.ink.opacity=opacity;}
 }
 return result;
};
