/* B012: finished runs stay readable on narrow landscape screens. Only the
   card's presentation changes; result values and continuation actions do not. */
const jewelcraftResultsBeforeNarrow=CabinetUI.prototype.drawGameOver;
const jewelcraftDecorBeforeNarrow=CabinetUI.prototype.expeditionDecor;
CabinetUI.prototype.expeditionDecor=function(){
 if(!this.narrowResultPlaqueRect)return jewelcraftDecorBeforeNarrow.call(this);
};
CabinetUI.prototype.drawGameOver=function(){
 const a=this.app,e=a.expedition,r=e?.run;
 this.narrowResultPlaqueRect=null;
 const fallback=()=>jewelcraftResultsBeforeNarrow.call(this);
 if(!r?.finished||a.panelOpen||e.photo||a.aaCompare||a.cssWidth<320||a.cssWidth>=480||a.cssWidth<a.cssHeight||a.cssHeight>=460)return fallback();
 const rail=Math.min(a.cssHeight,...this.hits.filter(t=>['hint','play','journey','demo','sound','settings','coop-open'].includes(t.id)).map(t=>t.y));
 const summaryElement=document.querySelector('#trontAbout > summary');
 if(summaryElement?.parentElement.open)return fallback();
 const about=summaryElement?.getBoundingClientRect();
 const top=Math.max(12,about?.width>0&&about?.height>0?about.bottom+6:12),W=a.cssWidth-24,H=Math.min(172,rail-top-12);
 if(H<144)return fallback();
 const x=12,y=clamp(this.boardBox().cy-H/2,top,rail-H-12),pad=12,gap=8,bw=(W-pad*2-gap)/2,by=y+H-52;
 const split=x+W*.40,bodyX=split+12,bodyW=x+W-12-bodyX,bodyY=y+36,font=11,line=17;
 const wrap=(value,size,max)=>{const rows=[];let row='';for(const word of String(value).split(' ')){
  if(this.measure(word,size)>max)return null;
  const next=row?row+' '+word:word;
  if(row&&this.measure(next,size)>max){rows.push(row);row=word;}else row=next;
 }if(row)rows.push(row);return rows;};
 const summary=wrap(r.moves+' moves / '+r.cleared+' gems',font,bodyW),highlight=e.highlights[0];
 const moments=highlight?wrap(highlight.name+(highlight.chain?' x'+highlight.chain:''),font,bodyW):[];
 const reason=String(r.reason),score=(r.score||0).toLocaleString(),scoreW=split-x-18;
 const next=r.mode==='puzzle'&&r.reason==='PUZZLE COMPLETE',actions=[[next?'exp-next-puzzle':'again',next?'Next puzzle':'Play again'],['exp-endless','Return to endless']];
 const labels=actions.map(([,label])=>wrap(label,12,bw-17));
 // Decline before drawing if complete values cannot fit. Ordinary captions
 // use fixed-size text; unusually large values retain the existing renderer.
 if(!summary||!moments||labels.some(rows=>!rows||rows.length>2)||this.measure(reason,14)>W-24||this.measure(score,28)>scoreW*28/11||bodyY+(summary.length+moments.length-1)*line+font+3>by-2)return fallback();
 // Keep contrast outlines and puzzle marks beneath this opaque result card.
 // Fallback layouts keep their original decoration order in drawCursor.
 jewelcraftDecorBeforeNarrow.call(this);
 const p=this.ink;this.resultPlaqueRect=this.narrowResultPlaqueRect={x,y,w:W,h:H};
 p.box(x-6,y-6,W+12,H+12,UI_ART.ink,10,.96);this.plaque(x,y,W,H,true);
 this.text(reason,x+W/2,y+10,14,UI_ART.highlight,'center',W-24,.12,true);
 this.lineDivider(x+pad,y+29,W-pad*2);
 this.text(score,x+(split-x)/2,y+43,28,UI_ART.text,'center',scoreW,.13,true);
 p.line(split,y+38,split,by-8,1,UI_ART.brass,.55);
 let yy=bodyY;for(const row of summary){this.text(row,bodyX,yy,font,UI_ART.dim,'left',bodyW);yy+=line;}
 for(const row of moments){this.text(row,bodyX,yy,font,UI_ART.aqua,'left',bodyW);yy+=line;}
 for(let i=0;i<actions.length;i++){
  const [id,label]=actions[i],rows=labels[i],text=this.text;
  // Let the existing button own hit labels, focus, hover and pressed state.
  // Reflow only its painted label, keeping the complete accessible name.
  this.text=function(value,tx,ty,size,col,align,max,...rest){
   if(value!==label)return text.call(this,value,tx,ty,size,col,align,max,...rest);
   const start=ty-(42-15)/2+(42-(15+(rows.length-1)*16))/2;
   for(let j=0;j<rows.length;j++)text.call(this,rows[j],tx,start+j*16,12,col,align,max,...rest);
  };
  try{this.button(id,label,x+pad+i*(bw+gap),by,bw,42);}finally{this.text=text;}
 }
};
