const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'tools/jewelcraft-haunt-beats.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source+'\nthis.api={halloweenBeat,halloweenBeatEnvelope,halloweenBeatEnergy,halloweenBeatRank,halloweenMergeBeat,halloweenBeatPose};',context);
const {halloweenBeat:beat,halloweenBeatEnvelope:envelope,halloweenBeatEnergy:energy,halloweenBeatRank:rank,halloweenMergeBeat:merge,halloweenBeatPose:pose}=context.api;
const plain=x=>JSON.parse(JSON.stringify(x));
const close=(a,b,epsilon=1e-12)=>assert(Math.abs(a-b)<=epsilon,`${a} != ${b}`);

test('earned tiers are distinct and cap desktop/phone instance budgets',()=>{
 for(const c of [undefined,null,NaN,-1,0,1,2])assert.equal(beat(c,'match').rank,0);
 for(const [c,r,n] of [[3,1,1],[4,2,4],[5,2,4],[6,3,6],[1000,3,6]]){
  const b=beat(c,'match');assert.equal(b.rank,r);assert.equal(b.count,n);assert(Object.isFrozen(b));assert(b.count*2<=12);assert(Math.min(3,b.count)*2<=6);
 }
 assert.equal(beat(1,'prism').rank,3);assert.equal(beat(1,'blast').rank,3);assert.equal(beat(2,'unknown').rank,0);
 const a=beat(3),b=beat(4),c=beat(6);assert(a.spread<b.spread&&b.spread<c.spread);assert(a.lift<b.lift&&b.lift<c.lift);assert(a.energy<b.energy&&b.energy<c.energy);
});

test('each beat has a smooth attack, steady hold, single release and exact lifetime',()=>{
 for(const r of [0,1,1.5,2,2.5,3]){
  for(const age of [-1,0,2.2,3,NaN,Infinity]){assert.equal(envelope(age,r),0);assert.equal(energy(age,r),0);}
  let last=0;for(let i=0;i<=26;i++){const e=envelope(i/100,r);assert(e>=last-1e-12);last=e;}
  if(r)close(envelope(.7,r),1);
  last=1;for(let i=164;i<=220;i++){const e=envelope(i/100,r);assert(e<=last+1e-12);assert(e>=0&&e<=1);assert(energy(i/100,r)<=.4);last=e;}
 }
 for(const r of [1,2,3]){assert(envelope(.001,r)<.0001);assert(envelope(2.199,r)<.0001);}
 assert.equal(pose(1,1,.8,1).scale,0); // Awakening remains one pair.
 assert.equal(pose(1,3,.40,2).scale,0); // Procession's fourth pair has not entered.
 assert(pose(1,3,.8,2).scale>0);
 assert(pose(1,5,.8,3).scale>0);
});

test('escalation retains one clock and blends without reset starvation or pose jumps',()=>{
 assert.equal(merge(null,0,2,'match'),null);
 let event=merge(null,10,3,'match');assert(Object.isFrozen(event));assert.equal(event.at,10);
 const before=plain(pose(1,0,.35,rank(event,10.35))),warmth=energy(.35,rank(event,10.35));
 event=merge(event,10.35,4,'match');assert.equal(event.at,10);assert.equal(event.rank,2);
 assert.deepEqual(plain(pose(1,0,.35,rank(event,10.35))),before);close(energy(.35,rank(event,10.35)),warmth);
 const during=rank(event,10.42),duringPose=plain(pose(-1,3,.42,during));assert(during>1&&during<2);
 event=merge(event,10.42,6,'match');assert.equal(event.at,10);close(rank(event,10.42),during);assert.deepEqual(plain(pose(-1,3,.42,rank(event,10.42))),duringPose);
 const strongest=event;for(let i=43;i<220;i++){event=merge(event,10+i/100,i%2?6:3,'match');assert.equal(event,strongest);assert.equal(event.at,10);}
 close(rank(event,10.8),3);assert.equal(envelope(2.2,rank(event,12.2)),0);
 const fresh=merge(event,12.21,4,'match');assert.notEqual(fresh,event);assert.equal(fresh.at,12.21);assert.equal(fresh.rank,2);
 assert.equal(merge(fresh,NaN,6,'match'),fresh);
});

test('frozen simulation time is deterministic and disabled slots cannot leave stale geometry',()=>{
 let event=merge(null,4,3,'match');event=merge(event,4.5,6,'match');
 const r=rank(event,4.57),sample=plain(pose(-1,4,.57,r));
 for(let i=0;i<100;i++){assert.equal(rank(event,4.57),r);assert.deepEqual(plain(pose(-1,4,.57,r)),sample);assert.equal(merge(event,4.57,6,'match'),event);}
 for(const k of [-1,6,20,NaN,1.5]){assert.equal(pose(1,k,.8,3).scale,0);assert.equal(pose(1,k,.8,3).visibility,0);}
 for(const r of [0,1,2,3])for(const k of [0,1,3,5])for(const age of [-1,0,2.2,NaN,Infinity])assert.equal(pose(1,k,age,r).scale,0);
});

test('all actual bat vertices stay beyond the desktop tray and above the side HUD',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),season=fs.readFileSync(path.join(root,'tools/jewelcraft-halloween.js'),'utf8'),art=fs.readFileSync(path.join(root,'tools/jewelcraft-haunted-assets.js'),'utf8');
 const part=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return text.slice(i,j);};
 const geo=vm.createContext({});
 vm.runInContext(part(html,'const PI=Math.PI','const SHARED_SHADER=')+part(html,'function tintGeo(','function leaf(')+part(season,'function halloweenFace(','const jewelboundOriginalWorld=')+art+'\nthis.bat=halloweenBat().data();this.matrix=trs;',geo);
 let vertices=0,minX=Infinity,minY=Infinity,maxScale=0;
 for(const r of [1,1.25,1.5,1.75,2,2.25,2.5,2.75,3])for(let step=0;step<=110;step++)for(const side of [-1,1])for(let k=0;k<6;k++){
  const p=pose(side,k,step*.02,r),m=geo.matrix(p.pos,p.rotation,[p.scale,p.scale,p.scale]);maxScale=Math.max(maxScale,p.scale);assert(p.visibility>=0&&p.visibility<=1);
  for(let i=0;i<geo.bat.length;i+=12){
   const x=geo.bat[i],y=geo.bat[i+1],z=geo.bat[i+2],wx=m[0]*x+m[4]*y+m[8]*z+m[12],wy=m[1]*x+m[5]*y+m[9]*z+m[13];
   assert(Number.isFinite(wx)&&Number.isFinite(wy));minX=Math.min(minX,Math.abs(wx));minY=Math.min(minY,wy);vertices++;
  }
 }
 assert(minX>4.2,`bat crosses tray at ${minX}`);assert(minY>2.5,`bat crosses side HUD at ${minY}`);assert(maxScale<=.3020001);
 console.log(`CPU geometry: ${vertices} transformed vertices, min |x|=${minX.toFixed(4)}, min y=${minY.toFixed(4)}, max scale=${maxScale.toFixed(3)}`);
});
