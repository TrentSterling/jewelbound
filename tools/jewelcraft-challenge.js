/* B002: a readable challenge counter in the existing cabinet title. The
   authoritative run, secondary HUD, stage arrival and input paths stay intact. */
const jewelcraftStageTitle=CabinetUI.prototype.titlePlaque;
// B003: keep the win condition readable after the introductory toast expires.
// These labels describe the existing puzzle goals; they never drive the rules.
const JEWELCRAFT_PUZZLE_GOALS={
 targets:{label:'CLEAR MARKED GEMS',short:['CLEAR','MARKED']},
 blast:{label:'FORGE A BLAST GEM',short:['FORGE','BLAST']},
 prism:{label:'FORGE A PRISM',short:['FORGE','PRISM']},
 chain:{label:'REACH A 5-WAVE CHAIN',short:['5-WAVE','CHAIN']}
};
CabinetUI.prototype.titlePlaque=function(x,y,w,h,brandSize){
 const a=this.app,e=a.expedition,r=e?.run,age=this.sc?a.time-this.sc.birth:-1;
 this.challengePlaqueRect=null;
 if(!r||!['timed','moves','daily','puzzle'].includes(r.mode)||a.practice||a.auto||e.photo||r.finished||(this.sc&&age>=0&&age<=2.6))
  return jewelcraftStageTitle.call(this,x,y,w,h,brandSize);
 const p=this.ink,compact=h<40,narrow=w<250,timed=r.mode==='timed';
 const remaining=Math.max(0,timed?Math.ceil(r.limit-r.elapsed):r.limit-a.board.moves);
 const value=timed?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):String(remaining);
 const goal=r.mode==='puzzle'?JEWELCRAFT_PUZZLE_GOALS[EXPEDITION_PUZZLES[r.puzzle]?.goal]:null;
 const label=timed?(compact?'TIMED':'TWO MINUTES'):r.mode==='daily'?(narrow?'DAILY':'DAILY BOARD'):r.mode==='puzzle'?(goal?.label||'PUZZLE'):narrow?'MOVES':'30 MOVES';
 const col=remaining<=(timed?10:3)?'#f2c477':UI_ART.highlight,left=w-(narrow?112:120),inset=narrow?10:14;
 this.titleRect={x,y,w,h};this.stageArrivalRect=null;this.challengePlaqueRect={x,y,w,h};
 this.plaque(x,y,w,h,true);
 p.line(x+w-101,y+7,x+w-101,y+h-7,1,UI_ART.brass,.7);
 if(!narrow)this.text(GAME_BRAND.wordmark,x+inset,y+(compact?3:5),8,UI_ART.dim,'left',left);
 if(narrow&&goal){
  this.text(goal.short[0],x+inset,y+4,10,UI_ART.highlight,'left',left,.1);
  this.text(goal.short[1],x+inset,y+17,10,UI_ART.highlight,'left',left,.1);
 }else this.text(label,x+inset,y+(narrow?10:compact?14:19),compact?12:14,UI_ART.highlight,'left',left,.1);
 const fraction=clamp(remaining/Math.max(1,r.limit),0,1),barY=y+h-5;
 p.box(x+inset,barY,left,2,UI_ART.brass,0,.35);
 if(fraction>0)p.box(x+inset,barY,left*fraction,2,col,0,.8);
 this.text(timed?'TIME LEFT':'MOVES LEFT',x+w-51,y+(compact?3:5),8,UI_ART.dim,'center',84);
 // Georgia's old-style 3/4/5/7/9 descend below its capitals. Reserve four
 // pixels beyond the nominal cap height so the counter clears the bezel.
 this.text(value,x+w-51,y+(compact?8:13),20,col,'center',84,.12,true);
};
CabinetUI.prototype.challengeStatusLayout=function(){
 const a=this.app,[x,y,w,h]=this.plaqueAt,compact=a.cssHeight<460,yy=y+h+(compact?100:116);
 const controls=Math.min(a.cssHeight,...this.hits.filter(b=>['hint','play','journey','demo','sound','settings','coop-open'].includes(b.id)).map(b=>b.y));
 if(compact&&yy+35>controls){
  const right=this.boardRect.x+this.boardRect.w+24,room=a.cssWidth-right-24;
  // Compact toasts occupy the upper-right side of the board. Keep these
  // persistent details immediately above the bottom control rail instead.
  if(room>=120)return {x:right,y:controls-55,w:room,relocated:true};
 }
 return {x,y:yy,w,relocated:false};
};
