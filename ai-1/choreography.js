// Independent, deterministic action preview. The avatar is acted animation, not inferred sensor evidence.
export const actionDuration=34;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
export function actionAt(t){
 t=Math.max(0,Math.min(actionDuration,t));
 const stage=t<5?0:t<11?1:t<17?2:t<22?3:t<30?4:5;
 return{time:t,stage,curtain:.04+.91*ramp(t,1,10),bed:32*ramp(t,5,11),sit:ramp(t,11,17),edge:ramp(t,17,20),stand:ramp(t,20,22),walk:ramp(t,22,30),wash:ramp(t,30,33),day:.2+.65*ramp(t,1,11),light:.08+.3*ramp(t,1,8),
 label:['01 · 晨光进入｜窗帘缓缓开启','02 · 舒适起身｜使用者侧靠背抬升至 32°','03 · 醒来伸展｜人物坐起、伸展双臂','04 · 床沿过渡｜转身落脚，扶床站起','05 · 走向主卫｜沿通道行走，伴侣继续休息','06 · 洗漱准备｜到达台盆，俯身抬手'][stage]};
}
export function nodeAction(n){
 if(n===18||n===19)return {...actionAt(20),time:20};
 if(n>=24&&n<=29)return actionAt(34);
 // Bed assistance is an explicit optional action preview, not an automatic wake inference.
 return {...actionAt(0),curtain:null,day:null,light:null};
}
