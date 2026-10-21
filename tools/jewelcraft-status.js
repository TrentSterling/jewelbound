/* B007: compact landscape challenge details use free space beside the board.
   The original values, board, title, controls and input targets are unchanged. */
const jewelcraftStatusHUD=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(){
 this.challengeAsideRect=null;
 return jewelcraftStatusHUD.call(this);
};
CabinetUI.prototype.challengeInlineStatus=function(label,detail,hasGhost,gs){
 const a=this.app,{cx,bw}=this.boardBox(),b=this.boardRect,caption=hasGhost?'ghost '+gs:detail;
 const fallback=()=>this.text(label+' / '+caption,cx,b.y+b.h+9,11,UI_ART.highlight,'center',bw-8,.12,true);
 if(a.cssWidth<420||a.cssWidth<=a.cssHeight||a.cssHeight>=460||a.expedition.run.finished||a.aaCompare)return fallback();
 const w=Math.min(184,Math.floor(b.x-32)),inner=w-24;
 if(w<128)return fallback();
 // Wrap whole words at a fixed 12px cap height instead of shrinking the line.
 const wrap=value=>{const rows=[];let line='';for(const word of String(value).split(' ')){
  if(this.measure(word,12)>inner)return null;
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,12)>inner){rows.push(line);line=word;}else line=next;
 }if(line)rows.push(line);return rows;};
 const title=wrap(label),body=wrap(caption);if(!title||!body)return fallback();
 const h=32+17*(title.length+body.length),rail=Math.min(a.cssHeight,...this.hits.filter(t=>['hint','play','journey','demo','sound','settings','coop-open'].includes(t.id)).map(t=>t.y));
 const top=Math.max((this.titleRect?.y||10)+(this.titleRect?.h||40)+54,b.y+8),bottom=rail-12;
 if(top+h>bottom)return fallback();
 const x=16,y=clamp(b.y+b.h/2-h/2,top,bottom-h);
 this.challengeAsideRect={x,y,w,h};this.plaque(x,y,w,h);
 let yy=y+12;for(const line of title){this.text(line,x+12,yy,12,UI_ART.highlight,'left',inner);yy+=17;}
 this.lineDivider(x+12,yy+1,inner);yy+=8;
 for(const line of body){this.text(line,x+12,yy,12,UI_ART.dim,'left',inner);yy+=17;}
};
