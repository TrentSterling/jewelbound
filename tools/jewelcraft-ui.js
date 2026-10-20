/* Jewelcraft presentation only. Existing layout, hit targets, focus, scrolling,
   gamepad navigation and accessibility text remain owned by CabinetUI. */
Object.assign(UI_ART,{brass:'#746044',edge:'#cbb789',highlight:'#f5e8c9',ink:'#0e0e1a',enamel:'#1a1928',text:'#eee9df',dim:'#b9b4c8',aqua:'#c3b0ee',muted:'#aaa3b6'});

// One local glyph atlas, built synchronously from installed system fonts. It is
// sampled in the existing GPU UI pass, so photo exports include the full UI.
// No external font request, dependency, DOM overlay, or per-frame canvas work.
UIInk.prototype.prepareTypography=function(){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1344;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.textBaseline='alphabetic';
 this.glyphCanvas=canvas;this.fonts={};
 for(const [family,font] of [['body','500 64px "Segoe UI", Arial, sans-serif'],['display','400 64px Georgia, "Times New Roman", serif']]){
  ctx.font=font;const cap=ctx.measureText('H').actualBoundingBoxAscent||46,glyphs={};
  for(let code=32;code<128;code++){
   const slot=code-32+(family==='display'?96:0),x=slot%16*96,y=Math.floor(slot/16)*112,ch=String.fromCharCode(code);
   ctx.fillText(ch,x+12,y+80);
   glyphs[ch]={advance:ctx.measureText(ch).width/cap,uv:[x/1536,y/1344,96/1536,112/1344]};
  }
  this.fonts[family]={cap,glyphs};
 }
};
UIInk.prototype.glyph=function(ch,x,y,h,col,family){
 const font=this.fonts[family],glyph=font.glyphs[ch]||font.glyphs['?'],s=h/font.cap,w=96*s,H=112*s;
 if(this.count>=this.capacity)throw Error('UI glyph budget exceeded');
 this.data.set([x-12*s+w/2,y+h-80*s+H/2,w/2,H/2,...this.rgba(col,1),2,0,1,0,...glyph.uv],this.count*16);this.count++;
 return (glyph.advance+.035)*h;
};
CabinetUI.prototype.measure=function(t,h){
 const font=this.ink.fonts[h>=20||this.clean(t)===GAME_BRAND.wordmark?'display':'body'];let w=0;
 for(const ch of this.clean(t))w+=((font.glyphs[ch]||font.glyphs['?']).advance+.035)*h;
 return Math.max(0,w-.035*h);
};
CabinetUI.prototype.text=function(t,x,y,h=15,col=UI_ART.text,align='left',max=Infinity,weight=.1,shadow=false){
 t=this.clean(t);const family=h>=20||t===GAME_BRAND.wordmark?'display':'body';let width=this.measure(t,h);
 if(width>max){h*=max/width;width=max;}
 if(align==='center')x-=width/2;else if(align==='right')x-=width;
 const render=(dx,dy,c)=>{let at=x+dx;for(const ch of t){
  at+=this.ink.glyph(ch,at,y+dy,h,c,family);
 }};
 if(shadow)render(0,1,'#020207');render(0,0,col);return width;
};
CabinetUI.prototype.plaque=function(x,y,w,h,active=false){
 const p=this.ink,cut=h>70?12:5;
 p.box(x-3,y+5,w+6,h+3,'#020207',cut+2,.72);
 p.box(x,y,w,h,active?'#ad966c':'#746044',cut,1,.16,.04);
 p.box(x+1,y+1,w-2,h-2,active?'#171421':'#11111d',cut-1,1,.05,.02);
 p.box(x+4,y+4,w-8,h-8,'#0e0e19',Math.max(2,cut-3),1,.05,.015);
 p.line(x+14,y+1.5,x+w-14,y+1.5,1,'#e3cca0',.45);
 if(h>70){
  for(const sx of [-1,1])for(const sy of [-1,1]){
   const cx=sx<0?x+10:x+w-10,cy=sy<0?y+10:y+h-10;
   p.poly([cx,cy+sy*5,cx+sx*5,cy,cx,cy-sy*5,cx-sx*5,cy,cx,cy+sy*5],.75,UI_ART.brass,.65);
  }
  p.line(x+13,y+h-6,x+w-13,y+h-6,.8,'#584a3a',.45);
 }
};
CabinetUI.prototype.button=function(id,label,x,y,w,h=42,on=false){
 const p=this.ink,hot=this.hover===id||this.focus===id,pressed=this.pointer?.id===id,py=y+(pressed?1:0),primary=id==='play';
 p.box(x,y+3,w,h,'#03030a',4,.85);
 p.box(x,py,w,h,hot?'#e5cfa2':on||primary?'#a88d60':'#63543f',4,1,.13,.02);
 p.box(x+1,py+1,w-2,h-2,pressed?'#292235':on?'#322a40':primary?'#3d3025':hot?'#252134':'#191824',3,1,.12,.04);
 p.line(x+7,py+2,x+w-7,py+2,.75,hot?'#e9d9b3':'#8c7962',.55);
 if(on){p.line(x+12,py+h-4,x+w-12,py+h-4,1,UI_ART.aqua,.85);}
 this.text(label,x+w/2,py+(h-15)/2,15,hot?UI_ART.highlight:UI_ART.text,'center',w-17,.09,true);
 if(this.focus===id){p.box(x+4,py+5,2,h-10,UI_ART.highlight,0);p.box(x+w-6,py+5,2,h-10,UI_ART.highlight,0);}
 this.hit(id,x,y,w,h,'button',null,label);
};
CabinetUI.prototype.lineDivider=function(x,y,w){
 this.ink.line(x,y,x+w,y,.8,'#8a7356',.42);
};
// Fade the new modal surface without moving controls or delaying interaction.
const jewelcraftOpenPanel=JewelApp.prototype.openPanel;
JewelApp.prototype.openPanel=function(...args){this.jewelcraftPanelAt=this.time;return jewelcraftOpenPanel.apply(this,args);};
const jewelcraftPanel=CabinetUI.prototype.drawPanel;
CabinetUI.prototype.drawPanel=function(){
 const p=this.ink,old=p.opacity,a=this.app;
 const reduce=!a.prefs.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 p.opacity=reduce?1:.72+.28*smooth(clamp((a.time-(a.jewelcraftPanelAt??a.time))/.18));
 try{return jewelcraftPanel.call(this);}finally{p.opacity=old;}
};
// Retain every approved recording byte. Branded welcome recordings belong to
// Gems Together; Jewelbound simply omits those two lines rather than revoicing.
const jewelcraftSpeech=GemsAnnouncer.prototype.request;
GemsAnnouncer.prototype.request=function(key,...args){
 if(key==='welcome'||key==='welcome-back')return false;
 return jewelcraftSpeech.call(this,key,...args);
};

