import test from 'node:test';
import assert from 'node:assert/strict';
import {Music} from '../dist/music.js';
import {Scene} from '../dist/scene.js';
const param=()=>({value:0,automation:[],setValueAtTime(value,time){this.automation.push({value,time,ramp:false})},exponentialRampToValueAtTime(value,time){this.automation.push({value,time,ramp:true})}});
const node=()=>({gain:param(),frequency:param(),connections:[],connect(target){this.connections.push(target)},disconnect(){this.disconnected=true},start(time){this.startedAt=time},stop(time){this.stopped=true;this.stoppedAt=time}});
const context=()=>({currentTime:10,sampleRate:100,destination:{},createGain:node,createOscillator:node,createBufferSource:node,createBiquadFilter:node,createBuffer:(_,n)=>({getChannelData:()=>new Float32Array(n)})});
test('each tap starts a short contact sound immediately, with selectable timbre and a reused noise buffer',()=>{
 const ctx=context();let buffers=0;const createBuffer=ctx.createBuffer;ctx.createBuffer=(...args)=>{buffers++;return createBuffer(...args)};
 const m=new Music(ctx),tones=[],hats=[];m.tone=(...args)=>tones.push(args);m.hat=(...args)=>hats.push(args);
 m.tap();const crispTone=[...tones[0]],crispHat=[...hats[0]];m.tap();assert.deepEqual(tones[1],crispTone);assert.deepEqual(hats[1],crispHat);assert.equal(buffers,1);
 assert.equal(crispTone[0],10.001);assert.equal(crispHat[0],10.001);assert.equal(crispTone[6],m.sfxBus);assert.equal(crispHat[2],m.sfxBus);
 assert.ok(crispTone[2]<=.040);assert.ok(crispHat[4]<=.024);assert.equal(crispTone[7],.001);assert.ok(crispTone[5]<crispTone[1]);
 m.setTimbre('warm');m.tap();assert.notEqual(tones[2][1],crispTone[1]);assert.ok(tones[2][2]<=.040);assert.ok(hats[2][3]<crispHat[3]);
 m.setTimbre('invalid');assert.equal(m.timbre,'crisp');assert.equal(new Music(context(),{timbre:'warm'}).timbre,'warm');
});
test('judgment adds quiet short rewards independent of chart pitch, with silent misses and strays',()=>{
 const m=new Music(context()),tones=[],hats=[];m.tone=(...args)=>tones.push(args);m.hat=(...args)=>hats.push(args);
 m.feedback('perfect',{id:1,bar:1},1);const glint=[...tones[0]];assert.equal(tones.length,1);assert.equal(hats.length,0);assert.equal(glint[0],10.001);assert.equal(glint[6],m.sfxBus);assert.ok(glint[3]<=.02);
 tones.length=0;m.feedback('perfect',{id:99,bar:32},1);assert.deepEqual(tones[0],glint);
 tones.length=0;m.feedback('good',{id:1,bar:1},1);assert.equal(tones.length,0);
 m.feedback('perfect',{id:1,bar:1},16);assert.equal(tones.length,3);assert.ok(tones.every(x=>x[0]===10.001&&x[2]+.02<=.100&&x[3]<=.02&&x[6]===m.sfxBus));
 tones.length=0;m.feedback('miss');m.feedback('stray');assert.equal(tones.length,0);assert.equal(hats.length,0);
 m.click(11,true);assert.equal(tones.length,1);assert.equal(tones[0][0],11);assert.ok(tones[0][3]>0);
});
test('tap envelopes route through the independently mutable effect mixer',()=>{
 const ctx=context(),m=new Music(ctx,{music:.35,sfx:0});m.tap();assert.equal(m.musicBus.gain.value,.35);assert.equal(m.sfxBus.gain.value,0);
 assert.equal(m.nodes.length,2);assert.ok(m.nodes.every(n=>n.startedAt===10.001&&n.stoppedAt<=10.062));
 const body=m.nodes[1],envelope=body.connections[0].gain.automation;assert.ok(Math.abs(envelope[1].time-envelope[0].time-.001)<1e-9);assert.equal(envelope.at(-1).value,.0001);
 m.setLevels(0,1);assert.equal(m.musicBus.gain.value,0);assert.equal(m.sfxBus.gain.value,1);m.setLevels(5,-1);assert.equal(m.musicBus.gain.value,1);assert.equal(m.sfxBus.gain.value,0);
});
test('finished voices release connections; stop cancels pending music and feedback',()=>{
 const m=new Music(context());m.tone(11,440,.1,.1);m.tap();m.feedback('perfect',{id:0,bar:1});assert.ok(m.nodes.length>1);const first=m.nodes[0];first.onended();assert.equal(first.disconnected,true);assert.equal(m.nodes.includes(first),false);
 const pending=[...m.nodes];m.stop();assert.equal(m.nodes.length,0);assert.ok(pending.every(n=>n.stopped&&n.disconnected&&n.onended===null));assert.equal(m.bus.disconnected,true);
});
test('scene transitions are continuous and transient effects are bounded and resettable',()=>{
 const s=new Scene();assert.deepEqual(s.palette(31.999).color,s.palette(32).color);assert.notDeepEqual(s.palette(32).color,s.palette(36).color);
 for(let i=0;i<100;i++)s.hit({kind:'perfect'},[1,2],i,16);assert.equal(s.effects.length,24);s.clear();assert.equal(s.effects.length,0);
});
test('catch milestones share the short reward while ordinary catches stay silent',()=>{
 const m=new Music(context()),tones=[];m.tone=(...a)=>tones.push(a);m.feedback('catch',null,15);assert.equal(tones.length,0);m.feedback('catch',null,16);assert.equal(tones.length,2);assert.ok(tones.every(a=>a[2]<=.075&&a[3]<=.016));
});
