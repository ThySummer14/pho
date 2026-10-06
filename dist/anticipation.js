// Read-ahead uses chart beats, not frame rate or wall time. It never judges input.
const voices={
 'Nylon-pattern pluck':'拨弦','Flute lead':'长笛',
 'Clockwork arpeggio':'琶音','Neon lead':'主旋律',
 'Liquid chords':'电钢琴','Liquid signal':'主旋律','Spark answers':'钟声应答'
};
export function upcomingCue(notes,results,beat,windowBeats=0){
 const pending=notes.filter(n=>!results.has(n.id)&&n.beat>=beat-windowBeats-1e-8);
 const [next,after]=pending;
 if(!next)return {text:'曲尾 / LAST ECHO',voice:null,interval:null};
 const voice=voices[next.voice]||'清亮主音',gap=after?after.beat-next.beat:null;
 const exact=(a,b)=>Math.abs(a-b)<1e-8;
 let pattern;
 if(gap===null)pattern='最后一音 · 接住余韵';
 else if(gap>=2)pattern='留白 · 等下一次起音';
 else if(exact(gap,.5))pattern='半拍 · 轻轻嗒嗒';
 else if(exact(gap,1))pattern='单拍 · 稳稳接上';
 else if(gap<.5)pattern='密拍 · 短促连点';
 else pattern='切分 · 听下一次起音';
 return {text:`${voice} / ${pattern}`,voice,interval:gap};
}
