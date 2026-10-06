import test from 'node:test';import assert from 'node:assert/strict';import {createPadInput} from '../dist/touch-input.js';
const event=(time=1000,extra={})=>({pointerId:1,pointerType:'touch',timeStamp:time,button:0,buttons:1,isPrimary:true,preventDefault(){},...extra});
test('down-up-leave-click emits one immediate hit and preserves the original timestamp',()=>{
 const hits=[],p=createPadInput(t=>hits.push(t));p.down(event());assert.deepEqual(hits,[1000]);p.up(event(1020,{buttons:0}));p.leave(event(1021,{buttons:0}));p.click(event(1022,{detail:1}));p.click(event(1023,{detail:0,pointerType:''}));assert.deepEqual(hits,[1000]);
 p.down(event(1100));p.up(event(1120));assert.deepEqual(hits,[1000,1100]);
});
test('drag-out, cancellation, capture loss and stray releases cannot add ghost notes',()=>{
 const hits=[],p=createPadInput(t=>hits.push(t));p.up(event());p.leave(event());assert.equal(hits.length,0);
 p.down(event());p.leave(event(1010));p.cancel(event(1011));p.up(event(1012));p.click(event(1013,{detail:0,pointerType:''}));assert.deepEqual(hits,[1000]);
 p.down(event(1100));p.lostCapture(event(1101));p.up(event(1102));assert.deepEqual(hits,[1000,1100]);
});
test('multitouch, held-pointer duplicate downs and secondary buttons are ignored',()=>{
 const hits=[],p=createPadInput(t=>hits.push(t));p.down(event());p.down(event(1001));p.down(event(1002,{pointerId:2,isPrimary:false}));p.up(event(1003,{pointerId:2}));p.down(event(1004));assert.deepEqual(hits,[1000]);
 p.up(event(1005));p.down(event(1100,{button:2,pointerType:'mouse'}));assert.equal(hits.length,1);p.down(event(1200));assert.equal(hits.length,2);
});
test('keyboard and assistive clicks work without a pointer; reset releases stale contacts',()=>{
 const hits=[],p=createPadInput(t=>hits.push(t));p.click({detail:0,timeStamp:100});p.down(event());p.reset();p.down(event(1010));p.up(event(1020));p.click({detail:0,timeStamp:1600});assert.deepEqual(hits,[100,1000,1010,1600]);
});
