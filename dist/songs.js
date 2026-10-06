export const SONGS=[
 {id:'echo',title:'一路接亮',style:'ORIGINAL ELECTRONIC',bpm:120,beats:128,chart:'chart.json',chapters:['接上电','留白','回声','点亮'],hint:'跟随清亮主音，空白处不用敲',colors:null},
 {id:'bossa',art:'ink',audio:'audio/bossa.mp3',title:'庭院明信片',style:'BOSSA NOVA',bpm:112,beats:192,chart:'songs/bossa-chart.json',chapters:['晨光','树荫','回信','庭院'],hint:'先跟拨弦，再听长笛；切分拍落在两拍之间',colors:[[124,226,177],[245,201,128],[97,198,202],[227,236,163]]},
 {id:'synthwave',audio:'audio/synthwave.mp3',title:'玻璃公路',style:'SYNTHWAVE',bpm:112,beats:160,chart:'songs/synthwave-chart.json',chapters:['车灯','路标','下穿','归途'],hint:'从琶音进入主旋律；长音之后留出呼吸',colors:[[191,126,255],[255,122,185],[91,186,245],[255,192,130]]},
 {id:'breakbeat',audio:'audio/breakbeat.mp3',title:'银色湍流',style:'DRUM & BASS',bpm:172,beats:256,chart:'songs/breakbeat-chart.json',chapters:['悬浮','浪峰','澄空','再跃'],hint:'跟主音与钟声应答，不跟每一下碎鼓',colors:[[111,204,255],[86,247,220],[150,184,255],[229,246,255]]}
];
export function songKey(id){return id==='echo'?'echo-records':`echo-records-${id}`;}
export function sectionSize(song){return song.beats/4;}
