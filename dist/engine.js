export const PERFECT=.040, GOOD=.090, EPS=1e-8;
export const PROFILES={
 relaxed:{label:'轻松',perfect:.080,good:.130,window:.180,breakOnStray:false,guard:.065},
 standard:{label:'标准',perfect:.055,good:.110,window:.150,breakOnStray:true,guard:.060},
 challenge:{label:'挑战',perfect:PERFECT,good:GOOD,window:GOOD,breakOnStray:true,guard:0}
};
export class Judge {
 constructor(notes,start=0,end=128,offset=0,profile='challenge',rate=1){
  this.rate=Number.isFinite(rate)&&rate>=.5&&rate<=1.5?rate:1;
  this.notes=notes.filter(n=>n.beat>=start&&n.beat<end);this.offset=offset;
  this.profile=PROFILES[profile]||PROFILES.challenge;this.reset();
 }
 reset(){this.results=new Map();this.events=[];this.combo=0;this.maxCombo=0;this.strays=0;this.lastPress=-Infinity;}
 // Frame expiry can leave a short dispatch grace. Inputs still use their event timestamp.
 expire(songTime,grace=0){const t=songTime-this.offset-grace;for(const n of this.notes)if(!this.results.has(n.id)&&t-n.beat/(2*this.rate)>this.profile.window+EPS)this.settle(n,'miss',null);}
 settle(n,kind,error){
  if(this.results.has(n.id))return null;
  if(kind==='miss')this.combo=0;else this.combo++;
  this.maxCombo=Math.max(this.maxCombo,this.combo);
  const r={id:n.id,beat:n.beat,kind,error,combo:this.combo};this.results.set(n.id,r);this.events.push(r);return r;
 }
 press(songTime){
  this.expire(songTime);const t=songTime-this.offset;
  let candidate=null,distance=Infinity;
  for(const n of this.notes){const d=Math.abs(t-n.beat/(2*this.rate));if(!this.results.has(n.id)&&d<=this.profile.window+EPS&&d<distance-EPS){candidate=n;distance=d;}}
  if(!candidate){
   if(songTime-this.lastPress<this.profile.guard-EPS)return {kind:'ignored'};
   if(this.profile.breakOnStray)this.combo=0;this.strays++;const r={kind:'stray',beat:t*2*this.rate,combo:this.combo};this.events.push(r);return r;
  }
  this.lastPress=songTime;
  const error=t-candidate.beat/2;
  return this.settle(candidate,distance<=this.profile.perfect+EPS?'perfect':distance<=this.profile.good+EPS?'good':'catch',error);
 }
 rollback(beat){
  this.events=this.events.filter(e=>e.beat<beat);this.results=new Map();this.combo=0;this.maxCombo=0;this.strays=0;this.lastPress=-Infinity;
  for(const e of this.events){if(e.kind==='stray'){this.strays++;if(this.profile.breakOnStray)this.combo=0;}else{this.results.set(e.id,e);this.combo=e.kind==='miss'?0:this.combo+1;}this.maxCombo=Math.max(this.maxCombo,this.combo);}
 }
 stats(){
  const r=[...this.results.values()],count=kind=>r.filter(x=>x.kind===kind).length;
  const perfect=count('perfect'),good=count('good'),caught=count('catch'),miss=count('miss'),hits=perfect+good+caught,total=this.notes.length,score=perfect*1000+good*700+caught*400;
  return {perfect,good,caught,miss,strays:this.strays,maxCombo:this.maxCombo,hits,total,score,accuracy:total?score/(total*1000):0,fullCombo:hits===total&&!this.strays};
 }
}
export function pointAt(nodes,terminal,beat){const first=nodes[0];if(beat<first.beat)return [first.position[0]-(first.beat-beat)*48,first.position[1]];let i=nodes.findIndex((n,j)=>beat>=n.beat&&(j===nodes.length-1||beat<nodes[j+1].beat));const a=nodes[Math.max(i,0)],b=nodes[i+1]||terminal;const f=Math.max(0,Math.min(1,(beat-a.beat)/(b.beat-a.beat)));return a.position.map((v,j)=>v+(b.position[j]-v)*f);}
export function calibration(values){const v=values.filter(v=>Math.abs(v)<=.25).sort((a,b)=>a-b);if(v.length<10)return null;const median=v[Math.floor(v.length/2)],dev=v.map(x=>Math.abs(x-median)).sort((a,b)=>a-b)[Math.floor(v.length/2)];return {offset:Math.max(-200,Math.min(200,Math.round(median*200)/.2)),spread:Math.round(dev*1000),stable:dev<=.035};}
