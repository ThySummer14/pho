import test from 'node:test';import assert from 'node:assert/strict';import {Judge,PROFILES} from '../dist/engine.js';import {recordRun,readProgress,rank} from '../dist/progress.js';
const notes=[{id:0,beat:0},{id:1,beat:.5},{id:2,beat:1}];
test('each difficulty has inclusive, signed timing boundaries and a catch tier',()=>{
 for(const [mode,p] of Object.entries(PROFILES))for(const sign of [-1,1]){
  assert.equal(new Judge(notes,0,128,0,mode).press(sign*p.perfect).kind,'perfect');
  assert.equal(new Judge(notes,0,128,0,mode).press(sign*p.good).kind,'good');
  if(p.window>p.good)assert.equal(new Judge([{id:0,beat:2}],0,128,0,mode).press(1+sign*p.window).kind,'catch');
 }
 assert.equal(new Judge(notes,0,128,0,'challenge').press(-.091).kind,'stray');
});
test('overlapping wide windows select the nearest note with stable earlier tie',()=>{
 assert.equal(new Judge(notes,0,128,0,'relaxed').press(.14).id,1);
 assert.equal(new Judge(notes,0,128,0,'relaxed').press(.125).id,0);
 const j=new Judge(notes,0,128,0,'standard');j.press(.14);assert.equal(j.press(.50).kind,'perfect');assert.equal(j.stats().hits,2);
});
test('input dispatch grace protects legal event timestamps without widening scoring',()=>{
 const j=new Judge(notes,0,128,0,'challenge');j.expire(.1,.075);assert.equal(j.press(.088).kind,'good');
 const k=new Judge(notes,0,128,0,'challenge');k.expire(.18,.075);assert.equal(k.stats().miss,1);
});
test('rebound guards, relaxed empty taps and rollback preserve truthful stats',()=>{
 const j=new Judge(notes,0,128,.03,'relaxed');j.press(.03);assert.equal(j.press(.04).kind,'ignored');assert.equal(j.stats().strays,0);
 j.press(.23);assert.equal(j.combo,2);j.press(2);assert.equal(j.combo,0); // remaining real miss still breaks combo
 const clean=new Judge([{id:0,beat:0},{id:1,beat:4}],0,128,0,'relaxed');clean.press(0);clean.press(.5);assert.equal(clean.combo,1);assert.equal(clean.stats().strays,1);clean.rollback(4);assert.equal(clean.combo,1);
});
test('catch counts as a hit with reduced score and event combos are settled locally',()=>{
 const j=new Judge([{id:0,beat:0},{id:1,beat:2}],0,128,0,'standard');j.press(.13);j.press(1);const s=j.stats();assert.equal(s.caught,1);assert.equal(s.hits,2);assert.equal(s.score,1400);assert.equal(s.accuracy,.7);assert.equal(s.fullCombo,true);assert.deepEqual(j.events.map(e=>e.combo),[1,2]);
});
const empty={best:{},badges:[]},perfect={total:117,hits:117,score:117000,accuracy:1,maxCombo:117,fullCombo:true};
test('records are mode-specific and practice or restored runs cannot replace full-song best',()=>{
 const first=recordRun(empty,perfect,{mode:'standard'});assert.equal(first.newBest,true);assert.equal(first.rank,'S+');assert.equal(first.fresh.length,5);
 const repeated=recordRun(first.progress,perfect,{mode:'standard'});assert.equal(repeated.newBest,false);assert.equal(repeated.fresh.length,0);
 const other=recordRun(first.progress,{...perfect,score:90000,accuracy:.85},{mode:'challenge'});assert.equal(other.progress.best.challenge.score,90000);assert.equal(other.progress.best.standard.score,117000);
 for(const options of [{practice:true},{resumed:true}]){const r=recordRun(empty,perfect,options);assert.equal(r.recorded,false);assert.deepEqual(r.progress.best,{});assert.ok(!r.progress.badges.includes('fullCombo'));}
 assert.equal(rank({hits:0,accuracy:0}),'—');
});
test('an exact 80 percent score receives A in the result and stored record',()=>{
 const borderNotes=Array.from({length:117},(_,id)=>({id,beat:id})),j=new Judge(borderNotes,0,128,0,'standard');
 for(const n of borderNotes)j.press(n.beat/2+(n.id<39?0:.08));
 const s=j.stats();assert.equal(s.perfect,39);assert.equal(s.good,78);assert.equal(s.score,93600);assert.equal(s.accuracy,.8);assert.equal(rank(s),'A');
 const recorded=recordRun(empty,s,{mode:'standard'});assert.equal(recorded.rank,'A');assert.equal(recorded.progress.best.standard.rank,'A');assert.equal(recorded.progress.best.standard.accuracy,.8);assert.equal(recorded.recorded,true);
 assert.equal(rank({...s,accuracy:.7999}),'B');assert.ok(!recorded.progress.badges.includes('accuracy90'));
});
test('progress reading rejects malformed records and unknown badges',()=>{
 assert.deepEqual(readProgress({getItem:()=>'{'}),empty);
 const p=readProgress({getItem:()=>JSON.stringify({best:{standard:{score:900,accuracy:.9},relaxed:{score:Infinity},fake:{score:1,accuracy:1}},badges:['first','first','fake']})});assert.deepEqual(p.badges,['first']);assert.equal(Object.keys(p.best).length,1);
});
test('empty-tap protection never suppresses a valid corrective or adjacent note',()=>{
 const j=new Judge([{id:0,beat:0},{id:1,beat:1}],0,128,0,'standard');j.press(0);assert.equal(j.press(.33).kind,'stray');assert.equal(j.press(.38).kind,'catch');
 const rapid=new Judge(notes,0,128,0,'standard');assert.equal(rapid.press(.10).id,0);assert.equal(rapid.press(.15).id,1);assert.equal(rapid.stats().hits,2);
});
