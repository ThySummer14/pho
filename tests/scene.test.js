import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,themes} from '../dist/scene.js';

// Canvas spy checks geometry and draw choices, without depending on pixel rendering.
function canvas(){
 const calls=[],g={};let gradientId=0;
 for(const name of ['save','restore','beginPath','moveTo','lineTo','closePath','fill','stroke','fillRect','arc','translate','rotate'])g[name]=(...args)=>calls.push([name,...args]);
 for(const name of ['createLinearGradient','createRadialGradient'])g[name]=(...args)=>{
  const id=gradientId++;calls.push([name,id,...args]);
  return {id,addColorStop:(...stop)=>calls.push(['addColorStop',id,...stop])};
 };
 for(const name of ['fillStyle','strokeStyle','lineWidth','globalAlpha'])Object.defineProperty(g,name,{set:value=>calls.push([name,typeof value==='object'?value.id:value])});
 g.fillText=()=>assert.fail('Scenery must not introduce UI text');
 return {g,calls};
}

test('all four city scenes render finite geometry and restore canvas state on narrow and wide screens',()=>{
 const scene=new Scene();
 for(const [w,h] of [[360,720],[1440,820]])for(let i=0;i<4;i++){
  const {g,calls}=canvas(),accent=scene.backdrop(g,w,h,i*32+8,12000,true);
  assert.equal(accent,`rgba(${themes[i].color.join(',')},1)`);
  for(const call of calls)for(const value of call.slice(1))if(typeof value==='number')assert.ok(Number.isFinite(value));
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
  assert.ok(calls.filter(c=>c[0]==='fillRect').length>70,'City should include layered buildings and windows');
 }
});

test('reduced motion holds city geometry steady while chapter palette still transitions continuously',()=>{
 const scene=new Scene();scene.reduced=true;
 const a=canvas(),b=canvas();scene.backdrop(a.g,1280,720,44,1000);scene.backdrop(b.g,1280,720,44,19000);
 assert.deepEqual(a.calls,b.calls);
 for(const boundary of [32,64,96])assert.deepEqual(scene.palette(boundary-.001),scene.palette(boundary));
 assert.deepEqual(scene.palette(-10),scene.palette(0));assert.deepEqual(scene.palette(NaN),scene.palette(0));
 assert.deepEqual(scene.palette(10000).color,themes[3].color);
});

test('successful effects stay centered on chart geometry, with restrained catch feedback and no miss particles',()=>{
 const scene=new Scene(),position=Object.freeze([20,40]);
 const draw=kind=>{
  scene.clear();scene.hit({kind},position,1000,16);const spy=canvas();
  scene.renderEffects(spy.g,n=>{assert.equal(n.position,position);return [144,200];},1010);return spy.calls;
 };
 for(const kind of ['perfect','good','catch']){
  const calls=draw(kind),rings=calls.filter(c=>c[0]==='arc');
  assert.equal(rings.length,3);assert.ok(rings.every(c=>c[1]===144&&c[2]===200));
  assert.equal(calls.filter(c=>c[0]==='translate').length,kind==='perfect'?8:kind==='good'?4:2);
 }
 for(const kind of ['miss','stray']){
  const calls=draw(kind);assert.equal(calls.filter(c=>['arc','translate','fillRect'].includes(c[0])).length,0);
  assert.ok(calls.filter(c=>c[0]==='globalAlpha').every(c=>c[1]<=.34));
 }
});

test('reduced impacts omit rays and particles, and every feedback grade releases at its own lifetime',()=>{
 const scene=new Scene();scene.reduced=true;
 scene.hit({kind:'perfect'},[0,0],1000);const spy=canvas();scene.renderEffects(spy.g,()=>[144,200],1100);
 assert.equal(spy.calls.filter(c=>c[0]==='translate'||c[0]==='lineTo').length,0);
 assert.deepEqual(spy.calls.filter(c=>c[0]==='arc').map(c=>c[3]),[12,18]);
 for(const [kind,life] of [['miss',260],['catch',420],['good',620],['perfect',620]]){
  scene.clear();scene.hit({kind},[0,0],1000);scene.renderEffects(canvas().g,()=>[144,200],1000+life);
  assert.equal(scene.effects.length,0);
 }
});
