import test from 'node:test';import assert from 'node:assert/strict';
import {audioTime,inputTime} from '../dist/audio-clock.js';
test('audible clock preserves queued input timestamp rather than handler delivery time',()=>{
 const c={currentTime:10.2,getOutputTimestamp:()=>({contextTime:10,performanceTime:1000})};
 assert.equal(audioTime(c,970,1040),9.97);assert.equal(audioTime(c,1040,1040),10.04);
});
test('missing, initial, stale, malformed and throwing output clocks safely fall back',()=>{
 for(const stamp of [undefined,{contextTime:0,performanceTime:0},{contextTime:10,performanceTime:-1000},{contextTime:Infinity,performanceTime:1000},{contextTime:10,performanceTime:NaN}]){
  assert.equal(audioTime({currentTime:10,getOutputTimestamp:()=>stamp},970,1000),9.97);
 }
 assert.equal(audioTime({currentTime:10,getOutputTimestamp(){throw Error('device changed');}},970,1000),9.97);
 assert.equal(audioTime({currentTime:10},970,1000),9.97);assert.equal(audioTime(null,970,1000),0);
});
test('legacy epoch event times and missing event times share the performance clock',()=>{
 assert.equal(inputTime(1700000000970,1000,1700000000000),970);
 assert.equal(inputTime(970,1000,1700000000000),970);
 for(const t of [undefined,NaN,Infinity,0,-1])assert.equal(inputTime(t,1000,1700000000000),1000);
});
