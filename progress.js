export const BADGES=[
 {id:'first',title:'初次完奏',detail:'完成整曲，并接亮至少一颗节点'},
 {id:'combo16',title:'16 连击',detail:'连续接亮 16 颗节点'},
 {id:'combo64',title:'64 连击',detail:'整曲中连续接亮 64 颗节点'},
 {id:'accuracy90',title:'精准率 90%',detail:'整曲的加权精准率达到 90%'},
 {id:'fullCombo',title:'FULL COMBO',detail:'整曲零漏拍、零空击'}
];
export function rank(stats){const a=stats.accuracy||0;return stats.hits===0?'—':a>=.98?'S+':a>=.90?'S':a>=.80?'A':a>=.65?'B':a>=.45?'C':'D';}
export function readProgress(storage,key='echo-records',total=117){
 const empty={best:{},badges:[]};
 try{const value=JSON.parse(storage.getItem(key)||'null');if(!value||typeof value!=='object')return empty;
  const best={};for(const [mode,item] of Object.entries(value.best||{})){if(['relaxed','standard','challenge'].includes(mode)&&Number.isFinite(item.score)&&item.score>=0&&item.score<=total*1000&&Number.isFinite(item.accuracy)&&item.accuracy>=0&&item.accuracy<=1)best[mode]={score:item.score,accuracy:item.accuracy,combo:Math.max(0,Math.min(total,Number(item.combo)||0)),rank:rank({hits:item.score>0?1:0,accuracy:item.accuracy}),fullCombo:item.fullCombo===true};}
  return {best,badges:Array.isArray(value.badges)?[...new Set(value.badges.filter(id=>BADGES.some(b=>b.id===id)))]:[]};
 }catch{return empty;}
}
export function recordRun(progress,stats,{mode='standard',practice=false,resumed=false,expectedTotal=117}={}){
 const next={best:{...progress.best},badges:[...progress.badges]},fresh=[];
 const full=!practice&&!resumed&&stats.total===expectedTotal;
 const eligible={first:full&&stats.hits>0,combo16:stats.maxCombo>=16,combo64:full&&stats.maxCombo>=64,accuracy90:full&&stats.accuracy>=.9,fullCombo:full&&stats.fullCombo};
 for(const b of BADGES)if(eligible[b.id]&&!next.badges.includes(b.id)){next.badges.push(b.id);fresh.push(b);}
 const previous=next.best[mode],newBest=full&&stats.hits>0&&(!previous||stats.score>previous.score);
 if(full&&stats.hits>0){next.best[mode]={score:Math.max(previous?.score||0,stats.score),accuracy:Math.max(previous?.accuracy||0,stats.accuracy),combo:Math.max(previous?.combo||0,stats.maxCombo),rank:rank({hits:stats.hits,accuracy:Math.max(previous?.accuracy||0,stats.accuracy)}),fullCombo:!!(previous?.fullCombo||stats.fullCombo)};}
 return {progress:next,fresh,newBest,improvement:newBest?stats.score-(previous?.score||0):0,rank:rank(stats),recorded:full&&stats.hits>0};
}
// Descriptive only: these labels never change scoring or record eligibility.
export function runContextLabel({practice=false,resumed=false,rate=1}={}){
 return resumed?'中断恢复':rate!==1?'变速练习':practice?'分段练习':'完整演奏';
}
export function recordExplanation({practice=false,resumed=false,rate=1,recorded=false,fresh=[],saved=true}={}){
 const unranked=practice||resumed;
 let text=unranked?`${resumed?'中断恢复':rate!==1?'变速练习':'分段练习'}：本次分数、精准率、最长连击不计入整曲最佳。`:recorded?(saved?'整曲最佳已按当前曲目和判定难度保存。':'本次整曲结果暂留在当前页面。'):'本次没有命中，不更新整曲最佳。';
 if(!saved)return text+' 本地保存失败，请勿依赖本次新增纪录或成就。';
 if(unranked)text+=fresh.length?'新解锁的成就已保存。':'既有最佳与成就保留。';
 return text;
}
