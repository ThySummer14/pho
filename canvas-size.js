// ResizeObserver and window resize can report the same size in one frame.
// Reassigning an unchanged canvas dimension still clears/reallocates its bitmap.
export function resizeCanvas(canvas,context,deviceRatio=1){
 const d=Number.isFinite(deviceRatio)&&deviceRatio>0?Math.min(deviceRatio,2):1;
 const width=Math.max(1,Math.floor(canvas.clientWidth*d)),height=Math.max(1,Math.floor(canvas.clientHeight*d));
 let changed=false;
 if(canvas.width!==width){canvas.width=width;changed=true;}
 if(canvas.height!==height){canvas.height=height;changed=true;}
 context.setTransform(d,0,0,d,0,0);
 return changed;
}
