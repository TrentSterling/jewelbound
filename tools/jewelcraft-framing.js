/* B005/B010: fit the playable tray between the header and compact control rail.
   The real camera, its picking rays and the stable HUD share this framing. */
const jewelcraftOriginalFraming=cabinetFraming;
let jewelcraftFramingCache;
cabinetFraming=function(w,h){
 if(jewelcraftFramingCache?.w===w&&jewelcraftFramingCache.h===h)return jewelcraftFramingCache.value;
 const original=jewelcraftOriginalFraming(w,h);let value=original;
 if(original.wide&&h<460&&h>=180){
  // Reserve the existing 34px title at y5, then a small clear gutter above
  // the existing 42px controls at h-57. Keep control sizes and input semantics.
  const top=44,bottom=h-69,span=Math.max(64,bottom-top),tan=Math.tan(21*PI/180);
  // Include the tray rim and the existing maximum 5.4% cascade camera punch.
  const distance=Math.max(original.distance,4.55*h/(tan*span));
  const targetY=((top+bottom)/2-h/2)*2*tan*distance/h;
  value={...original,distance,targetY};
 }else if(!original.wide&&w<600&&w>h&&h>=320&&h<460){
  // Two control rows need 105px. Move the score into the free right side,
  // retaining tray size. The floating crown needs more room as the tray grows;
  // reserve its real mesh extent through maximum camera punch and shake.
  const top=80+(h-320)*.12,bottom=h-108,span=bottom-top,tan=Math.tan(21*PI/180);
  const distance=Math.max(original.distance,4.55*h/(tan*span));
  const targetY=((top+bottom)/2-h/2)*2*tan*distance/h;
  value={...original,distance,targetY,narrowFit:true};
 }
 jewelcraftFramingCache={w,h,value};return value;
};
