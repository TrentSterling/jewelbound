/* B018: keep fitting portrait challenge notices clear of the goal and About.
   Reuse the reserved footer for the toast's original lifetime and opacity. */
const jewelcraftBeforePortraitNotice=CabinetUI.prototype.playNotice;
CabinetUI.prototype.playNotice=function(text,x,y,w){
 const original=()=>jewelcraftBeforePortraitNotice.call(this,text,x,y,w),a=this.app,r=a.expedition?.run,f=cabinetFraming(a.cssWidth,a.cssHeight),t=this.titleRect;
 const about=document.querySelector('#trontAbout'),summary=about?.querySelector('summary'),ab=summary?.getBoundingClientRect();
 if(!f.portraitFooter||!t||!r||!['timed','moves','daily','puzzle'].includes(r.mode)||r.finished||a.panelOpen||a.expedition?.photo||a.aaCompare||a.practice||a.auto||about?.open)return original();
 const overlaps=q=>q&&x-3<q.x+q.w&&x+w+3>q.x&&y<q.y+q.h&&y+40>q.y;
 if(!overlaps(t)&&!overlaps(ab&&{x:ab.x,y:ab.y,w:ab.width,h:ab.height}))return original();
 const message=String(this.toastMessage),font=11,step=15,inner=a.cssWidth-32,rows=[];let line='';
 for(const word of message.split(' ')){
  if(this.measure(word,font)>inner)return original();
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,font)>inner){rows.push(line);line=word;}else line=next;
 }
 if(line)rows.push(line);
 const top=this.boardRect.y+this.boardRect.h+f.portraitFooter.gap;
 if(!rows.length||rows.length>2||top+(rows.length-1)*step+font+5>f.portraitFooter.rail-3)return original();
 this.portraitNoticeLayout={message,rows,font,step,x:16,y:top,w:inner,opacity:this.ink.opacity,original:{text,x,y,w}};
 rows.forEach((row,i)=>this.text(row,a.cssWidth/2,top+i*step,font,UI_ART.highlight,'center',inner,.12,true));
};
const jewelcraftBeforePortraitNoticeHUD=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(...args){this.portraitNoticeLayout=null;return jewelcraftBeforePortraitNoticeHUD.apply(this,args);};
const jewelcraftBeforePortraitNoticeCaption=CabinetUI.prototype.challengeInlineStatus;
CabinetUI.prototype.challengeInlineStatus=function(...args){if(!this.portraitNoticeLayout)return jewelcraftBeforePortraitNoticeCaption.apply(this,args);};
