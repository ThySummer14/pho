import test from 'node:test';import assert from 'node:assert/strict';
import {INK,inkBackdrop,inkEffects} from '../dist/ink.js';import {Scene} from '../dist/scene.js';import {SONGS} from '../dist/songs.js';
function canvas(){const calls=[],g={};for(const n of ['save','restore','beginPath','moveTo','lineTo','closePath','fill','stroke','fillRect','arc'])g[n]=(...a)=>calls.push([n,...a]);for(const n of ['createRadialGradient','createLinearGradient'])g[n]=(...a)=>{calls.push([n,...a]);return {kind:n,addColorStop:(...b)=>calls.push(['stop',...b])}};for(const n of ['strokeStyle','fillStyle','lineWidth','globalAlpha'])Object.defineProperty(g,n,{get(){return '#28594c'},set:v=>calls.push([n,typeof v==='object'?v.kind:v])});return {g,calls};}
const lum=hex=>{const a=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
test('ink theme belongs only to the garden track; foreground colours contrast against paper',()=>{
 assert.deepEqual(SONGS.filter(s=>s.art==='ink').map(s=>s.id),['bossa']);
 for(const key of ['text','accent','muted','perfect','catch','miss']){const ratio=(lum(INK.paper)+.05)/(lum(INK[key])+.05);assert.ok(ratio>=4.5,`${key}: ${ratio}`);}
});
test('ink garden is bounded, finite and balanced at phone and landscape sizes',()=>{
 for(const [w,h] of [[360,505],[390,844],[430,800],[844,362]]){const {g,calls}=canvas();assert.equal(inkBackdrop(g,w,h,70,15000,{home:false}),INK.accent);assert.ok(calls.length<370,'decorative command count must stay bounded');for(const c of calls)for(const x of c.slice(1))if(typeof x==='number')assert.ok(Number.isFinite(x));assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);}
});
test('reduced-motion ink scenery is identical across elapsed time',()=>{
 const a=canvas(),b=canvas();inkBackdrop(a.g,390,700,20,1000,{reduced:true});inkBackdrop(b.g,390,700,20,30000,{reduced:true});assert.deepEqual(a.calls,b.calls);
});
test('pigment feedback is local, bounded, temporary, and keeps the input geometry unchanged',()=>{
 const scene=new Scene();scene.art='ink';const pos=[12,19];for(let i=0;i<100;i++)scene.hit({id:i,kind:'perfect'},pos,1000,i);assert.equal(scene.effects.length,24);
 const {g,calls}=canvas();scene.renderEffects(g,n=>n.position,1100);assert.deepEqual(pos,[12,19]);assert.ok(calls.length<1300);assert.ok(!calls.some(c=>['translate','rotate'].includes(c[0])));for(const c of calls)for(const x of c.slice(1))if(typeof x==='number')assert.ok(Number.isFinite(x));
 const a=canvas(),b=canvas();inkEffects(a.g,[{id:1,kind:'good',position:pos,time:1000}],n=>n.position,1100,true);inkEffects(b.g,[{id:1,kind:'good',position:pos,time:1000}],n=>n.position,1300,true);
 const geometry=x=>x.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0]));assert.deepEqual(geometry(a),geometry(b));scene.renderEffects(g,n=>n.position,2000);assert.equal(scene.effects.length,0);
});
