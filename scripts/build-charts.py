"""Compile owned final scores into reproducible single-button charts.
Input scores are committed; no external assets or randomness are used.
"""
import json,math
from pathlib import Path
for slug in ['bossa','synthwave','breakbeat']:
 p=Path(f'dist/songs/{slug}.json'); score=json.loads(p.read_text()); bpm=score['bpm']; end=score['bars']*4
 # Melody anchors only; the opening introduces one audible accompaniment voice.
 lead=next(t for t in score['tracks'] if t['kind'] in ['flute','lead'])
 opening=next(t for t in score['tracks'] if t['kind'] in (['pluck'] if slug!='breakbeat' else ['epiano']))
 starts={round(e[0],6):(e[1],lead['name']) for e in lead['events']}
 first=min(starts)
 for e in opening['events']:
  beat=round(e[0],6)
  if beat<first and abs(beat-round(beat))<.000001 and (slug!='synthwave' or beat%2==0):starts.setdefault(beat,(e[1],opening['name']))
 if slug=='breakbeat':
  # Bell responses are actual pitched fills. Do not erase the half-time clearing.
  for t in score['tracks']:
   if t['kind']=='bell':
    for e in t['events']:starts.setdefault(round(e[0],6),(e[1],t['name']))
 beats=sorted(starts);notes=[]
 for i,b in enumerate(beats):
  pitch,voice=starts[b];nxt=beats[i+1] if i+1<len(beats) else end
  y=math.sin(b/8)*40+(pitch-72)*2 if slug=='bossa' else (math.sin(b/16)*65 if slug=='synthwave' else ((i%4)-1.5)*22)
  notes.append({'id':i,'beat':b,'bar':int(b//4)+1,'position':[round(b*48,3),round(y,3)],'nextIntervalBeats':round(nxt-b,6),'pitch':pitch,'voice':voice})
 chart={'title':score['title_zh'],'bpm':bpm,'durationBeats':end,'notes':notes,'terminal':{'beat':end,'position':[end*48,0]},'score':score,'status':'Original final-score-derived browser arrangement; see QA.md for verification limits'}
 Path(f'dist/songs/{slug}-chart.json').write_text(json.dumps(chart,ensure_ascii=False,separators=(',',':'))+'\n')
 print(slug,bpm,len(notes),'min gap',min(b-a for a,b in zip(beats,beats[1:])))
