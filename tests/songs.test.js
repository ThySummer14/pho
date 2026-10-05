import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {SONGS,songKey} from '../dist/songs.js';import {Judge} from '../dist/engine.js';import {Music} from '../dist/music.js';import {recordRun,readProgress} from '../dist/progress.js';
const read=s=>JSON.parse(fs.readFileSync(new URL('../dist/'+s,import.meta.url)));
for(const song of SONGS.slice(1))test(`${song.id}: each target maps to an audible approved-score onset and deterministic route`,()=>{
 const chart=read(song.chart);assert.equal(chart.durationBeats,song.beats);assert.equal(chart.bpm,song.bpm);assert.ok(chart.notes.length>75);
 for(const [i,n] of chart.notes.entries()){
  const track=chart.score.tracks.find(t=>t.name===n.voice);assert.ok(track.events.some(e=>Math.abs(e[0]-n.beat)<1e-6&&e[1]===n.pitch));
  assert.ok(n.beat>=0&&n.beat<song.beats);assert.ok(n.nextIntervalBeats>0);assert.equal(n.position[0],n.beat*48);
  if(i)assert.ok(n.beat-chart.notes[i-1].beat>=.5);
 }
 for(const rate of [.75,1,1.15]){const j=new Judge(chart.notes,0,song.beats,0,'challenge',rate,song.bpm);for(const n of chart.notes)assert.equal(j.press(n.beat*60/(song.bpm*rate)).kind,'perfect');assert.equal(j.stats().fullCombo,true);}
});
test('three new charts differ in duration, density and their actual interval sequences',()=>{
 const charts=SONGS.slice(1).map(s=>read(s.chart));assert.equal(new Set(charts.map(c=>c.durationBeats)).size,3);assert.equal(new Set(charts.map(c=>c.notes.length)).size,3);
 assert.equal(new Set(charts.map(c=>JSON.stringify(c.notes.map(n=>n.nextIntervalBeats)))).size,3);
});
test('longer song records stay isolated and original 117-note records still load',()=>{
 const stats={score:141000,accuracy:1,maxCombo:141,hits:141,total:141,fullCombo:true};const r=recordRun({best:{},badges:[]},stats,{expectedTotal:141});assert.ok(r.recorded);
 const storage={getItem:key=>key===songKey('bossa')?JSON.stringify(r.progress):null};assert.equal(readProgress(storage,songKey('bossa'),141).best.standard.score,141000);assert.deepEqual(readProgress(storage).best,{});assert.equal(songKey('echo'),'echo-records');
 assert.equal(recordRun(r.progress,stats,{expectedTotal:141,practice:true}).recorded,false);
});
test('master playback uses the audio clock and exact subsection offset; stop cancels source',()=>{
 const calls=[],param={setValueAtTime(){},exponentialRampToValueAtTime(){}};const source={connect(){},disconnect(){},start(...a){calls.push(a)},stop(){calls.push('stop')}};const ctx={createBufferSource:()=>source,createGain:()=>({gain:param,connect(){},disconnect(){}})};
 const m=Object.create(Music.prototype);m.ctx=ctx;m.nodes=[];m.musicBus={disconnect(){}};m.sfxBus={disconnect(){}};m.bus={disconnect(){}};
 m.prepareMaster({duration:110},10,48,96,112);assert.deepEqual(calls[0],[10,48*60/112,48*60/112]);m.stop();assert.equal(calls.at(-1),'stop');
});
test('score lookahead schedules bounded future audio, skips stale events and stops cleanly',()=>{
 const m=Object.create(Music.prototype),played=[];m.ctx={currentTime:10};m.voice=(...x)=>played.push(x);
 const score={bpm:120,tracks:[{kind:'lead',events:Array.from({length:100},(_,i)=>[i,60,.5,.5])}]};m.prepareScore(score,12,0,100,.75);assert.equal(played.length,0);
 m.ctx.currentTime=12;m.pump();assert.equal(played.length,1);assert.equal(played[0][2],12.001);
 m.ctx.currentTime=30;m.pump();assert.ok(played.length<4,'stall must not play all skipped notes as a burst');
});
