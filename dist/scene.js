// Architecture lives behind the chart; impact effects never move its geometry.
export const themes = [
 {name:'接上电',place:'零号街区',color:[61,226,245],sky:[7,18,27],depth:.73,height:.91},
 {name:'留白',place:'琥珀高架',color:[255,179,74],sky:[24,17,14],depth:.70,height:1.10},
 {name:'回声',place:'回声中枢',color:[255,87,160],sky:[24,11,22],depth:.75,height:1.28},
 {name:'点亮',place:'黎明出口',color:[189,247,91],sky:[15,23,17],depth:.68,height:.84}
];
const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb=(c,a=1)=>`rgba(${c.join(',')},${a})`;
const successKinds=new Set(['perfect','good','catch']);
const effectLife=kind=>kind==='catch'?420:successKinds.has(kind)?620:260;
const noise=n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
const sectionAt=beat=>{
 const b=Number.isFinite(beat)?Math.max(0,beat):0,section=Math.min(3,Math.floor(b/32));
 const progress=clamp((b-section*32)/4),blend=progress*progress*(3-2*progress);
 return {section,previous:Math.max(0,section-1),blend};
};
const polygon=(g,points)=>{
 g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.closePath();g.fill();
};
const line=(g,x1,y1,x2,y2)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};

export class Scene {
 constructor(){this.effects=[];this.reduced=false;}
 clear(){this.effects=[];}
 hit(result,position,now,combo=0){
  this.effects.push({kind:result.kind,position,time:now,combo});
  this.effects=this.effects.slice(-24);
 }
 palette(beat){
  const {section,previous,blend}=sectionAt(beat),a=themes[previous],b=themes[section];
  return {color:mix(a.color,b.color,blend),sky:mix(a.sky,b.sky,blend)};
 }
 backdrop(g,w,h,beat,now,home=false){
  const {color,sky}=this.palette(beat),{section,previous,blend}=sectionAt(beat);
  const a=themes[previous],b=themes[section],depth=a.depth+(b.depth-a.depth)*blend;
  const height=a.height+(b.height-a.height)*blend,horizon=h*depth,vx=w*.72;
  const visibility=home?1:.54,motion=this.reduced?0:now*.00006;
  const auxiliary=[[255,162,82],[92,210,236],[80,227,246],[255,186,112]];
  const secondary=mix(auxiliary[previous],auxiliary[section],blend);
  g.save();
  const skyWash=g.createLinearGradient(0,0,0,h);
  skyWash.addColorStop(0,rgb(sky));skyWash.addColorStop(.65,'#090e16');skyWash.addColorStop(1,'#05080d');
  g.fillStyle=skyWash;g.fillRect(0,0,w,h);

  // A broad city glow belongs to the horizon, leaving the upper sky mostly black.
  const cityGlow=g.createRadialGradient(vx,horizon,0,vx,horizon,w*.49);
  cityGlow.addColorStop(0,rgb(color,(home?.32:.16)*visibility));cityGlow.addColorStop(.45,rgb(color,(home?.075:.035)*visibility));cityGlow.addColorStop(1,rgb(color,0));
  g.fillStyle=cityGlow;g.fillRect(0,0,w,h);

  // Local pools of light and angled searchlight haze belong to the city itself.
  for(const [cx,cy,r,tint] of [[w*.80,h*.40,h*.31,color],[w*.96,h*.65,h*.27,secondary]]){
   const halo=g.createRadialGradient(cx,cy,0,cx,cy,r);
   halo.addColorStop(0,rgb(tint,home?.15:.045));halo.addColorStop(1,rgb(tint,0));
   g.fillStyle=halo;g.fillRect(cx-r,cy-r,r*2,r*2);
  }
  g.fillStyle=rgb(color,home?.042:.012);
  polygon(g,[[w*.66,horizon],[w*.59,h*.22],[w*.73,h*.15],[w*.70,horizon]]);
  g.fillStyle=rgb(secondary,home?.042:.012);
  polygon(g,[[w*.98,horizon],[w*.81,h*.20],[w*.92,h*.17],[w,horizon]]);

  // Three static silhouettes and sparse, deterministic windows establish depth.
  for(let layer=0;layer<3;layer++){
   const step=w/(layer===0?24:layer===1?17:11),base=horizon+h*layer*.018;
   for(let i=-1;i<Math.ceil(w/step)+1;i++){
    const n=i+40+layer*73,bw=step*(.57+noise(n+3)*.33),x=i*step+noise(n+11)*step*.16;
    const onRight=.55+.45*clamp((x/w-.45)*3);
    const bh=h*(.065+noise(n)*(.13+layer*.05))*height*onRight;
    const y=base-bh,shade=home?(layer===0?[19,33,45]:layer===1?[15,27,40]:[10,21,33]):(layer===0?[13,22,30]:layer===1?[10,17,25]:[7,12,18]);
    g.fillStyle=rgb(shade);g.fillRect(x,y,bw,bh);
    g.strokeStyle=rgb(color,(home?.25+layer*.06:.11+layer*.025)*visibility);g.lineWidth=1;
    line(g,x,y,x+bw,y);if(noise(n+14)>.4)line(g,x+bw,y,x+bw,base);
    if(layer===0)continue;
    const columns=Math.max(1,Math.floor(bw/10)),rows=Math.min(12,Math.floor(bh/12));
    for(let row=1;row<rows;row++)for(let col=0;col<columns;col++){
     if(noise(n*127+row*17+col*31)<.65)continue;
     const tint=noise(n+row*4+col)>.76?secondary:color;
     g.fillStyle=rgb(tint,(home?.28+noise(n+row+col)*.44:.14+noise(n+row+col)*.22)*visibility);
     g.fillRect(x+4+col*(bw-8)/columns,y+row*12,Math.max(1,Math.min(home?5:4,bw/columns-3)),home?3:2);
    }
    if(layer===2&&noise(n+18)>.72){
     g.strokeStyle=rgb(color,.26*visibility);line(g,x+bw*.7,y,x+bw*.7,y-h*.025);
     g.fillStyle=rgb(color,.52*visibility);g.fillRect(x+bw*.7-1,y-h*.025,2,2);
    }
   }
  }

  // Each musical section opens onto a different block, cross-faded over four beats.
  const landmark=(district,alpha)=>{
   if(alpha<=0)return;
   g.save();g.globalAlpha=alpha*visibility;
   const x=w*.72,base=horizon+h*.025,bw=w*.19;
   g.fillStyle=home?'#102532':'#0b1722';g.strokeStyle=rgb(color,home?.94:.72);g.lineWidth=home?1.8:1.2;
   if(district===0){
    const y=h*.27;
    polygon(g,[[x,y+h*.09],[x+bw*.16,y],[x+bw*.79,y],[x+bw,y+h*.08],[x+bw,base],[x,base]]);
    line(g,x+bw*.16,y,x+bw*.79,y);line(g,x+bw,y+h*.08,x+bw,base);
    g.fillStyle=rgb(color,home?.86:.28);g.fillRect(x+bw*.13,y+h*.14,bw*.78,home?5:3);
    for(let i=0;i<5;i++){g.fillStyle=rgb(color,(home?.42:.18)+i*.016);g.fillRect(x+bw*.14,y+h*.20+i*h*.045,bw*.12,3);g.fillRect(x+bw*.37,y+h*.20+i*h*.045,bw*.47,3);}
    g.strokeStyle=rgb(color,home?.72:.35);line(g,x+bw*.14,base,x+bw*.83,y+h*.12);
   }else if(district===1){
    const y=h*.35;
    polygon(g,[[x,y],[x+bw*.30,y-h*.10],[x+bw*.89,y-h*.10],[x+bw*.89,base],[x,base]]);
    line(g,x,y,x+bw*.30,y-h*.10);line(g,x+bw*.30,y-h*.10,x+bw*.89,y-h*.10);
    g.fillStyle=rgb(color,home?.57:.24);
    for(let i=0;i<6;i++)g.fillRect(x+bw*.40,y+i*h*.048,bw*.38,3);
    // Elevated transit passes beneath the readable part of the chart.
    g.fillStyle='#080c12';polygon(g,[[w*.51,h*.73],[w,h*.60],[w,h*.66],[w*.51,h*.75]]);
    g.strokeStyle=rgb(color,.59);line(g,w*.51,h*.73,w,h*.60);
    g.fillStyle='#060a0f';g.fillRect(w*.86,h*.66,w*.025,h*.34);
   }else if(district===2){
    const y=h*.12;
    g.fillRect(x+bw*.10,y,bw*.62,base-y);g.fillRect(x+bw*.73,y+h*.16,bw*.35,base-y-h*.16);
    line(g,x+bw*.10,y,x+bw*.72,y);line(g,x+bw*.10,y,x+bw*.10,base);
    line(g,x+bw*.72,y,x+bw*.72,base);
    g.fillStyle=rgb(color,home?.67:.30);
    for(let i=0;i<8;i++)g.fillRect(x+bw*.18,y+h*.055+i*h*.05,bw*.46,i%3===0?4:2);
    g.fillStyle='#10151d';polygon(g,[[x+bw*.26,y],[x+bw*.43,y-h*.04],[x+bw*.60,y],[x+bw*.60,y+h*.035],[x+bw*.26,y+h*.035]]);
    g.strokeStyle=rgb(color,.72);line(g,x+bw*.26,y,x+bw*.43,y-h*.04);line(g,x+bw*.43,y-h*.04,x+bw*.60,y);
   }else{
    const y=h*.32;
    polygon(g,[[x-w*.05,base],[x-w*.05,y+h*.06],[x+bw*.18,y],[x+bw*1.1,y],[x+bw*1.1,base]]);
    g.fillStyle=home?'#182d26':'#0c1519';g.fillRect(x+bw*.18,y+h*.06,bw*.64,base-y-h*.06);
    g.strokeStyle=rgb(color,.62);line(g,x-w*.05,y+h*.06,x+bw*.18,y);line(g,x+bw*.18,y,x+bw*1.1,y);
    line(g,x+bw*.18,y+h*.06,x+bw*.18,base);line(g,x+bw*.82,y+h*.06,x+bw*.82,base);
    g.fillStyle=rgb(color,home?.72:.26);g.fillRect(x+bw*.26,y+h*.09,bw*.48,4);
    for(let i=0;i<4;i++){g.fillRect(x-w*.015,y+h*.15+i*h*.055,bw*.08,2);g.fillRect(x+bw*.93,y+h*.15+i*h*.055,bw*.09,2);}
   }
   // Glass bays, vertical ribs and warm service windows make the large facade legible.
   const top=h*(district===0?.435:district===1?.37:district===2?.21:.47);
   const left=x+bw*(district===1?.43:district===2?.18:district===3?.28:.37);
   const facadeWidth=bw*(district===1?.34:district===2?.45:district===3?.44:.46);
   const rows=Math.max(1,Math.floor((base-top)/17)),columns=5;
   g.fillStyle=rgb(color,home?.055:.025);g.fillRect(left-3,top-6,facadeWidth+6,base-top);
   for(let col=0;col<columns;col++){
    const paneX=left+col*facadeWidth/columns;
    g.fillStyle=rgb(color,home?.09:.035);g.fillRect(paneX,top,facadeWidth/columns-4,base-top);
    g.strokeStyle=rgb(color,home?.25:.09);g.lineWidth=1;line(g,paneX,top,paneX,base);
    for(let row=0;row<rows;row++){
     if(noise(district*731+col*97+row*37)<.38)continue;
     const tint=noise(col*43+row*29)>.73?secondary:color;
     g.fillStyle=rgb(tint,home?.44+noise(row+col)*.43:.15+noise(row+col)*.14);
     g.fillRect(paneX+3,top+row*17,facadeWidth/columns-10,row%4===0?7:3);
    }
   }
   const edgeX=x+bw*(district===2?.72:district===3?1.07:.94),edgeTop=h*(district===2?.14:district===3?.35:.36);
   g.shadowBlur=home?16:5;g.shadowColor=rgb(secondary,.80);
   g.fillStyle=rgb(secondary,home?.87:.26);g.fillRect(edgeX,edgeTop,home?4:2,base-edgeTop);
   g.shadowColor=rgb(color,.85);g.strokeStyle=rgb(color,home?.95:.36);g.lineWidth=home?2:1;
   line(g,left-7,top-h*.037,left+facadeWidth,top-h*.037);g.shadowBlur=0;
   g.restore();
  };
  landmark(previous,previous===section?1:1-blend);if(previous!==section)landmark(section,blend);

  // The street opens into perspective; its light rails sit below the judgement line.
  g.fillStyle='#070b11';g.fillRect(0,horizon,w,h-horizon);
  g.fillStyle='#0a1018';polygon(g,[[vx-w*.035,horizon],[vx+w*.045,horizon],[w*1.03,h],[w*.27,h]]);
  const railEnds=[w*.08,w*.27,w*.49,w*.97,w*1.18];
  for(let i=0;i<railEnds.length;i++){
   const end=railEnds[i],start=vx+(end-vx)*.025;
   g.lineWidth=i===1||i===3?(home?2.4:1.7):1;g.strokeStyle=rgb(color,(i===1||i===3?(home?.58:.34):(home?.16:.09))*visibility);
   line(g,start,horizon,end,h);
  }
  // Reflections break into broad wet street strips beneath the lit facades.
  for(let i=0;i<20;i++){
   const p=(i+.6)/20,y=horizon+(h-horizon)*p*p,spread=p*p;
   const center=vx+(w*.85-vx)*spread,width=(10+noise(i*43)*50)*spread;
   g.fillStyle=rgb(i%4===0?secondary:color,(home?.12:.035)*(1-p*.6));
   g.fillRect(center-width*.5,y,width,home?2+spread*3:1+spread);
  }
  // A physical elevated walkway connects the right-hand blocks.
  const bridgeY=horizon-h*.047;
  g.fillStyle=home?'#14272e':'#0a151d';
  polygon(g,[[w*.55,bridgeY+h*.018],[w*.93,bridgeY-h*.036],[w*.93,bridgeY-h*.013],[w*.55,bridgeY+h*.030]]);
  g.strokeStyle=rgb(color,home?.67:.22);g.lineWidth=home?2:1;
  line(g,w*.55,bridgeY+h*.018,w*.93,bridgeY-h*.036);
  line(g,w*.55,bridgeY+h*.032,w*.93,bridgeY-h*.010);
  for(let i=0;i<20;i++){
   const t=i/20,bx=w*(.55+.38*t),by=bridgeY+h*(.018-.054*t);
   g.strokeStyle=rgb(i%5===0?secondary:color,home?.40:.13);line(g,bx,by,bx,by+h*.013);
  }
  for(let i=0;i<11;i++){
   const t=((i/11+motion)%1),p=t*t,y=horizon+(h-horizon)*p;
   g.lineWidth=1;g.strokeStyle=rgb(color,(.035+p*.09)*visibility);
   line(g,vx+(w*.27-vx)*p,y,vx+(w*1.03-vx)*p,y);
  }
  if(!this.reduced){
   for(let i=0;i<5;i++){
    const t=(motion*.43+i*.197)%1,p=t*t,y=horizon+(h-horizon)*p;
    const lane=i%2===0?w*.49:w*.97,x=vx+(lane-vx)*p;
    g.strokeStyle=rgb(color,.28*visibility*p);g.lineWidth=1+p*2;
    line(g,x,y,x+(lane-vx)*.034*p,y+(h-horizon)*.034*p);
   }
  }

  // Near buildings frame the street without adding chart-like nodes or UI glyphs.
  g.fillStyle='#05080d';polygon(g,[[0,h*.60],[w*.055,h*.56],[w*.12,h*.72],[w*.12,h],[0,h]]);
  polygon(g,[[w,h*.38],[w*.97,h*.35],[w*.945,h*.39],[w*.945,h],[w,h]]);
  g.strokeStyle=rgb(color,(home?.62:.29)*visibility);g.lineWidth=2;
  line(g,w*.055,h*.56,w*.12,h*.72);line(g,w*.945,h*.39,w*.945,h);
  g.fillStyle=rgb(secondary,(home?.82:.27)*visibility);g.fillRect(w*.973,h*.44,home?4:2,h*.17);

  // During play a quiet horizontal corridor keeps early notes and impact readable.
  if(!home){
   const corridor=g.createLinearGradient(0,h*.29,0,h*.70);
   corridor.addColorStop(0,'rgba(4,8,14,0)');corridor.addColorStop(.32,'rgba(4,8,14,.60)');
   corridor.addColorStop(.66,'rgba(4,8,14,.60)');corridor.addColorStop(1,'rgba(4,8,14,0)');
   g.fillStyle=corridor;g.fillRect(0,h*.29,w,h*.41);
  }
  const edgeShade=g.createLinearGradient(0,0,w,0);
  edgeShade.addColorStop(0,'rgba(3,6,11,.54)');edgeShade.addColorStop(.34,'rgba(3,6,11,.04)');
  edgeShade.addColorStop(.80,'rgba(3,6,11,0)');edgeShade.addColorStop(1,'rgba(3,6,11,.22)');
  g.fillStyle=edgeShade;g.fillRect(0,0,w,h);
  g.restore();return rgb(color);
 }
 renderEffects(g,xy,now){
  this.effects=this.effects.filter(e=>now-e.time<effectLife(e.kind));
  for(const e of this.effects){
   const ms=now-e.time;if(ms<0)continue;
   const [x,y]=xy({position:e.position}),success=successKinds.has(e.kind);
   const perfect=e.kind==='perfect',caught=e.kind==='catch';
   const color=perfect?[233,255,251]:caught?[217,186,123]:success?[91,235,251]:[136,154,172];
   const life=effectLife(e.kind);if(ms>=life)continue;
   const age=ms/life,fade=(1-age)*(1-age);
   g.save();g.strokeStyle=rgb(color);g.fillStyle=rgb(color);
   if(!success){
    // A small dull mark acknowledges misses and empty hits without a bright burst.
    g.globalAlpha=fade*.34;g.lineWidth=1.5;
    line(g,x-5,y,x+5,y);g.restore();continue;
   }
   const core=clamp(1-ms/100);
   if(core>0){
    g.globalAlpha=core*(this.reduced?.48:caught?.55:.95);
    g.beginPath();g.arc(x,y,5+core*4,0,Math.PI*2);g.fill();
   }
   const travel=this.reduced?0:1-Math.pow(1-age,3),milestone=e.combo>0&&e.combo%16===0;
   for(let ring=0;ring<2;ring++){
    g.globalAlpha=fade*(ring===0?.78:.33);g.lineWidth=ring===0?2:1;
    const radius=this.reduced?12+ring*6:9+travel*(ring===0?(caught?21:31):(caught?31:49))*(milestone&&!caught?1.22:1);
    g.beginPath();g.arc(x,y,radius,0,Math.PI*2);g.stroke();
   }
   if(!this.reduced){
    const rays=perfect?8:caught?4:6;
    g.globalAlpha=clamp(1-ms/190)*.78;g.lineWidth=perfect?2:1.5;
    for(let i=0;i<rays;i++){
     const angle=i/rays*Math.PI*2+Math.PI/rays,start=11+travel*8,end=start+clamp(1-ms/230)*17;
     line(g,x+Math.cos(angle)*start,y+Math.sin(angle)*start,x+Math.cos(angle)*end,y+Math.sin(angle)*end);
    }
    const count=perfect?8:caught?2:4;g.globalAlpha=fade*(caught?.52:.90);
    for(let i=0;i<count;i++){
     const angle=i/count*Math.PI*2+noise(e.time+i)*.35,distance=12+travel*(28+noise(i+e.combo)*21);
     g.save();g.translate(x+Math.cos(angle)*distance,y+Math.sin(angle)*distance);g.rotate(angle);
     g.fillRect(-2*(1-age),-1,4*(1-age),2);g.restore();
    }
   }
   g.restore();
  }
 }
}
