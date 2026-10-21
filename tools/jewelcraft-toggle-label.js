/* B019: wrap colliding settings labels within their original toggle row.
   The button, hit target, value, scroll extent and action remain unchanged. */
const jewelcraftBeforeToggleLabel=CabinetUI.prototype.toggle;
CabinetUI.prototype.toggleLabelBounds=function(row,size){
 const font=this.ink.fonts.body;
 if(!font.toggleBounds){
  const ctx=this.ink.glyphCanvas.getContext('2d'),old=ctx.font,bounds={};
  try{
   ctx.font='500 64px "Segoe UI", Arial, sans-serif';
   for(const ch of Object.keys(font.glyphs)){
    const m=ctx.measureText(ch);
    if(!Number.isFinite(m.actualBoundingBoxAscent)||!Number.isFinite(m.actualBoundingBoxDescent))return null;
    bounds[ch]={ascent:m.actualBoundingBoxAscent/font.cap,descent:m.actualBoundingBoxDescent/font.cap};
   }
  }finally{ctx.font=old;}
  // Cache once per atlas. No canvas work is needed on subsequent frames.
  font.toggleBounds=bounds;
 }
 let ascent=0,descent=0;
 for(const ch of this.clean(row)){
  const b=font.toggleBounds[ch]||font.toggleBounds['?'];
  if(!b)return null;
  ascent=Math.max(ascent,b.ascent*size);descent=Math.max(descent,b.descent*size);
 }
 return {ascent,descent};
};
CabinetUI.prototype.toggle=function(id,label,value,x,y,w){
 const original=()=>jewelcraftBeforeToggleLabel.call(this,id,label,value,x,y,w),font=15,max=w-74-10;
 if(!this.app.panelOpen||max<=0||this.measure(label,font)<=max)return original();
 const rows=[];let line='';
 for(const word of String(label).split(' ')){
  if(this.measure(word,font)>max)return original();
  const next=line?line+' '+word:word;
  if(line&&this.measure(next,font)>max){rows.push(line);line=word;}else line=next;
 }
 if(line)rows.push(line);
 if(rows.length!==2)return original();
 const bounds=rows.map(row=>this.toggleLabelBounds(row,font));
 if(bounds.some(b=>!b))return original();
 // Actual atlas ink bounds include dotted ascenders and lowercase descenders.
 const gap=3,height=bounds.reduce((sum,b)=>sum+b.ascent+b.descent,0)+gap;
 if(height>39)return original();
 let top=y+(39-height)/2;
 const ys=bounds.map(b=>{const at=top+b.ascent-font;top+=b.ascent+b.descent+gap;return at;});
 (this.toggleLabelLayouts??=[]).push({id,label,rows,font,ys,bounds,gap,x,max,button:{x:x+w-74,y,w:74,h:39}});
 rows.forEach((row,i)=>this.text(row,x,ys[i],font,UI_ART.text,'left',max));
 return this.button(id,value?'On':'Off',x+w-74,y,74,39,value);
};
const jewelcraftBeforeToggleLabelPanel=CabinetUI.prototype.drawPanel;
CabinetUI.prototype.drawPanel=function(...args){this.toggleLabelLayouts=[];return jewelcraftBeforeToggleLabelPanel.apply(this,args);};
