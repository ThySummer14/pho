const midi=n=>440*2**((n-69)/12);
const roots=[45,41,48,43],motif=[0,7,12,10,7,3,7,12];
export function notePitch(note){return midi(roots[Math.floor((note.bar-1)/2)%4]+24+motif[note.id%motif.length]);}
export class Music {
 constructor(ctx,{music=.75,sfx=.8,timbre='crisp'}={}){
  this.ctx=ctx;this.nodes=[];
  this.bus=ctx.createGain();this.bus.gain.value=.52;this.bus.connect(ctx.destination);
  this.musicBus=ctx.createGain();this.musicBus.connect(this.bus);
  this.sfxBus=ctx.createGain();this.sfxBus.connect(this.bus);this.setLevels(music,sfx);this.setTimbre(timbre);
  this.noise=ctx.createBuffer(1,ctx.sampleRate*.2,ctx.sampleRate);
  const a=this.noise.getChannelData(0);let seed=37;
  for(let i=0;i<a.length;i++){seed=(seed*1664525+1013904223)>>>0;a[i]=seed/4294967296*2-1;}
 }
 setLevels(music,sfx){this.musicBus.gain.value=Math.max(0,Math.min(1,music));this.sfxBus.gain.value=Math.max(0,Math.min(1,sfx));}
 setTimbre(profile){this.timbre=profile==='warm'?'warm':'crisp';}
 track(source,connections){this.nodes.push(source);source.onended=()=>{source.disconnect();for(const node of connections)node.disconnect();const i=this.nodes.indexOf(source);if(i>=0)this.nodes.splice(i,1);};}
 tone(t,hz,duration,volume,type='sine',toHz,bus=this.musicBus,attack=.004){
  const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(hz,t);
  if(toHz)o.frequency.exponentialRampToValueAtTime(toHz,t+duration);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+Math.min(attack,duration*.25));g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(bus);this.track(o,[g]);o.start(t);o.stop(t+duration+.02);
 }
 hat(t,v=.025,bus=this.musicBus,frequency=6500,duration=.07){
  const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='highpass';f.frequency.value=frequency;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(bus);this.track(s,[f,g]);s.start(t);s.stop(t+duration+.01);
 }
 click(t,accent=false){this.tone(t,accent?1046:784,.07,.09,'sine',undefined,this.sfxBus);}
 tap(){
  const t=this.ctx.currentTime+.001,bus=this.sfxBus,warm=this.timbre==='warm';
  // Every physical press gets the same short contact sound, independent of judgment.
  this.hat(t,warm?.085:.11,bus,warm?1800:3200,warm?.024:.018);
  this.tone(t,warm?620:980,warm?.040:.028,warm?.11:.095,warm?'sine':'triangle',warm?220:420,bus,.001);
 }
 feedback(kind,note,combo=0){
  if(!['perfect','good','catch'].includes(kind))return;
  const t=this.ctx.currentTime+.001,bus=this.sfxBus,warm=this.timbre==='warm';
  // A quiet glint rewards accuracy without playing the scheduled melody a second time.
  if(kind==='perfect')this.tone(t,warm?1320:1760,.048,.019,'sine',warm?1100:1480,bus,.001);
  if(combo>0&&combo%16===0){
   this.tone(t,1174,.075,.016,'sine',undefined,bus,.001);
   this.tone(t,1568,.068,.011,'sine',undefined,bus,.001);
  }
 }
 schedule(notes,startAudio,startBeat,endBeat,rate=1){
  rate=Number.isFinite(rate)&&rate>=.5&&rate<=1.5?rate:1;
  const time=b=>startAudio+(b-startBeat)/(2*rate);
  for(let b=startBeat;b<endBeat;b++){
   const bar=Math.floor(b/4),root=roots[Math.floor(bar/2)%4],section=Math.floor(b/32);
   // The quiet second section leaves more air; later sections gain offbeat texture.
   if(section!==1||b%2===0)this.tone(time(b),115,.16,.16,'sine',42);
   this.hat(time(b),b%2===1?.055:.018);
   if(section>=2&&b%2===1)this.hat(time(b+.5),.016);
   if(b%2===0)this.tone(time(b),midi(root),.37/rate,.08,'triangle');
   if(b%4===0)for(const n of [root+12,root+15,root+19])this.tone(time(b),midi(n),1.75/rate,.022,'sine');
   if(section===3&&b%4===0)this.tone(time(b),midi(root+31),1.4/rate,.013,'sine');
  }
  for(const n of notes){if(n.beat<startBeat||n.beat>=endBeat)continue;const pitch=notePitch(n),duration=Math.min(.34,n.nextIntervalBeats*.36)/rate;this.tone(time(n.beat),pitch,duration,.095,'triangle');this.tone(time(n.beat),pitch*2,.08,.035);}
 }
 prepareMaster(buffer,startAudio,startBeat,endBeat,bpm,full=false){
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),offset=startBeat*60/bpm;
  const duration=Math.max(0,Math.min(buffer.duration-offset,(endBeat-startBeat)*60/bpm+(full?1.2:0)));
  source.buffer=buffer;gain.gain.setValueAtTime(1,startAudio);gain.gain.setValueAtTime(1,startAudio+Math.max(0,duration-.04));gain.gain.exponentialRampToValueAtTime(.0001,startAudio+duration);
  source.connect(gain);gain.connect(this.musicBus);this.track(source,[gain]);source.start(startAudio,offset,duration);
 }
 // Rolling lookahead bounds native audio nodes for longer multitrack songs.
 prepareScore(score,startAudio,startBeat,endBeat,rate=1){
  const seconds=60/(score.bpm*rate);this.scoreSeconds=seconds;
  this.queue=score.tracks.flatMap(track=>track.events.filter(e=>e[0]>=startBeat&&e[0]<endBeat).map(event=>({track,event,time:startAudio+(event[0]-startBeat)*seconds}))).sort((a,b)=>a.time-b.time);this.queueCursor=0;this.pump();
 }
 pump(){
  if(!this.queue)return;
  while(this.queueCursor<this.queue.length&&this.queue[this.queueCursor].time<this.ctx.currentTime+.35){
   const item=this.queue[this.queueCursor++];
   // After a long main-thread stall, skip stale sound rather than emit a burst.
   if(item.time<this.ctx.currentTime-.05)continue;
   this.voice(item.track,item.event,Math.max(this.ctx.currentTime+.001,item.time),this.scoreSeconds);
  }
 }
 voice(track,event,time,seconds){
  const [,pitch,length,velocity]=event,hz=midi(pitch),v=Math.max(.02,Math.min(1,velocity)),d=Math.max(.04,Math.min(4,length)*seconds);
  switch(track.kind){
   case 'kick':this.tone(time,125,.16,.19*v,'sine',42);break;
   case 'snare':this.hat(time,.09*v,this.musicBus,1800,.12);this.tone(time,185,.055,.025*v,'triangle',95);break;
   case 'rim':this.tone(time,970,.032,.095*v,'triangle',440);break;
   case 'hat':this.hat(time,.037*v,this.musicBus,6800,.055);break;
   case 'tom':this.tone(time,hz*2,.17,.12*v,'sine',hz);break;
   case 'bass':this.tone(time,hz,d,.13*v,'triangle');break;
   case 'pad':this.tone(time,hz,d,.035*v,'sine',undefined,this.musicBus,.04);break;
   case 'flute':this.tone(time,hz,d,.14*v,'sine',undefined,this.musicBus,.008);this.tone(time,hz*2,d*.65,.02*v);break;
   case 'lead':this.tone(time,hz,d,.105*v,'triangle',undefined,this.musicBus,.005);break;
   case 'bell':this.tone(time,hz,d,.11*v);this.tone(time,hz*2.76,d*.45,.025*v);break;
   case 'epiano':this.tone(time,hz,d,.085*v);this.tone(time,hz*2,d*.25,.02*v);break;
   default:this.tone(time,hz,d,.075*v,'triangle',undefined,this.musicBus,.002);
  }
 }
 stop(){this.queue=null;this.queueCursor=0;for(const n of this.nodes){n.onended=null;try{n.stop();n.disconnect();}catch{}}this.nodes=[];this.musicBus.disconnect();this.sfxBus.disconnect();this.bus.disconnect();}
}
