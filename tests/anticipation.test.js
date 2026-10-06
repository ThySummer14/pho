import test from 'node:test';import assert from 'node:assert/strict';
import {upcomingCue} from '../dist/anticipation.js';
const notes=gap=>[{id:0,beat:4,voice:'Flute lead'},{id:1,beat:4+gap,voice:'Flute lead'}];
test('read-ahead names actual voices and separates syncopation, half beats and rests',()=>{
 for(const gap of [.75,1.5])assert.match(upcomingCue(notes(gap),new Map(),4).text,/长笛 \/ 切分/);
 assert.match(upcomingCue(notes(.5),new Map(),4).text,/半拍/);assert.match(upcomingCue(notes(1),new Map(),4).text,/单拍/);assert.match(upcomingCue(notes(2),new Map(),4).text,/留白/);
 assert.equal(upcomingCue([{id:0,beat:0,voice:'Spark answers'}],new Map(),0).voice,'钟声应答');
});
test('a still-hittable late note remains in preview at high BPM and wide difficulty',()=>{
 const n=notes(.5);const r=upcomingCue(n,new Map(),4.45,.18*172/60);assert.equal(r.interval,.5);assert.equal(r.voice,'长笛');
 assert.equal(upcomingCue(n,new Map(),4.45,.09*172/60).interval,null);
});
test('settled notes and silence are handled without mutating judgement state',()=>{
 const n=notes(.5),results=new Map([[0,{kind:'perfect'}]]),before=JSON.stringify([...results]);
 assert.match(upcomingCue(n,results,4).text,/最后一音/);assert.equal(JSON.stringify([...results]),before);
 results.set(1,{kind:'miss'});assert.equal(upcomingCue(n,results,6).text,'曲尾 / LAST ECHO');assert.equal(upcomingCue([],new Map(),-4).interval,null);
});
