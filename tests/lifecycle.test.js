import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const elements=new Map(),listeners={},docListeners={};let frame,interval,audio,resolveResume,delayResume=false;
const drawing=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
function el(id){if(!elements.has(id))elements.set(id,{id,hidden:false,style:{},dataset:{},value:0,textContent:'',innerHTML:'home',clientWidth:1100,clientHeight:680,getContext:()=>drawing,blur(){},showModal(){this.open=true},close(){this.open=false}});return elements.get(id);}
class Param{value=0;setValueAtTime(){}exponentialRampToValueAtTime(){}}let live=0;
class Node{gain=new Param();frequency=new Param();stopped=false;connect(){}disconnect(){}start(){live++;}stop(t){if(t===undefined&&!this.stopped){live--;this.stopped=true;}}}
class Audio{currentTime=10;sampleRate=100;state='suspended';destination={};constructor(){audio=this;}resume(){if(delayResume)return new Promise(r=>{resolveResume=()=>{this.state='running';r()}});this.state='running';return Promise.resolve();}getOutputTimestamp(){return {contextTime:this.currentTime,performanceTime:performance.now()}}createGain(){return new Node()}createBuffer(_,n){return{getChannelData:()=>new Float32Array(n)}}createOscillator(){return new Node()}createBufferSource(){return new Node()}createBiquadFilter(){return new Node()}}
globalThis.document={getElementById:el,addEventListener:(k,f)=>docListeners[k]=f,activeElement:{blur(){}},hidden:false};globalThis.window={AudioContext:Audio,addEventListener:(k,f)=>listeners[k]=f};globalThis.devicePixelRatio=1;globalThis.localStorage={getItem:()=>0,setItem(){}};globalThis.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../dist/chart.json',import.meta.url)))});globalThis.requestAnimationFrame=f=>frame=f;globalThis.setInterval=f=>interval=f;
await import('../dist/app.js');
function key(code,repeat=false){let prevented=false;listeners.keydown({code,repeat,timeStamp:performance.now(),preventDefault(){prevented=true}});return prevented;}
const tick=t=>{audio.currentTime=t;frame();};
test('start, repeated key suppression, pause rollback, focus loss, retry reset, no-input ending',async()=>{await el('start').onclick();assert.equal(el('panel').hidden,true);assert.ok(live>0);tick(12.15);assert.equal(key('Space'),true);frame();assert.equal(el('combo').textContent,1);key('Space',true);frame();assert.equal(el('combo').textContent,1);tick(13.15);key('Escape');assert.match(el('panel').innerHTML,/已暂停/);assert.equal(live,0);await el('resume').onclick();assert.ok(live>0);tick(15.3);frame();assert.equal(el('combo').textContent,0);listeners.blur();assert.match(el('panel').innerHTML,/离开了窗口/);assert.equal(live,0);await el('again').onclick();tick(17.45);frame();assert.equal(el('score').textContent,'000000');tick(83);assert.match(el('panel').innerHTML,/练习结束/);assert.match(el('panel').innerHTML,/117/);assert.equal(live,0);assert.equal(key('Space'),false);});
test('late audio unlock and double start schedules a single song after promise resolves',async()=>{el('home').onclick();delayResume=true;let first=el('start').onclick();let second=el('start').onclick();assert.equal(live,0);audio.currentTime=90;resolveResume();await first;await second;assert.ok(live>0);tick(90);assert.equal(el('count').textContent,4);key('Escape');assert.equal(live,0);delayResume=false;});
test('audio interruption and visibility change pause without background completion',async()=>{await el('again').onclick();audio.state='suspended';interval();assert.match(el('panel').innerHTML,/声音中断/);assert.equal(live,0);await el('resume').onclick();document.hidden=true;docListeners.visibilitychange();assert.match(el('panel').innerHTML,/切换了页面/);assert.equal(live,0);document.hidden=false;});
test('calibration cancellation, manual +/- offset, reset and practice result',async()=>{el('home').onclick();el('offset').oninput({target:{value:60}});assert.equal(el('offsetLabel').textContent,'+60 ms');el('offset').oninput({target:{value:-55}});assert.equal(el('offsetLabel').textContent,'-55 ms');el('resetOffset').onclick();assert.equal(el('offsetLabel').textContent,'0 ms');await el('calibrate').onclick();key('Escape');assert.equal(live,0);await el('practice').onclick();tick(audio.currentTime+21);assert.match(el('panel').innerHTML,/32/);assert.match(el('panel').innerHTML,/练习结束/);assert.equal(el('section').textContent,'01 / 接上电');assert.equal(el('hud').hidden,true);});
test('pointer input settles once, ignores secondary touches and settings shortcuts',async()=>{
 el('home').onclick();await el('practice').onclick();const start=audio.currentTime+2.15;tick(start);
 const tap={timeStamp:performance.now(),button:0,isPrimary:true,preventDefault(){}};
 el('hitPad').onpointerdown(tap);el('hitPad').onclick({...tap,detail:1});frame();
 assert.equal(el('combo').textContent,1);assert.equal(el('score').textContent,'001000');assert.equal(el('feedback').dataset.kind,'perfect');assert.equal(el('timing').hidden,false);
 el('hitPad').onpointerdown({...tap,isPrimary:false});frame();assert.equal(el('combo').textContent,1);
 el('settings').onclick();assert.equal(live,0);assert.equal(el('hitPad').hidden,true);assert.equal(el('offsetDialog').open,true);
 assert.equal(key('KeyR'),false);assert.equal(live,0);assert.equal(key('Space'),false);
 el('offset').oninput({target:{value:60}});el('closeOffset').onclick();await el('resume').onclick();tick(audio.currentTime+2.21);key('Space');frame();assert.equal(el('combo').textContent,1);
 key('Escape');el('resetOffset').onclick();el('closeOffset').onclick();
});
test('milestone, miss feedback and retry clear transient state',async()=>{
 await el('again').onclick();const start=audio.currentTime+2.15;
 for(let i=0;i<16;i++){tick(start+i*.5);key('Space');}frame();assert.match(el('milestone').textContent,/16 连击/);assert.equal(el('combo').textContent,16);
 tick(start+8.25);assert.equal(el('feedback').dataset.kind,'miss');assert.equal(el('combo').textContent,0);
 key('Escape');await el('again').onclick();assert.equal(el('milestone').textContent,'');assert.equal(el('timing').hidden,true);assert.equal(el('feedback').dataset.kind,'');
 key('Escape');
});
test('volume and reduced motion preferences persist through new launches',async()=>{
 el('musicVolume').oninput({target:{value:35}});el('sfxVolume').oninput({target:{value:0}});el('reduceMotion').onchange({target:{checked:true}});
 assert.equal(el('musicValue').textContent,'35%');assert.equal(el('sfxValue').textContent,'0%');assert.equal(el('reduceMotion').checked,true);
 await el('again').onclick();frame();assert.equal(el('musicVolume').value,35);assert.equal(el('sfxVolume').value,0);key('Escape');assert.equal(live,0);
});
test('focus loss while audio unlock is pending cancels the scheduled launch',async()=>{
 el('home').onclick();delayResume=true;const pending=el('start').onclick();listeners.blur();resolveResume();await pending;delayResume=false;
 assert.equal(live,0);assert.equal(el('panel').hidden,false);assert.equal(el('hitPad').hidden,true);assert.equal(el('status').textContent,'ORIGINAL SOUNDTRACK · 120 BPM');
});
test('Enter preserves focused controls and settings cancel a pending audio unlock',async()=>{
 const event={code:'Enter',repeat:false,target:{closest:()=>({id:'mode-relaxed'})},preventDefault(){throw Error('Control activation intercepted')}};listeners.keydown(event);assert.equal(live,0);
 delayResume=true;const pending=el('start').onclick();el('settings').onclick();resolveResume();await pending;delayResume=false;
 assert.equal(live,0);assert.equal(el('offsetDialog').open,true);assert.equal(el('panel').hidden,false);el('closeOffset').onclick();
});
test('difficulty selection accepts catch hits and preserves the strict challenge window',async()=>{
 el('mode-standard').onclick();await el('practice').onclick();tick(audio.currentTime+2.295);key('KeyF');frame();assert.equal(el('feedback').dataset.kind,'catch');assert.equal(el('score').textContent,'000400');key('Escape');el('home').onclick();
 el('mode-challenge').onclick();await el('practice').onclick();tick(audio.currentTime+2.25);key('KeyJ');frame();assert.equal(el('feedback').dataset.kind,'stray');assert.equal(el('score').textContent,'000000');key('Escape');el('home').onclick();
 el('mode-relaxed').onclick();await el('practice').onclick();tick(audio.currentTime+2.32);key('Space');frame();assert.equal(el('feedback').dataset.kind,'catch');assert.equal(el('score').textContent,'000400');key('Escape');el('home').onclick();el('mode-standard').onclick();
});
test('a legal challenge timestamp remains valid when a render frame processed first',async()=>{
 el('mode-challenge').onclick();await el('practice').onclick();const start=audio.currentTime+2.15;tick(start+.100);
 listeners.keydown({code:'Space',repeat:false,timeStamp:performance.now()-12,preventDefault(){}});frame();assert.equal(el('score').textContent,'000700');assert.equal(el('feedback').dataset.kind,'good');key('Escape');el('home').onclick();el('mode-standard').onclick();
});
test('section practice starts in its own chapter and blocks shortcuts while choosing a segment',async()=>{
 el('practiceAll').onclick();assert.equal(el('practiceDialog').open,true);assert.equal(key('Enter'),false);
 await el('sectionPractice2').onclick();assert.equal(el('practiceDialog').open,false);tick(audio.currentTime+3);assert.equal(el('section').textContent,'03 / 回声');assert.match(el('runMode').textContent,/暖身/);key('Escape');el('home').onclick();
});
test('slow section practice aligns countdown, input, pause, retry and return to full speed',async()=>{
 el('practiceRate').value='.75';await el('sectionPractice2').onclick();const start=audio.currentTime+.15+4/1.5;
 tick(start);key('Space');frame();assert.equal(el('score').textContent,'001000');assert.match(el('runMode').textContent,/75% · 90 BPM/);assert.match(el('time').textContent,/21 秒/);
 tick(start+1);key('Escape');await el('resume').onclick();tick(audio.currentTime+.15+4/1.5);key('Space');frame();assert.equal(el('score').textContent,'001000');
 key('KeyR');await Promise.resolve();assert.match(el('runMode').textContent,/75%/);tick(audio.currentTime+.15+4/1.5);frame();assert.equal(el('score').textContent,'000000');assert.match(el('section').textContent,/03/);
 tick(audio.currentTime+24);assert.match(el('panel').innerHTML,/75% · 90 BPM/);assert.match(el('panel').innerHTML,/不计入整曲最佳/);
 el('home').onclick();await el('start').onclick();tick(audio.currentTime+2.15);key('Space');frame();assert.equal(el('score').textContent,'001000');assert.doesNotMatch(el('runMode').textContent,/75%/);key('Escape');el('home').onclick();el('practiceRate').value='1';
});
test('phrase result focuses four bars and repeated retry keeps its range',async()=>{
 await el('start').onclick();tick(audio.currentTime+69);assert.match(el('panel').innerHTML,/第 1–4 小节/);assert.match(el('panel').innerHTML,/乐句回放/);
 await el('phrase3').onclick();tick(audio.currentTime+2.2);assert.match(el('time').textContent,/8 秒/);key('KeyR');await Promise.resolve();tick(audio.currentTime+2.2);assert.match(el('time').textContent,/8 秒/);
 tick(audio.currentTime+10);assert.match(el('panel').innerHTML,/第 13–16 小节/);assert.match(el('panel').innerHTML,/不计入整曲最佳/);el('home').onclick();
});
