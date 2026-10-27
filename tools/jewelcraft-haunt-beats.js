/* Pure, earned Halloween presentation. No clocks, state, renderer or audio APIs.
   Count is PER SIDE: desktop <= 6, phone Math.min(3, count). The caller owns
   comfort controls and applies its Flashes multiplier to the returned energy.
   Use the game's frozen simulation time for every `now` argument.

   event = halloweenMergeBeat(event, now, cascade, mode);
   rank = halloweenBeatRank(event, now); age = now - event.at;
   pose = halloweenBeatPose(side, k, age, rank); // scale includes envelope
   // Phone mapping uses pose.visibility (0..1), retaining its pixel-size budget.
   warmth = halloweenBeatEnergy(age, rank);    // bounded, no pulsing clock

   Merge latches stronger beats without changing at. Its 180ms rank blend is
   also used by pose/envelope/energy, so escalation is continuous even when a
   second upgrade arrives during that blend. Clear event on theme/new-board
   reset. An expired event may be replaced only by a newly earned feed.
*/
const HALLOWEEN_BEATS=Object.freeze([
 Object.freeze({rank:0,count:0,delay:0,spread:0,lift:0,energy:0,attack:.18,hold:1.30}),
 // Awakening: one paired silhouette, a small outward lift.
 Object.freeze({rank:1,count:1,delay:0,spread:.14,lift:.66,energy:.12,attack:.18,hold:1.30}),
 // Procession: four pairs enter in succession along rising, bowed arcs.
 Object.freeze({rank:2,count:4,delay:.14,spread:.27,lift:1.13,energy:.25,attack:.26,hold:1.48}),
 // Eclipse: six pairs open into the widest fan, then release together.
 Object.freeze({rank:3,count:6,delay:.075,spread:.40,lift:1.39,energy:.40,attack:.22,hold:1.64})
]);
function halloweenBeat(cascade,mode){
 const c=Number.isFinite(cascade)?cascade:0;
 return HALLOWEEN_BEATS[mode==='prism'||mode==='blast'||c>=6?3:c>=4?2:c>=3?1:0];
}
function halloweenBeatSmooth(value){
 const t=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));return t*t*(3-2*t);
}
function halloweenBeatMix(rank,sample){
 const r=Math.max(0,Math.min(3,Number.isFinite(rank)?rank:0)),lo=Math.floor(r),hi=Math.ceil(r),t=r-lo;
 return sample(HALLOWEEN_BEATS[lo])*(1-t)+sample(HALLOWEEN_BEATS[hi])*t;
}
function halloweenBeatEnvelope(age,rank){
 if(!Number.isFinite(age)||age<=0||age>=2.2)return 0;
 return halloweenBeatMix(rank,b=>b.rank?halloweenBeatSmooth(age/b.attack)*(1-halloweenBeatSmooth((age-b.hold)/(2.2-b.hold))):0);
}
function halloweenBeatEnergy(age,rank){
 // Interpolate the entire envelope, not just peak energy, across an upgrade.
 return halloweenBeatMix(rank,b=>b.energy*halloweenBeatEnvelope(age,b.rank));
}
function halloweenBeatRank(event,now){
 if(!event)return 0;
 const target=Math.max(0,Math.min(3,Number.isFinite(event.rank)?event.rank:0));
 const from=Math.max(0,Math.min(target,Number.isFinite(event.fromRank)?event.fromRank:target));
 return from+(target-from)*halloweenBeatSmooth((now-event.rankAt)/.18);
}
function halloweenMergeBeat(previous,now,cascade,mode){
 const next=halloweenBeat(cascade,mode);
 if(!next.rank||!Number.isFinite(now))return previous||null;
 if(previous&&now>=previous.at&&now-previous.at<2.2){
  if(next.rank<=previous.rank)return previous;
  return Object.freeze({at:previous.at,rank:next.rank,fromRank:halloweenBeatRank(previous,now),rankAt:now});
 }
 return Object.freeze({at:now,rank:next.rank,fromRank:next.rank,rankAt:now});
}
function halloweenBeatPose(side,k,age,rank){
 const s=side<0?-1:1,valid=Number.isInteger(k)&&k>=0&&k<6,i=valid?k:0;
 const a=Number.isFinite(age)?Math.max(0,Math.min(2.2,age)):0;
 const r=Math.max(0,Math.min(3,Number.isFinite(rank)?rank:0)),lo=Math.floor(r),hi=Math.ceil(r),blend=r-lo;
 const sample=b=>{
  const local=Math.max(0,a-i*b.delay),u=Math.min(1,local/(2.2-i*b.delay));
  const arc=Math.sin(Math.PI*u),open=halloweenBeatSmooth(u);
  const x=4.78+i*b.spread+(.25+.075*b.rank+i*.018)*open+(b.rank===2?.12*arc:0);
  const y=2.93+i*.10+b.lift*u+(b.rank===2?.20: .09)*arc;
  const rotation=[0,s*Math.sin(local*9+i*.7)*(.25+b.rank*.035),s*(-.09+(.04+b.rank*.025)*Math.sin(local*2.6+i*.28))];
  const visibility=valid&&i<b.count?halloweenBeatEnvelope(a,b.rank)*halloweenBeatSmooth(local/.18):0;
  return {pos:[s*x,y,.36],rotation,scale:(.218+i*.012+b.rank*.008)*visibility,visibility};
 };
 const p=sample(HALLOWEEN_BEATS[lo]),q=sample(HALLOWEEN_BEATS[hi]);
 return {pos:p.pos.map((v,j)=>v+(q.pos[j]-v)*blend),rotation:p.rotation.map((v,j)=>v+(q.rotation[j]-v)*blend),scale:p.scale+(q.scale-p.scale)*blend,visibility:p.visibility+(q.visibility-p.visibility)*blend};
}
