/* B017: reserve a readable challenge row only where compact portrait trays
   crowd the controls. Camera, picking and stable HUD use the same framing. */
const jewelcraftBeforeFooterFraming=cabinetFraming;
let jewelcraftFooterFrameCache;
cabinetFraming=function(w,h){
 if(jewelcraftFooterFrameCache?.w===w&&jewelcraftFooterFrameCache.h===h)return jewelcraftFooterFrameCache.value;
 const original=jewelcraftBeforeFooterFraming(w,h);let value=original;
 if(!original.wide&&w<600&&w<=h&&h>=460){
  const y=original.targetY||0,tan=Math.tan(21*PI/180),m=matMul(perspective(42*PI/180,w/h,.1,150),lookAt([0,.62+y,original.distance],[0,y,0],[0,1,0]));
  const originalBottom=project([3.98,-4.1,.15],m,w,h)[1],rail=Math.min(h-105,originalBottom+28);
  if(rail-originalBottom<26){
   const top=105,gap=Math.ceil(Math.max(16,(rail-top)*.08)),bottom=rail-gap-32,span=bottom-top;
   const distance=Math.max(original.distance,4.23*h/(tan*span)),targetY=((top+bottom)/2-h/2)*2*tan*distance/h;
   value={...original,distance,targetY,portraitFooter:{originalBottom,rail,gap}};
  }
 }
 jewelcraftFooterFrameCache={w,h,value};return value;
};
const jewelcraftBeforeFooterRail=CabinetUI.prototype.coopRail;
CabinetUI.prototype.coopRail=function(bottom){
 const a=this.app,f=cabinetFraming(a.cssWidth,a.cssHeight);
 return jewelcraftBeforeFooterRail.call(this,f.portraitFooter?.originalBottom??bottom);
};
const jewelcraftBeforeFooterHUD=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(...args){this.challengeFooterLayout=null;return jewelcraftBeforeFooterHUD.apply(this,args);};
const jewelcraftBeforeFooterStatus=CabinetUI.prototype.challengeInlineStatus;
CabinetUI.prototype.challengeInlineStatus=function(label,detail,hasGhost,gs){
 const a=this.app,f=cabinetFraming(a.cssWidth,a.cssHeight),fallback=()=>jewelcraftBeforeFooterStatus.call(this,label,detail,hasGhost,gs);
 if(!f.portraitFooter)return fallback();
 const message=label+' / '+(hasGhost?'ghost '+gs:detail),font=11,step=15,inner=a.cssWidth-32,rows=[];let line='';
 for(const word of message.split(' ')){
  if(this.measure(word,font)>inner)return fallback();
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,font)>inner){rows.push(line);line=word;}else line=next;
 }
 if(line)rows.push(line);
 const y=this.boardRect.y+this.boardRect.h+f.portraitFooter.gap;
 if(rows.length>2||!rows.length||y+(rows.length-1)*step+font+3>f.portraitFooter.rail-3)return fallback();
 this.challengeFooterLayout={message,rows,font,step,x:16,y,w:inner};
 rows.forEach((row,i)=>this.text(row,a.cssWidth/2,y+i*step,font,UI_ART.highlight,'center',inner,.12,true));
};
