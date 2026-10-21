/* B005: keep the playable tray above the unchanged compact control rail.
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
 }
 jewelcraftFramingCache={w,h,value};return value;
};
