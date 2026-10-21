/* B010: use the free right side for the original score and best values. */
const jewelcraftBeforeNarrowScore=CabinetUI.prototype.drawHUD;
CabinetUI.prototype.drawHUD=function(){this.narrowScoreRect=null;return jewelcraftBeforeNarrowScore.call(this);};
CabinetUI.prototype.narrowScorePlaque=function(left,top,right,bottom){
 // Leave a punch/shake gutter outside the stable tray; use smaller internal
 // insets so full values retain the same available text width.
 const a=this.app,w=Math.min(184,Math.floor(a.cssWidth-right-34)),x=a.cssWidth-w-12;
 const y=Math.max(68,Math.min(top+8,a.cssHeight-235)),h=114;
 this.narrowScoreRect={x,y,w,h};this.plaque(x,y,w,h);this.plaqueAt=null;
 this.text(a.coop?.connected?'Team':a.auto?'Demo':a.practice?'Lab score':'Score',x+8,y+10,12,UI_ART.dim,'left',w-16);
 this.scoreAt=[x+w/2,y+41];const sk=1+.16*Math.exp(-(a.time-(this.scoreHit??-9))*11);
 this.text(Math.round(a.displayScore).toLocaleString('en-US'),x+w-8,y+30-22*(sk-1)*.5,22*sk,UI_ART.highlight,'right',w-16,.12,true);
 this.lineDivider(x+8,y+62,w-16);this.text('Best',x+8,y+74,11,UI_ART.muted);
 this.text(a.best.toLocaleString('en-US'),x+w-8,y+91,14,UI_ART.text,'right',w-16);
};