// Each existing journey stage has its own cut-crystal sculpture. Selection,
// unlocks, stage timing, instance placement and reduced-motion behavior stay in
// GemsExpedition; only the six source meshes are replaced.
GemsExpedition.prototype.buildProps=function(){
 const meshes=[];
 for(let form=0;form<6;form++){
  const g=new Geo(),c=color(['#bfa078','#57a6bf','#c67446','#9a75cd','#a5bde8','#ca7ea9'][form]),gold=color('#a99065');
  const crystal=(type,p,s,rot=0)=>g.append(tintGeo(gemGeometry(type,7),c),trs(p,[.08,.18,rot],s));
  const seal=(r,z)=>g.tube([[0,r,z],[r*.65,0,z],[0,-r,z],[-r*.65,0,z],[0,r,z]],.012,gold,1,5);
  if(form===0){crystal(5,[0,0,0],[.55,1.15,.5]);seal(.88,.04);}
  if(form===1){for(let k=0;k<3;k++)crystal(3,[(k-1)*.36,-Math.abs(k-1)*.28,0],[.36,.95,.36],(k-1)*-.12);seal(1.1,-.08);}
  if(form===2){for(let k=0;k<5;k++){const t=(k-2)*.34;crystal(4,[Math.sin(t)*.55,Math.cos(t)*.2,0],[.36,.85,.35],-t);}g.tube([[-.75,-.4,.05],[0,-.65,.05],[.75,-.4,.05]],.02,gold,1,5);}
  if(form===3){seal(1.2,-.12);crystal(3,[0,0,0],[.55,1.35,.5]);for(let s of [-1,1])crystal(5,[s*.6,0,0],[.22,.4,.22]);}
  if(form===4){for(let k=0;k<4;k++){const t=k*PI/2;crystal(5,[Math.sin(t)*.35,Math.cos(t)*.35,0],[.25,.7,.25],-t);}seal(1.0,-.08);}
  if(form===5){crystal(5,[0,0,0],[.75,1.1,.6]);seal(1.15,-.08);for(let s of [-1,1])g.tube([[s*.48,-.8,0],[s*.9,0,0],[s*.48,.8,0]],.014,gold,1,5);}
  meshes.push(this.a.renderer.createMesh(g.data(),8));
 }
 return {meshes,active:0};
};
