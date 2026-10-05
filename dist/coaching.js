// All errors are real seconds, including tempo practice. This is descriptive
// feedback, never an automatic calibration recommendation or record modifier.
export function timingSummary(results){
 const errors=[...results.values()].filter(r=>Number.isFinite(r.error)).map(r=>r.error*1000);
 if(!errors.length)return {count:0,mean:null,spread:null};
 const mean=errors.reduce((a,b)=>a+b,0)/errors.length;
 return {count:errors.length,mean,spread:Math.sqrt(errors.reduce((sum,x)=>sum+(x-mean)**2,0)/errors.length)};
}
export function phraseReport(notes,results,events,from=0,to=128){
 const phrases=[];
 for(let start=from;start<to;start+=16){
  const end=Math.min(to,start+16),selected=notes.filter(n=>n.beat>=start&&n.beat<end);
  if(!selected.length)continue;
  const settled=selected.map(n=>results.get(n.id));
  const score=settled.reduce((sum,r)=>sum+({perfect:1000,good:700,catch:400}[r?.kind]||0),0);
  const misses=settled.filter(r=>!r||r.kind==='miss').length;
  const strays=events.filter(r=>r.kind==='stray'&&r.beat>=start&&r.beat<end).length;
  const hits=settled.length-misses,accuracy=score/(selected.length*1000);
  phrases.push({start,end,total:selected.length,hits,misses,strays,accuracy,priority:1-accuracy+Math.min(1,strays/selected.length)*.15});
 }
 const weakest=[...phrases].sort((a,b)=>b.priority-a.priority||a.start-b.start)[0]||null;
 return {phrases,weakest};
}
export function coachingText(timing,stats){
 if(!stats.hits)return '先把旋律听清：选 75% 慢练，只跟清亮主音，不用跟每一下底鼓。';
 if(stats.miss>stats.total*.2)return '先接住漏掉的音：点下方较暗的乐句，放慢后再回到原速。';
 if(timing.count<8)return '命中样本还少，先完整接完这一句，再看早晚趋势。';
 if(timing.spread>45)return '早晚还不稳定：固定手势，先练均匀间隔，再接双拍。';
 if(Math.abs(timing.mean)>25)return `多数命中偏${timing.mean<0?'早':'晚'}：先听主音再重练。若多个乐句都有同样偏移，可回首页单独校准。`;
 if(stats.strays)return '拍点已很接近：留白时放松手，减少额外空拍。';
 return '节奏很稳。保持同样手势，试着把这一段接回整曲。';
}
