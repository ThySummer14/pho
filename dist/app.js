import {audioTime,inputTime} from './audio-clock.js';
import {resizeCanvas} from './canvas-size.js';
import {INK} from './ink.js?v=20261006-ink2';
import {createPadInput} from './touch-input.js';
import {upcomingCue} from './anticipation.js';
import {SONGS,songKey,sectionSize} from './songs.js?v=20261006-ink1';
import {Judge,pointAt,calibration,PROFILES} from './engine.js';
import {phraseReport,timingSummary,coachingText} from './coaching.js';
import {Music} from './music.js';
import {Scene,themes} from './scene.js?v=20261006-ink2';
import {BADGES,readProgress,recordRun,runContextLabel,recordExplanation} from './progress.js?v=20261006-status2';
const $=id=>document.getElementById(id),canvas=$('track'),g=canvas.getContext('2d'),scene=new Scene();
let chart=await fetch('./chart.json').then(r=>{if(!r.ok)throw Error('谱面加载失败');return r.json()});
let song=SONGS[0],sections=song.chapters;
const chartCache=new Map([['echo',chart]]),audioCache=new Map();
const tips=['跟着清亮主音，把光接上','长间隔，等一等再敲','靠近的两颗，轻轻嗒嗒','接成完整的一条光'];
let state='home',ctx,music,judge,epoch=0,startBeat=0,endBeat=128,runStart=0,token=0,usedResume=false,offset=0,mode='standard',rate=1,loadingPurpose=null;
let lastFeedback=-Infinity,feedbackText='',pausedBeat=0,calValues=[],calTaken=new Set(),lastSection=-1,practice=false,eventCursor=0,milestoneAt=-Infinity,padAt=-Infinity;
let progress;try{progress=readProgress(localStorage);}catch{progress={best:{},badges:[]};}
const prefs={music:.75,sfx:.8,timbre:'crisp',visualOffset:0,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false};
try{
 offset=Math.max(-200,Math.min(200,Number(localStorage.getItem('echo-offset'))||0));
 const saved=JSON.parse(localStorage.getItem('echo-feel')||'null');
 if(saved){for(const k of ['music','sfx'])if(Number.isFinite(saved[k]))prefs[k]=Math.max(0,Math.min(1,saved[k]));if(typeof saved.reduced==='boolean')prefs.reduced=saved.reduced;if(['crisp','warm'].includes(saved.timbre))prefs.timbre=saved.timbre;if(Number.isFinite(saved.visualOffset))prefs.visualOffset=Math.max(-100,Math.min(100,saved.visualOffset));if(PROFILES[saved.mode])mode=saved.mode;}
}catch{}
const signed=v=>`${v>0?'+':''}${v} ms`;
function savePrefs(){try{localStorage.setItem('echo-feel',JSON.stringify({...prefs,mode}));}catch{}}
function syncPrefs(){
 scene.reduced=prefs.reduced;$('game').dataset.reduced=String(prefs.reduced);$('reduceMotion').checked=prefs.reduced;
 $('musicVolume').value=prefs.music*100;$('sfxVolume').value=prefs.sfx*100;$('timbre').value=prefs.timbre;
 $('musicValue').textContent=`${Math.round(prefs.music*100)}%`;$('sfxValue').textContent=`${Math.round(prefs.sfx*100)}%`;
 $('visualOffset').value=prefs.visualOffset;$('visualValue').textContent=signed(prefs.visualOffset);
 music?.setLevels(prefs.music,prefs.sfx);music?.setTimbre(prefs.timbre);
}
function setOffset(v){offset=Math.round(v/5)*5;$('offset').value=offset;$('offsetLabel').textContent=$('offsetValue').textContent=signed(offset);try{localStorage.setItem('echo-offset',offset);}catch{}}
setOffset(offset);syncPrefs();
function audioNow(perf=performance.now()){const now=performance.now();return audioTime(ctx,perf,now);}
function songNow(perf){return audioNow(perf)-epoch;}
const beatSeconds=beat=>beat*60/(chart.bpm*rate);
const songBeat=t=>t*chart.bpm*rate/60;
const tempoLabel=()=>`${Math.round(rate*100)}% · ${Math.round(chart.bpm*rate)} BPM`;
function selectedRate(){const value=Number($('practiceRate').value);return [.75,.85,1,1.15].includes(value)?value:1;}
function retry(){return launch(runStart,endBeat,false,rate);}
function setView(view){$('game').dataset.view=view;if(view==='loading')$('pause').textContent='取消加载';else if(view==='playing')$('pause').innerHTML='暂停 <kbd>Esc</kbd>';else if(view==='calibrating')$('pause').innerHTML='取消校准 <kbd>Esc</kbd>'; if(view==='calibrating')$('playHelp').innerHTML='<span>先听四拍，再跟着短音自然敲击</span><small>SPACE / F / J · Esc 取消</small>';else if(view==='playing')$('playHelp').innerHTML='<span>空心节点与中心光点重合时敲击</span><small>SPACE / F / J · Esc 暂停 · R 重开</small>';}
function showAudioLoading(message){
 setView('loading');clearFeedback();$('count').textContent=message;$('panel').hidden=true;$('hud').hidden=true;$('hitPad').hidden=true;$('nextCue').hidden=true;$('playHelp').hidden=true;$('pause').hidden=false;
}
function stop(){if(music){music.stop();music=null;}}
function error(e){$('error').hidden=false;$('error').textContent='音乐未能加载或启动，请再点一次开始。'+e.message;}
function clearFeedback(){padInput.reset();scene.clear();eventCursor=judge?.events.length||0;lastFeedback=milestoneAt=padAt=-Infinity;$('milestone').textContent='';$('timing').hidden=true;$('hitPad').dataset.pressed='false';$('feedback').dataset.kind='';}
function setSection(sec){$('sceneLabel').textContent=song.id==='echo'?themes[sec].place:`${song.title} / ${sections[sec]}`;for(let i=0;i<4;i++)$('chapter'+i).className=i===sec?'current':'';}
function refreshHome(){
 for(const id of Object.keys(PROFILES)){const button=$('mode-'+id);if(button){button.className=id===mode?'selected':'';button.setAttribute?.('aria-pressed',String(id===mode));}}
 const p=PROFILES[mode];if($('modeDescription'))$('modeDescription').textContent=`精准 ±${Math.round(p.perfect*1000)} ms · 命中 ±${Math.round(p.good*1000)} ms${p.window>p.good?` · 接住 ±${Math.round(p.window*1000)} ms`:''}`;
 const best=progress.best[mode];if($('homeBest'))$('homeBest').textContent=best?`${best.rank} / ${best.score.toLocaleString()}`:'尚未演奏';if($('badgeCount'))$('badgeCount').textContent=`${progress.badges.length} / ${BADGES.length}`;
}
function chooseMode(next){if(!PROFILES[next])return;mode=next;savePrefs();refreshHome();}
async function launch(from=0,to=chart.durationBeats,resume=false,speed=1){
 if(state==='loading')return;const own=++token;state='loading';loadingPurpose='audio';$('error').hidden=true;stop();showAudioLoading('加载音乐…');
 try{
  ctx??=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});await ctx.resume();if(own!==token)return;
  if(ctx.state!=='running')throw Error('浏览器仍暂停声音。');
  rate=resume?rate:([.75,.85,1,1.15].includes(speed)?speed:1);
  let master=null;
  if(song.audio&&rate===1){
   master=audioCache.get(song.id);
   if(!master){const response=await fetch('./'+song.audio);if(!response.ok)throw Error('原版音乐加载失败');master=await ctx.decodeAudioData(await response.arrayBuffer());if(own!==token)return;if(!Number.isFinite(master.duration)||master.duration<chart.durationBeats*60/chart.bpm-.05)throw Error('音频长度与谱面不符');audioCache.clear();audioCache.set(song.id,master);}
  }
  if(own!==token)return;
  music=new Music(ctx,prefs);startBeat=from;endBeat=to;
  if(!resume){runStart=from;practice=from!==0||to!==chart.durationBeats||rate!==1;judge=new Judge(chart.notes,from,to,offset/1000,mode,rate,chart.bpm);usedResume=false;}
  else{judge.rollback(from);usedResume=true;}
  clearFeedback();epoch=ctx.currentTime+.15+beatSeconds(4)-beatSeconds(from);
  for(let i=4;i>0;i--)music.click(epoch+beatSeconds(from-i),i===1);
  if(master)music.prepareMaster(master,epoch+beatSeconds(from),from,to,chart.bpm,to===chart.durationBeats);else if(chart.score)music.prepareScore(chart.score,epoch+beatSeconds(from),from,to,rate);else music.schedule(chart.notes,epoch+beatSeconds(from),from,to,rate);lastSection=-1;state='playing';setView('playing');
  $('hud').hidden=false;$('hitPad').hidden=false;$('pause').hidden=false;$('nextCue').hidden=false;$('playHelp').hidden=false;
  const band=judge.profile.perfect/judge.profile.window*50;$('perfectBand').style.left=`${50-band}%`;$('perfectBand').style.right=`${50-band}%`;
  $('runMode').textContent=`${PROFILES[mode].label}判定${practice?` / ${usedResume?'恢复':rate!==1?'变速':'暖身'} ${tempoLabel()}`:usedResume?' / 中断恢复':''}${song.audio?(master?' / REAPER 原版':' / 练习合成版'):''}`;$('status').textContent=`${usedResume||practice?runContextLabel({practice,resumed:usedResume,rate})+' · ':''}${practice?`SECTION PRACTICE · ${tempoLabel()}`:`${PROFILES[mode].label} · ${chart.bpm} BPM`}`;
  $('hint').textContent=song.hint+(song.audio&&rate!==1?' · 变速使用练习合成版，原速播放 REAPER 原版':'');document.activeElement?.blur();
 }catch(e){if(own===token){stop();showHome();error(e);}}
}
function feedback(r){
 const now=performance.now(),note=chart.notes.find(n=>n.id===r.id);
 const labels={stray:'空拍 · 等下一颗',miss:'漏拍 · 继续接',perfect:'PERFECT',good:'GOOD',catch:'接住了'};
 feedbackText=labels[r.kind]||'';lastFeedback=now;$('feedback').dataset.kind=r.kind;$('feedback').textContent=feedbackText;
 const hit=['perfect','good','catch'].includes(r.kind);$('timing').hidden=!hit;
 if(hit)$('timingMarker').style.left=`${Math.max(0,Math.min(100,50+r.error/judge.profile.window*50))}%`;
 scene.hit(r,note?.position||pointAt(chart.notes,chart.terminal,songBeat(songNow())),now,r.combo);
 music?.feedback(r.kind,note,r.combo);
 if(hit&&r.combo>0&&r.combo%16===0){$('milestone').textContent=`${r.combo} 连击 / KEEP THE ECHO`;milestoneAt=now;}
}
function consumeEvents(){const events=judge.events.slice(eventCursor);eventCursor=judge.events.length;for(const r of events)feedback(r);}
function showPanel(markup){$('panel').className='panel';$('panel').hidden=false;$('panel').innerHTML=markup;$('hitPad').hidden=true;$('nextCue').hidden=true;$('playHelp').hidden=true;}
function pause(reason='已暂停'){
 if(state==='loading'){showHome();return;}
 if(!['playing','calibrating'].includes(state))return;
 if(state==='calibrating'){showHome();return;}
 const t=songNow();pausedBeat=Math.max(runStart,Math.min(endBeat-4,Math.floor(Math.max(startBeat,songBeat(t))/4)*4));token++;stop();state='paused';setView('paused');clearFeedback();$('count').textContent='';$('pause').hidden=true;$('hud').hidden=true;
 showPanel(`<p class="edition">TAKE A BREATH</p><h2>${reason}</h2><p class="intro">从本小节开头重新接入，倒数四拍。<br>本小节成绩回滚，本次标为练习恢复。</p><div class="actions"><button class="primary" id="resume">继续演奏 ↗</button><button id="again">重练本次范围</button></div><button class="textbutton" id="segment">练当前段 · ${Math.round(beatSeconds(sectionSize(song)))} 秒</button><br><button class="textbutton" id="home">返回选曲</button>`);
 $('resume').onclick=()=>launch(pausedBeat,endBeat,true);$('again').onclick=retry;$('segment').onclick=()=>{const b=Math.floor(pausedBeat/sectionSize(song))*sectionSize(song);launch(b,b+sectionSize(song),false,rate)};$('home').onclick=showHome;
}
function finish(){
 judge.expire(beatSeconds(endBeat)+.5);stop();state='result';setView('result');$('hud').hidden=true;$('count').textContent='';$('milestone').textContent='';$('pause').hidden=true;
 const s=judge.stats(),report=phraseReport(judge.notes,judge.results,judge.events,runStart,endBeat),weak=report.weakest;
 const timing=timingSummary(judge.results),mean=timing.mean===null?null:Math.round(timing.mean);
 const phraseName=p=>`第 ${p.start/4+1}–${p.end/4} 小节`;
 const phraseMarkup=`<details class="coaching" open><summary>乐句回放 / 点一段集中练习</summary><p>${coachingText(timing,s)}</p><div class="phrase-grid">${report.phrases.map((p,i)=>`<button id="phrase${i}" class="phrase-button ${p===weak?'weakest':''}" aria-label="练习${phraseName(p)}，精准率 ${Math.round(p.accuracy*100)}%，漏拍 ${p.misses}，空拍 ${p.strays}"><b>${p.start/4+1}–${p.end/4}</b><span>${Math.round(p.accuracy*100)}%</span><i style="width:${Math.round(p.accuracy*100)}%"></i><small>漏 ${p.misses} · 空 ${p.strays}</small></button>`).join('')}</div><small>数字为小节编号 · 描边为推荐练习句${timing.count>=8?` · 误差标准差 ${Math.round(timing.spread)} ms（${timing.count} 次命中）`:''}</small></details>`;
 const outcome=recordRun(progress,s,{mode,practice,resumed:usedResume,expectedTotal:chart.notes.length});progress=outcome.progress;let saved=true;try{localStorage.setItem(songKey(song.id),JSON.stringify(progress));}catch{saved=false;}
 const recordNote=recordExplanation({practice,resumed:usedResume,rate,recorded:outcome.recorded,fresh:outcome.fresh,saved});
 const title=s.hits===0?'练习结束':s.fullCombo?'FULL COMBO':'演奏完成';
 showPanel(`<p class="edition">${PROFILES[mode].label} / ${practice?`SECTION PRACTICE · ${tempoLabel()}`:song.title}${song.audio&&rate!==1?' / 练习合成版':''}${usedResume?' / 练习恢复':''}</p><h2>${title}</h2><div class="result-rank ${s.fullCombo?'full':''}">${outcome.rank}</div><div class="result-sub">${s.hits} / ${s.total} 接亮 · 精准率 ${(s.accuracy*100).toFixed(1)}%</div><div class="result-score">${s.score.toLocaleString()}</div>${outcome.newBest?`<p class="new-record">NEW BEST / 新纪录${outcome.improvement&&outcome.improvement!==s.score?` +${outcome.improvement.toLocaleString()}`:''}</p>`:''}<div class="results"><div><b>${s.perfect}</b><span>精准</span></div><div><b>${s.good}</b><span>命中</span></div><div><b>${s.caught}</b><span>接住</span></div><div><b class="result-miss">${s.miss}</b><span>漏拍</span></div><div><b>${s.maxCombo}</b><span>最长连击</span></div></div><p class="result-detail">空击 ${s.strays}${mean===null?'':` · 命中平均${mean<0?'提前':'延后'} ${Math.abs(mean)} ms`}<br>${recordNote}</p>${outcome.fresh.length?`<p class="result-badges">解锁成就 / ${outcome.fresh.map(b=>b.title).join(' · ')}</p>`:''}${phraseMarkup}<div class="actions"><button class="primary" id="again">再来一次 ↗</button><button id="weak">练${phraseName(weak)} · ${Math.round(beatSeconds(weak.end-weak.start))} 秒</button></div><button id="home" class="textbutton">返回选曲</button>`);
 $('again').onclick=retry;$('weak').onclick=()=>launch(weak.start,weak.end,false,rate);for(const [i,p] of report.phrases.entries())$('phrase'+i).onclick=()=>launch(p.start,p.end,false,rate);$('home').onclick=showHome;$('hint').textContent=s.hits?'这一遍的回声，已留下。':'先试 16 秒暖身，跟着主音敲几下。';
}
const initialPanel=$('panel').innerHTML;
function showAchievements(){
 $('badgeList').innerHTML=BADGES.map(b=>`<div class="badge-row ${progress.badges.includes(b.id)?'unlocked':''}"><span class="badge-icon">${progress.badges.includes(b.id)?'◈':'◇'}</span><div><b>${b.title}</b><p>${b.detail}</p></div></div>`).join('');$('achievementDialog').showModal();
}
function bindHome(){
 $('start').disabled=false;$('practice').disabled=false;$('start').onclick=()=>launch();$('practice').onclick=()=>launch(0,Math.min(32,chart.durationBeats));$('calibrate').onclick=startCalibration;
 for(const id of Object.keys(PROFILES))if($('mode-'+id))$('mode-'+id).onclick=()=>chooseMode(id);
 for(const entry of SONGS)$('song-'+entry.id).onclick=()=>selectSong(entry.id);
 if($('achievements'))$('achievements').onclick=showAchievements;if($('practiceAll'))$('practiceAll').onclick=()=>$('practiceDialog').showModal();refreshHome();refreshSong();
}
function refreshSong(){
 $('songTitle').textContent=song.title;$('songMeta').textContent=`${song.style} · ${song.bpm} BPM · ${Math.round(song.beats*60/song.bpm)} SEC`;
 $('songGuide').textContent=song.hint;$('practice').textContent=`${Math.round(32*60/song.bpm)} 秒暖身`;
 for(const entry of SONGS)$('song-'+entry.id).setAttribute?.('aria-pressed',String(entry.id===song.id));
 for(let i=0;i<4;i++){
  $('chapter'+i).innerHTML=`0${i+1} <b>${sections[i]}</b>`;
  $('sectionPractice'+i).innerHTML=`<b>0${i+1} / ${sections[i]}</b><span>${Math.round(sectionSize(song)*60/song.bpm)} 秒（原速） · 第 ${i*sectionSize(song)/4+1}–${(i+1)*sectionSize(song)/4} 小节</span>`;
 }
 $('section').textContent=song.title;$('time').textContent=`${Math.round(song.beats*60/song.bpm)} 秒 / ${chart.notes.length} 个节点`;
 $('status').textContent=song.id==='echo'?'ORIGINAL SOUNDTRACK · 120 BPM':`${song.style} · ${song.bpm} BPM`;
 scene.colors=song.colors;scene.flavor=song.id;scene.art=song.art||'neon';$('game').dataset.art=scene.art;$('hint').textContent=song.hint;
}
async function selectSong(id){
 if(state!=='home'&&!(state==='loading'&&loadingPurpose==='song'))return;const next=SONGS.find(s=>s.id===id);if(!next)return;if(next===song){if(state==='loading')showHome();return;}
 const own=++token;state='loading';loadingPurpose='song';$('error').hidden=true;$('start').disabled=true;$('practice').disabled=true;$('songGuide').textContent=`正在加载《${next.title}》…`;
 try{
  const loaded=chartCache.get(id)||await fetch('./'+next.chart).then(r=>{if(!r.ok)throw Error('乐谱加载失败');return r.json()});
  if(own!==token)return;chartCache.set(id,loaded);chart=loaded;song=next;sections=song.chapters;
  try{progress=readProgress(localStorage,songKey(id),chart.notes.length);}catch{progress={best:{},badges:[]};}showHome();
 }catch(e){if(own===token){showHome();$('error').hidden=false;$('error').textContent='乐谱暂时无法加载，请重试。'+e.message;}}
}
function showHome(){token++;stop();state='home';loadingPurpose=null;setView('home');clearFeedback();$('panel').className='panel home-panel';$('panel').innerHTML=initialPanel;$('panel').hidden=false;$('hud').hidden=true;$('hitPad').hidden=true;$('pause').hidden=true;$('nextCue').hidden=true;$('playHelp').hidden=true;$('count').textContent='';$('section').textContent='一路接亮';$('time').textContent='64 秒 / 117 个节点';$('status').textContent='ORIGINAL SOUNDTRACK · 120 BPM';$('hint').textContent='空格，或点击打击区 · 跟随清亮主音';$('progress').style.width='0%';setSection(0);bindHome();}
async function startCalibration(){
 if(state==='loading')return;const own=++token;state='loading';loadingPurpose='audio';stop();showAudioLoading('准备声音校准…');
 try{ctx??=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});await ctx.resume();if(own!==token)return;music=new Music(ctx,prefs);rate=1;epoch=ctx.currentTime+.2;calValues=[];calTaken=new Set();clearFeedback();for(let i=0;i<20;i++)music.click(epoch+i*.5,i%4===0);state='calibrating';setView('calibrating');$('panel').hidden=true;$('hud').hidden=true;$('hitPad').hidden=false;$('pause').hidden=false;$('nextCue').hidden=true;$('playHelp').hidden=false;$('section').textContent='先听四拍，再跟着按 16 次';$('time').textContent='20 拍 / 10 秒';$('hint').textContent='自然跟拍，不必追光点 · Esc 取消';document.activeElement?.blur();}catch(e){showHome();error(e);}
}
function finishCalibration(){
 stop();state='calresult';setView('calresult');$('pause').hidden=true;$('count').textContent='';const result=calibration(calValues),stable=result?.stable;
 showPanel(`<p class="edition">FIND YOUR TIMING</p><h2>${stable?'找到你的拍点':'放松一点，再试一次'}</h2><p class="intro">${stable?`建议偏移 ${signed(result.offset)}<br>有效敲击 ${calValues.length}/16 · 偏差分散 ${result.spread} ms`:'有效敲击不足或偏差较大，暂不改变偏移。<br>先听四拍，再自然跟拍。'}</p><div class="actions">${stable?'<button class="primary" id="apply">采用并返回</button>':''}<button id="recal">重新校准</button><button id="home">返回选曲</button></div>`);
 if(stable)$('apply').onclick=()=>{setOffset(result.offset);showHome();};$('recal').onclick=startCalibration;$('home').onclick=showHome;
}
const modalOpen=()=>$('offsetDialog').open||$('achievementDialog').open||$('practiceDialog').open;
function press(timeStamp){
 if(modalOpen()||!['playing','calibrating'].includes(state))return;
 const perf=inputTime(timeStamp,performance.now(),performance.timeOrigin),t=songNow(perf);
 if(state==='calibrating'){padAt=performance.now();music?.tap();const i=Math.round(t/.5);if(i>=4&&i<20&&!calTaken.has(i)&&Math.abs(t-i*.5)<=.25){calTaken.add(i);calValues.push(t-i*.5);$('count').textContent=`${calTaken.size} / 16`;}return;}
 if(t<beatSeconds(startBeat)-judge.profile.window+offset/1000||t>beatSeconds(endBeat)+judge.profile.window+offset/1000)return;
 padAt=performance.now();music?.tap();
 const result=judge.press(t);if(result.kind==='ignored')return;
 consumeEvents();
}
window.addEventListener('keydown',e=>{
 if(modalOpen())return;
 // Preserve native keyboard activation/editing of focused controls. The hit pad
 // remains a rhythm input; other controls must never create an accidental note.
 if(e.target?.closest?.('button,a,input,select,textarea,[contenteditable="true"]')&&e.target?.id!=='hitPad'&&e.code!=='Escape')return;
 if(e.code==='Enter'&&state==='home'&&!e.repeat){if(e.target?.closest?.('button,a,input,select'))return;e.preventDefault();launch();return;}
 if(e.code==='Escape'&&['playing','calibrating','loading'].includes(state)){e.preventDefault();pause();return;}
 if(e.code==='KeyR'&&['playing','paused','result'].includes(state)&&!e.repeat){e.preventDefault();retry();return;}
 if(!['Space','KeyF','KeyJ'].includes(e.code)||!['playing','calibrating'].includes(state))return;e.preventDefault();if(!e.repeat)press(e.timeStamp);
});
const padInput=createPadInput(press);
$('hitPad').onpointerdown=padInput.down;$('hitPad').onpointerup=padInput.up;$('hitPad').onpointercancel=padInput.cancel;$('hitPad').onlostpointercapture=padInput.lostCapture;$('hitPad').onpointerleave=padInput.leave;$('hitPad').onclick=padInput.click;
$('pause').onclick=()=>pause();window.addEventListener('blur',()=>pause('离开了窗口，已暂停'));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('切换了页面，已暂停');});
setInterval(()=>{if(state==='playing'&&ctx?.state==='running')music?.pump();if(ctx&&ctx.state!=='running'&&['playing','calibrating'].includes(state))pause('声音中断，已暂停');},100);
$('settings').onclick=()=>{if(['playing','calibrating','loading'].includes(state))pause();$('offsetDialog').showModal();};
$('offset').oninput=e=>setOffset(Number(e.target.value));$('resetOffset').onclick=()=>{setOffset(0);prefs.visualOffset=0;syncPrefs();savePrefs();};
function applyOffset(){if(judge)judge.offset=offset/1000;}
$('closeOffset').onclick=()=>{$('offsetDialog').close();applyOffset();};$('offsetDialog').onclose=applyOffset;
$('closeAchievements').onclick=()=>$('achievementDialog').close();
$('closePractice').onclick=()=>$('practiceDialog').close();
for(let i=0;i<4;i++)$('sectionPractice'+i).onclick=()=>{$('practiceDialog').close();launch(i*sectionSize(song),(i+1)*sectionSize(song),false,selectedRate());};
$('musicVolume').oninput=e=>{prefs.music=Number(e.target.value)/100;syncPrefs();savePrefs();};$('sfxVolume').oninput=e=>{prefs.sfx=Number(e.target.value)/100;syncPrefs();savePrefs();};$('reduceMotion').onchange=e=>{prefs.reduced=e.target.checked;syncPrefs();savePrefs();};
$('previewSound').onclick=async()=>{try{ctx??=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});await ctx.resume();const preview=new Music(ctx,prefs);preview.tap();setTimeout(()=>preview.stop(),180);}catch(e){error(e);}};
$('timbre').onchange=e=>{prefs.timbre=e.target.value;syncPrefs();savePrefs();};$('visualOffset').oninput=e=>{prefs.visualOffset=Number(e.target.value);syncPrefs();savePrefs();};
navigator.mediaDevices?.addEventListener?.('devicechange',()=>{$('hint').textContent='声音设备可能已改变，建议重新校准。';});
function resize(){resizeCanvas(canvas,g,devicePixelRatio||1);}window.addEventListener('resize',resize);window.visualViewport?.addEventListener?.('resize',resize);if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(canvas);resize();
function draw(){
 requestAnimationFrame(draw);const w=canvas.clientWidth,h=canvas.clientHeight,now=performance.now();
 const beat=state==='playing'?songBeat(songNow()):state==='paused'?pausedBeat:state==='result'?endBeat-5:8;
 const active=['playing','paused','result'].includes(state),pBeat=beat-(active?prefs.visualOffset*chart.bpm*rate/60000:0);
 if(state==='playing'){
  const form=chart.score?.sections.filter(s=>s.bar*4<=beat).at(-1);scene.energy=form&&/Intro|Bridge|clearing|Outro|Coda/i.test(form.label)?.3:.85;
  const t=beatSeconds(beat);judge.expire(t,.075);consumeEvents();const s=judge.stats();$('combo').textContent=judge.combo;$('score').textContent=String(s.score).padStart(6,'0');
  const settled=s.hits+s.miss;$('accuracy').textContent=`${(settled?(s.perfect+s.good*.7+s.caught*.4)/settled*100:0).toFixed(1)}%`;
  const sec=Math.min(3,Math.max(0,Math.floor(Math.max(runStart,Math.min(beat,endBeat-.001))/sectionSize(song))));
  const fresh=now-lastFeedback<600;$('feedback').textContent=fresh?feedbackText:(song.id==='echo'?tips[sec]:song.hint);if(!fresh){$('feedback').dataset.kind='';$('timing').hidden=true;}
  $('count').textContent=t<beatSeconds(startBeat)?Math.min(4,Math.max(1,Math.ceil((beatSeconds(startBeat)-t)/beatSeconds(1)))):'';
  if(sec!==lastSection){$('section').textContent=`${usedResume||practice?runContextLabel({practice,resumed:usedResume,rate})+' · ':''}0${sec+1} / ${sections[sec]}`;setSection(sec);lastSection=sec;}
  $('nextCue').hidden=t<beatSeconds(startBeat)-1e-8;
  $('nextPattern').textContent=upcomingCue(judge.notes,judge.results,beat,judge.profile.window*chart.bpm*rate/60).text;
  $('time').textContent=`${Math.max(0,Math.min(Math.round(beatSeconds(endBeat-runStart)),Math.floor(t-beatSeconds(runStart))))} / ${Math.round(beatSeconds(endBeat-runStart))} 秒`;
  $('progress').style.width=`${Math.max(0,Math.min(100,(beat-runStart)/(endBeat-runStart)*100))}%`;
  if(t>beatSeconds(endBeat)+1.2){finish();return;}
 }
 if(state==='calibrating'){const t=songNow();$('count').textContent=t<2?`先听 ${Math.min(4,Math.max(1,4-Math.floor(t*2)))}`:`${calTaken.size} / 16`;$('progress').style.width=`${Math.max(0,Math.min(100,t/10*100))}%`;if(t>10.3){finishCalibration();return;}}
 if(now-milestoneAt>1400)$('milestone').textContent='';
 $('hitPad').dataset.pressed=String(now-padAt<95);$('beatLight').style.opacity=String(.25+.75*Math.exp(-Math.max(0,beat-Math.floor(beat))*7));
 const ink=scene.art==='ink';
 const accent=scene.backdrop(g,w,h,Math.max(0,Math.min(chart.durationBeats-.001,beat))*128/chart.durationBeats,now,state==='home',beat);
 if(state==='calibrating'){
  const x=w*.32,y=h*.48,pulse=Math.max(0,1-(Math.max(0,songNow()*2)%1)*5);
  g.strokeStyle=accent;g.lineWidth=2;g.globalAlpha=.3+pulse*.5;g.beginPath();g.arc(x,y,22,0,Math.PI*2);g.stroke();
  g.globalAlpha=1;g.fillStyle=accent;g.beginPath();g.arc(x,y,5+pulse*4,0,Math.PI*2);g.fill();return;
 }
 const p=pointAt(chart.notes,chart.terminal,Math.min(chart.durationBeats,pBeat));
 const scale=Math.max(1.15,Math.min(2.1,w/600)),anchor=active?.32:.75,ox=w*anchor-p[0]*scale,oy=h*.48-p[1]*scale;
 const xy=n=>[n.position[0]*scale+ox,n.position[1]*scale+oy];g.globalAlpha=active?1:.45;
 const selected=active?chart.notes.filter(n=>n.beat>=runStart&&n.beat<endBeat):chart.notes;
 const terminal={position:pointAt(chart.notes,chart.terminal,active?endBeat:chart.durationBeats)},nodes=[...selected,terminal];
 for(let i=0;i<nodes.length-1;i++){
  const a=xy(nodes[i]),b=xy(nodes[i+1]);if(b[0]<-50||a[0]>w+50)continue;
  const r=active?judge?.results.get(nodes[i].id):null,lit=r&&r.kind!=='miss';g.strokeStyle=lit?accent:r?.kind==='miss'?(ink?INK.miss:'#384455'):(ink?INK.route:'#6a8ba0');g.lineWidth=lit?3.5:2;
  g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();
  if(lit){g.save();g.globalAlpha=ink?.10:.13;g.lineWidth=ink?7:12;g.stroke();g.restore();}
 }
 const first=xy(selected[0]);if(first[0]>-100){g.strokeStyle=ink?INK.route:'#49697d';g.beginPath();g.moveTo(first[0]-220,first[1]);g.lineTo(...first);g.stroke();}
 for(const n of selected){
  const [x,y]=xy(n);if(x<-30||x>w+30)continue;
  const r=active?judge?.results.get(n.id):null,radius=n.beat%4===0?8:6.5;
  g.lineWidth=2;g.strokeStyle=r?.kind==='miss'?(ink?INK.miss:'#705367'):n.beat%1?(ink?'#855135':'#ffc683'):(ink?INK.text:'#c2eff0');g.fillStyle=r?.kind==='perfect'?(ink?INK.perfect:'#f6fb8b'):r?.kind==='catch'?(ink?INK.catch:'#82b5f8'):accent;
  g.beginPath();if(n.beat%1){g.moveTo(x,y-radius);g.lineTo(x+radius,y);g.lineTo(x,y+radius);g.lineTo(x-radius,y);g.closePath();}else g.arc(x,y,radius,0,Math.PI*2);
  if(r&&r.kind!=='miss')g.fill();else{g.save();g.fillStyle=ink?INK.node:'#091b2a';g.fill();g.restore();g.stroke();}
  if(r?.kind==='miss'){g.beginPath();g.moveTo(x-3,y-3);g.lineTo(x+3,y+3);g.stroke();}
  if(!r&&n.beat>=pBeat&&n.beat-pBeat<1.4){g.save();g.strokeStyle=accent;g.globalAlpha=Math.max(.1,1-(n.beat-pBeat)/1.4);g.lineWidth=1;g.beginPath();g.arc(x,y,11+(n.beat-pBeat)*12,0,Math.PI*2);g.stroke();g.restore();}
 }
 g.globalAlpha=1;scene.renderEffects(g,xy,now);
 const x=w*anchor,y=h*.48;
 if(state==='playing'||state==='calibrating'||state==='home'){
  const age=Math.max(0,(now-padAt)/150),pulse=scene.reduced?0:Math.max(0,1-age);
  const halo=g.createRadialGradient(x,y,4,x,y,40+pulse*12);halo.addColorStop(0,ink?'#28594c12':'#7affdf45');halo.addColorStop(1,ink?'#28594c00':'#7affdf00');g.fillStyle=halo;g.fillRect(x-60,y-60,120,120);
  if(state!=='home'){
   const targetRadius=judge?Math.max(14,judge.profile.window*chart.bpm*rate/60*48*scale):24;
   g.save();g.strokeStyle=accent;g.lineWidth=2;g.globalAlpha=.55+pulse*.45;g.beginPath();g.arc(x,y,targetRadius-pulse*3,0,Math.PI*2);g.stroke();
   g.lineWidth=1;g.globalAlpha=.22;g.beginPath();g.arc(x,y,34,0,Math.PI*2);g.stroke();
   for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;g.beginPath();g.moveTo(x+Math.cos(a)*42,y+Math.sin(a)*42);g.lineTo(x+Math.cos(a)*33,y+Math.sin(a)*33);g.stroke();}g.restore();
  }
  for(let i=5;i>0;i--){const q=pointAt(chart.notes,chart.terminal,Math.min(chart.durationBeats,pBeat)-i*.035);g.fillStyle=ink?`rgba(36,62,54,${.24-i*.03})`:`rgba(144,255,221,${.3-i*.035})`;g.beginPath();g.arc(q[0]*scale+ox,q[1]*scale+oy,3.5-i*.3,0,Math.PI*2);g.fill();}
  g.fillStyle=ink?(pulse>.5?INK.perfect:INK.text):(pulse>.5?'#f6fb8b':'#ecfff5');g.beginPath();g.arc(x,y,5.5+pulse*2,0,Math.PI*2);g.fill();
 }
}
bindHome();draw();
