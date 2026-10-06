import test from 'node:test';import assert from 'node:assert/strict';import {runContextLabel,recordExplanation,recordRun} from '../dist/progress.js';
test('run context distinguishes partial, speed and resumed practice without changing rules',()=>{
 assert.equal(runContextLabel(), '完整演奏');assert.equal(runContextLabel({practice:true}),'分段练习');assert.equal(runContextLabel({practice:true,rate:.75}),'变速练习');assert.equal(runContextLabel({practice:true,rate:.75,resumed:true}),'中断恢复');
});
test('practice results explain unchanged best records and saved eligible achievements',()=>{
 const stats={total:117,hits:16,score:16000,accuracy:16/117,maxCombo:16,fullCombo:false};
 const result=recordRun({best:{},badges:[]},stats,{resumed:true});assert.equal(result.recorded,false);assert.deepEqual(result.progress.best,{});assert.deepEqual(result.fresh.map(x=>x.id),['combo16']);
 const text=recordExplanation({resumed:true,fresh:result.fresh});assert.match(text,/分数、精准率、最长连击不计入整曲最佳/);assert.match(text,/新解锁的成就已保存/);
 assert.match(recordExplanation({practice:true}),/既有最佳与成就保留/);assert.match(recordExplanation({practice:true,rate:.75}),/变速练习/);
});
test('storage failures cannot be described as newly persisted bests or achievements',()=>{
 const text=recordExplanation({recorded:true,saved:false});assert.match(text,/本地保存失败/);assert.doesNotMatch(text,/已按当前曲目/);
 assert.match(recordExplanation({recorded:true}),/已按当前曲目/);assert.match(recordExplanation({recorded:false}),/没有命中/);
});
