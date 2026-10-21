/* B006: finished challenges fit short landscape screens. Rendering only;
   results, persistence, action IDs and their authority remain unchanged. */
const jewelcraftOriginalGameOver=CabinetUI.prototype.drawGameOver;
CabinetUI.prototype.drawGameOver=function(){
 const a=this.app,e=a.expedition,r=e?.run;
 this.resultPlaqueRect=null;
 if(!r?.finished||a.panelOpen||a.cssWidth<480||a.cssWidth<=a.cssHeight||a.cssHeight<180||a.cssHeight>=460)
  return jewelcraftOriginalGameOver.call(this);
 // Keep the complete result surface above the existing HUD hit targets.
 // Narrow screens also reserve the top corner occupied by About.
 const rail=Math.min(a.cssHeight,...this.hits.filter(b=>['hint','play','journey','demo','sound','settings','coop-open'].includes(b.id)).map(b=>b.y));
 const top=a.cssWidth<840?56:12,H=Math.min(220,rail-top-12);
 if(H<144)return jewelcraftOriginalGameOver.call(this);
 const p=this.ink,W=Math.min(560,a.cssWidth-32);
 const x=(a.cssWidth-W)/2,y=clamp(this.boardBox().cy-H/2,top,rail-H-12);
 const short=H<190,header=short?36:50,left=x+W*.27,split=x+W*.54;
 const scoreY=y+header+(short?8:15),buttonY=y+header+(H-header-94)/2;
 this.resultPlaqueRect={x,y,w:W,h:H};
 p.box(x-6,y-6,W+12,H+12,UI_ART.ink,10,.96);
 this.plaque(x,y,W,H,true);
 this.text(r.reason,x+W/2,y+12,short?16:20,UI_ART.highlight,'center',W-40,.12,true);
 this.lineDivider(x+18,y+header,W-36);
 p.line(split,y+header+14,split,y+H-16,1,UI_ART.brass,.55);
 this.text((r.score||0).toLocaleString(),left,scoreY,short?32:48,UI_ART.text,'center',W*.54-36,.13,true);
 this.text(r.moves+' moves / '+r.cleared+' gems',left,scoreY+(short?43:65),12,UI_ART.dim,'center',W*.54-36);
 if(e.highlights[0])this.text(e.highlights[0].name+(e.highlights[0].chain?' x'+e.highlights[0].chain:''),left,scoreY+(short?66:94),12,UI_ART.aqua,'center',W*.54-36);
 const next=r.mode==='puzzle'&&r.reason==='PUZZLE COMPLETE',bx=split+18,bw=x+W-bx-18;
 this.button(next?'exp-next-puzzle':'again',next?'Next puzzle':'Play again',bx,buttonY,bw,42);
 this.button('exp-endless','Return to endless',bx,buttonY+52,bw,42);
};
