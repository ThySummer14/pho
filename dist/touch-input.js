// Rhythm judgement is deliberately on DOWN, never on UP. Releasing, dragging
// away, cancellation and capture loss cannot invent another note or undo one.
export function createPadInput(onPress){
 let active=null,lastPointerTime=-Infinity;
 const id=e=>e.pointerId??0;
 const finish=e=>{if(active===id(e)){active=null;lastPointerTime=e.timeStamp;}};
 return {
  down(e){
   if(e.isPrimary===false||e.button>0||active!==null)return;
   active=id(e);lastPointerTime=e.timeStamp;e.preventDefault();
   try{e.currentTarget?.setPointerCapture?.(e.pointerId);}catch{}
   onPress(e.timeStamp);
  },
  up:finish,cancel:finish,lostCapture:finish,
  leave(e){if(e.pointerType==='mouse'&&e.buttons===0)finish(e);},
  click(e){
   if(e.detail!==0||e.pointerType)return;
   const elapsed=e.timeStamp-lastPointerTime;
   if(elapsed>=0&&elapsed<500)return;
   onPress(e.timeStamp);
  },
  reset(){active=null;lastPointerTime=-Infinity;}
 };
}
