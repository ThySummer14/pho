import test from 'node:test';
import assert from 'node:assert/strict';
import {Judge,PROFILES} from '../dist/engine.js';
import {Music,notePitch} from '../dist/music.js';
const notes=[{id:0,beat:64,bar:17,nextIntervalBeats:1},{id:1,beat:65,bar:17,nextIntervalBeats:1},{id:2,beat:66,bar:17,nextIntervalBeats:1}];
for(const rate of [.75,.85,1,1.15])test(`tempo ${rate} keeps real millisecond windows, offsets, expiry and rollback`,()=>{
 for(const mode of Object.keys(PROFILES))for(const sign of [-1,1]){
  const p=PROFILES[mode],j=new Judge(notes,64,68,.06,mode,rate);
  assert.equal(j.press(64/(2*rate)+.06+sign*p.perfect).kind,'perfect');
  assert.equal(j.press(65/(2*rate)+.06+sign*p.good).kind,'good');
  j.expire(66/(2*rate)+.06+p.window+.00001);assert.equal(j.results.get(2).kind,'miss');
  j.rollback(65);assert.equal(j.results.size,1);assert.equal(j.combo,1);
  assert.equal(j.press(65/(2*rate)+.06).kind,'perfect');assert.equal(j.stats().score,2000);
 }
 const j=new Judge(notes,64,68,0,'challenge',rate);j.press(64/(2*rate));j.press(67/(2*rate));assert.equal(j.events.at(-1).beat,67);j.rollback(66);assert.equal(j.strays,0);
});
test('tempo scheduling aligns every melody onset and preserves oscillator pitch',()=>{
 for(const rate of [.75,.85,1,1.15]){
  const tones=[],hats=[],m=Object.create(Music.prototype);m.tone=(...a)=>tones.push(a);m.hat=(...a)=>hats.push(a);
  m.schedule(notes,10,64,68,rate);
  for(const n of notes){const lead=tones.find(a=>a[3]===.095&&a[1]===notePitch(n));assert.ok(lead);assert.equal(lead[0],10+(n.beat-64)/(2*rate));assert.equal(lead[2],.34/rate);}
  assert.equal(hats[0][0],10);assert.equal(hats[1][0],10+1/(2*rate));
 }
});
test('invalid tempo cannot create a non-finite judgement clock',()=>{for(const value of [0,NaN,Infinity,-1,9])assert.equal(new Judge(notes,64,68,0,'standard',value).rate,1)});
