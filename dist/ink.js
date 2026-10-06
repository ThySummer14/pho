// Original procedural paper/ink art. Geometry is decorative only and never
// changes the chart, hit point, event clock or judgement.
export const INK={paper:'#f3eee2',text:'#243e36',accent:'#28594c',muted:'#53695e',route:'#617468',miss:'#8d5145',perfect:'#963f2e',catch:'#465b70',node:'#fcf8ed'};
const noise=n=>{const x=Math.sin(n*19.173+7.31)*19713.173;return x-Math.floor(x);};
const rgba=(c,a)=>`rgba(${c},${a})`;
function polygon(g,points){g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();}
function stroke(g,a,b){g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
export function inkBackdrop(g,w,h,beat,now,{reduced=false,home=false,energy=.6}={}){
 const breath=reduced?0:Math.sin(now*.00018)*2;
 g.save();g.fillStyle=INK.paper;g.fillRect(0,0,w,h);
 // A fixed paper grain is intentionally sparse and deterministic, never noise
 // regenerated each frame. At most 32 tiny fibres regardless of device size.
 g.strokeStyle='rgba(91,82,57,.045)';g.lineWidth=.7;
 for(let i=0;i<32;i++){const x=noise(i)*w,y=noise(i+97)*h;stroke(g,[x,y],[x+3+noise(i+211)*8,y+noise(i+13)*2]);}
 const wash=g.createRadialGradient(w*.78,h*.31,0,w*.78,h*.31,w*.5);wash.addColorStop(0,'rgba(196,169,115,.12)');wash.addColorStop(1,'rgba(196,169,115,0)');g.fillStyle=wash;g.fillRect(0,0,w,h);
 // Three overlapping pale mountain washes remain behind the reading corridor.
 for(let layer=0;layer<3;layer++){
  const base=h*(.70+layer*.075),points=[[w*.36,h]];
  for(let i=0;i<=28;i++){
   const x=w*(.36+i*.024),crest=Math.sin(i*.25+layer*.8)*.5+.5;
   const y=base-h*(.045+crest*.115)*(1-layer*.19)+noise(i+layer*31)*h*.01;
   points.push([x,y]);
  }
  points.push([w*1.06,h]);g.fillStyle=rgba(layer===0?'92,113,100':layer===1?'67,94,81':'43,77,61',.065+layer*.02);polygon(g,points);
 }
 // Open courtyard colonnade, drawn as imperfect brush strokes rather than neon.
 const x=w*.73,y=h*.66,r=Math.min(w*.13,h*.12);g.strokeStyle='rgba(38,66,53,.23)';g.lineWidth=3;
 g.beginPath();g.arc(x,y,r,Math.PI,Math.PI*2);g.stroke();stroke(g,[x-r,y],[x-r,h*.88]);stroke(g,[x+r,y],[x+r,h*.88]);
 g.strokeStyle='rgba(38,66,53,.08)';g.lineWidth=7;stroke(g,[x-r+2,y],[x-r+1,h*.88]);
 // A small branch lives at the outer edge; restrained sway disappears in reduced
 // motion. Large leaves cannot be confused with the route's hollow targets.
 const bx=w*.94,by=h*.80;g.strokeStyle='rgba(36,72,51,.36)';g.lineWidth=2;
 stroke(g,[bx,by],[bx-w*.025+breath,h*.54]);
 for(let i=0;i<6;i++){
  const yy=h*(.58+i*.036),xx=bx-w*.022+i*w*.003+breath*(1-i/7),side=i%2?1:-1;
  g.fillStyle='rgba(36,72,51,.13)';polygon(g,[[xx,yy],[xx+side*w*.055,yy-h*.015],[xx+side*w*.027,yy+h*.008]]);
 }
 // Water strokes retain empty space. Their density is fixed, brightness varies
 // only mildly with musical form, never with individual hits or screen flashes.
 g.strokeStyle=rgba('61,88,69',.08+Math.max(0,Math.min(1,energy))*.025);g.lineWidth=1;
 for(let i=0;i<7;i++){const yy=h*(.79+i*.021);stroke(g,[w*(.48+noise(i+8)*.13),yy],[w*(.81+noise(i+71)*.1),yy]);}
 // Vermilion seal belongs only to song selection, never behind the live HUD.
 if(home){g.fillStyle='rgba(139,53,38,.65)';g.fillRect(w*.88,h*.23,13,22);g.fillStyle=INK.paper;g.fillRect(w*.88+3,h*.23+4,2,12);g.fillRect(w*.88+7,h*.23+7,3,2);}
 if(!home){const clear=g.createLinearGradient(0,h*.27,0,h*.69);clear.addColorStop(0,'rgba(243,238,226,0)');clear.addColorStop(.45,'rgba(243,238,226,.86)');clear.addColorStop(1,'rgba(243,238,226,0)');g.fillStyle=clear;g.fillRect(0,h*.27,w,h*.42);}
 g.restore();return INK.accent;
}
export function inkEffects(g,effects,xy,now,reduced=false){
 for(const e of effects.slice(-12)){
  const age=now-e.time;if(age<0||age>=620)continue;
  const good=['perfect','good','catch'].includes(e.kind),life=good?620:260;if(age>=life)continue;
  const [x,y]=xy({position:e.position}),fade=(1-age/life)**2,spread=reduced?0:Math.min(1,age/300),radius=good?8+spread*14:5;
  g.save();g.fillStyle=e.kind==='perfect'?INK.perfect:e.kind==='catch'?INK.catch:INK.accent;g.strokeStyle=g.fillStyle;
  if(!good){g.globalAlpha=fade*.35;g.lineWidth=1.5;stroke(g,[x-4,y+3],[x+4,y-3]);g.restore();continue;}
  // Bounded pigment bloom: 12 vertices, three translucent washes, no rays.
  for(let layer=0;layer<3;layer++){
   g.globalAlpha=fade*(layer===0?.12:.065);const points=[];
   for(let i=0;i<12;i++){const a=i*Math.PI/6,r=radius*(.7+layer*.25)*(1+noise(i+e.id*7)*.13);points.push([x+Math.cos(a)*r,y+Math.sin(a)*r*.82]);}
   polygon(g,points);
  }
  g.globalAlpha=fade*.65;g.lineWidth=1.5;g.beginPath();g.arc(x,y,reduced?9:9+spread*5,-.15,Math.PI*1.55);g.stroke();g.restore();
 }
}
