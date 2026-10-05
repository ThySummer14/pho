import test from 'node:test';import assert from 'node:assert/strict';
import {phraseReport,timingSummary,coachingText} from '../dist/coaching.js';
const notes=Array.from({length:32},(_,id)=>({id,beat:id}));
test('phrase report uses loss ratio, counts empty taps and supports focused subranges',()=>{
 const r=new Map(notes.map(n=>[n.id,{kind:n.id<16?'perfect':'good',error:.08}]));
 r.set(18,{kind:'miss',error:null});const events=[{kind:'stray',beat:17},{kind:'stray',beat:32}];
 const a=phraseReport(notes,r,events,0,32);assert.equal(a.phrases.length,2);assert.equal(a.weakest.start,16);assert.equal(a.weakest.misses,1);assert.equal(a.weakest.strays,1);assert.equal(a.phrases[0].accuracy,1);
 const b=phraseReport(notes,r,events,16,32);assert.equal(b.phrases.length,1);assert.equal(b.weakest.start,16);
});
test('stable offset and variable input have distinct descriptive feedback',()=>{
 const stable=timingSummary(new Map(Array.from({length:16},(_,i)=>[i,{error:.07}])));assert.equal(stable.count,16);assert.equal(stable.mean,70);assert.equal(stable.spread,0);
 const stats={hits:16,miss:0,total:16,strays:0};assert.match(coachingText(stable,stats),/偏晚/);
 const variable=timingSummary(new Map(Array.from({length:16},(_,i)=>[i,{error:i%2?.08:-.08}])));assert.equal(variable.mean,0);assert.equal(variable.spread,80);assert.match(coachingText(variable,stats),/不稳定/);
});
test('no-input, sparse samples, no notes and equal phrases are safe and truthful',()=>{
 assert.deepEqual(timingSummary(new Map([[0,{kind:'miss',error:null}]])),{count:0,mean:null,spread:null});
 assert.equal(phraseReport([],new Map(),[]).weakest,null);assert.equal(phraseReport(notes,new Map(),[],0,32).weakest.start,0);
 assert.match(coachingText({count:0},{hits:0}),/75%/);assert.match(coachingText({count:4},{hits:4,total:4,miss:0}),/样本还少/);
});
