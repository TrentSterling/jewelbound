/* B007/B009: compact landscape challenge details use free space beside the board.
   The original values, board, title, controls and input targets are unchanged. */
const jewelcraftStatusHUD=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(){
 this.challengeAsideRect=null;
 return jewelcraftStatusHUD.call(this);
};
CabinetUI.prototype.challengeInlineStatus=function(label,detail,hasGhost,gs){
 const a=this.app,{cx,bw}=this.boardBox(),b=this.boardRect,caption=hasGhost?'ghost '+gs:detail;
 const fallback=()=>{if(!this.challengeFallbackPlaque(label,caption))this.text(label+' / '+caption,cx,b.y+b.h+9,11,UI_ART.highlight,'center',bw-8,.12,true);};
 if(a.cssWidth<360||a.cssWidth<=a.cssHeight||a.cssHeight>=460||a.expedition.run.finished||a.aaCompare)return fallback();
 const narrow=a.cssWidth<420,font=narrow?11:12,lineHeight=narrow?16:17,pad=narrow?6:12;
 const w=Math.min(narrow?116:184,Math.floor(b.x-(narrow?24:32))),inner=w-pad*2;
 if(w<(narrow?88:128))return fallback();
 // Narrow phone landscapes use a smaller inset, not auto-shrunk text.
 // Keep whole words and complete values; decline the plaque if they cannot fit.
 const wrap=value=>{const rows=[];let line='';for(const word of String(value).split(' ')){
  if(this.measure(word,font)>inner)return null;
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,font)>inner){rows.push(line);line=word;}else line=next;
 }if(line)rows.push(line);return rows;};
 const title=wrap(label),body=wrap(caption);if(!title||!body)return fallback();
 const h=(narrow?22:32)+lineHeight*(title.length+body.length),rail=Math.min(a.cssHeight,...this.hits.filter(t=>['hint','play','journey','demo','sound','settings','coop-open'].includes(t.id)).map(t=>t.y));
 const top=Math.max((this.titleRect?.y||10)+(this.titleRect?.h||40)+54,b.y+8),bottom=rail-12;
 if(top+h>bottom)return fallback();
 const x=narrow?12:16,y=clamp(b.y+b.h/2-h/2,top,bottom-h);
 this.challengeAsideRect={x,y,w,h};this.plaque(x,y,w,h);
 let yy=y+(narrow?10:12);for(const line of title){this.text(line,x+pad,yy,font,UI_ART.highlight,'left',inner);yy+=lineHeight;}
 this.lineDivider(x+pad,yy+1,inner);yy+=narrow?6:8;
 for(const line of body){this.text(line,x+pad,yy,font,UI_ART.dim,'left',inner);yy+=lineHeight;}
};

/* B011: narrow-fit screens can have room for details but not the long mode
   heading. Keep the full caption beside the tray at a fixed, readable size.
   The title already carries the goal and authoritative remaining count. */
CabinetUI.prototype.challengeFallbackPlaque=function(label,caption){
 const a=this.app,r=a.expedition.run,b=this.boardRect;
 if(!this.narrowScoreRect||!cabinetFraming(a.cssWidth,a.cssHeight).narrowFit||r.finished||a.aaCompare||a.expedition.photo||a.panelOpen||a.practice||a.auto)return false;
 const names={moves:'Moves',timed:'Timed',daily:'Daily',puzzle:'Puzzle'},heading=names[r.mode];
 if(!heading)return false;
 // Reserve a tray-size-dependent gutter for maximum punch/shake, plus the
 // plaque's 3px shadow and a clear gap. Stable boardRect alone is insufficient.
 const x=12,w=Math.min(116,Math.floor(b.x-18-b.w*.07)),pad=6,font=11,lineHeight=16,inner=w-pad*2;
 if(inner<60)return false;
 const wrap=value=>{const rows=[];let line='';for(const word of String(value).split(' ')){
  if(this.measure(word,font)>inner)return null;
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,font)>inner){rows.push(line);line=word;}else line=next;
 }if(line)rows.push(line);return rows;};
 const body=wrap(caption);if(!body||this.measure(heading,font)>inner)return false;
 const top=Math.max((this.titleRect?.y||10)+(this.titleRect?.h||40)+16,b.y+8);
 const rail=Math.min(a.cssHeight,...this.hits.filter(t=>['hint','play','journey','demo','sound','settings','coop-open'].includes(t.id)).map(t=>t.y));
 const h=28+lineHeight*(1+body.length),bottom=rail-12;
 if(top+h>bottom)return false;
 const y=clamp(b.y+b.h/2-h/2,top,bottom-h);
 this.challengeAsideRect={x,y,w,h,compactDetail:true};this.plaque(x,y,w,h);
 this.text(heading,x+pad,y+10,font,UI_ART.highlight,'left',inner);
 this.lineDivider(x+pad,y+28,inner);
 let yy=y+36;for(const line of body){this.text(line,x+pad,yy,font,UI_ART.dim,'left',inner);yy+=lineHeight;}
 return true;
};
