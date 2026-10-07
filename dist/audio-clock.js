// Map the original input event to the same audible timeline used by drawing.
// Keep user calibration separate; never guess or double-apply device latency.
export function inputTime(timestamp,now,timeOrigin=0){
 if(!Number.isFinite(timestamp)||timestamp<=0)return now;
 const value=timestamp>1e12?timestamp-timeOrigin:timestamp;
 return Number.isFinite(value)&&value>=0?value:now;
}
export function audioTime(context,at,now){
 if(!context)return 0;
 let stamp;
 try{stamp=context.getOutputTimestamp?.();}catch{/* Some output drivers fail during device changes. */}
 if(stamp&&Number.isFinite(stamp.contextTime)&&stamp.contextTime>0&&
  Number.isFinite(stamp.performanceTime)&&Math.abs(now-stamp.performanceTime)<1000){
  return stamp.contextTime+(at-stamp.performanceTime)/1000;
 }
 // Older browsers and newly resumed contexts may not expose an output stamp.
 // Preserve their existing calibrated currentTime fallback and event delay.
 return context.currentTime+(at-now)/1000;
}
