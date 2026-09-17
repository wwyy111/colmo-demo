import {speechDuration} from './setup-dialogue.js';
export const momentNames=['聆听需求','推荐方案','引导体验','调整与启用'];
// Physical values are illustrative normalized values, never claimed as measurements.
export function setupSequence(manifest={},repeat=true,branch='normal'){
 const voice=(id,min=0)=>Math.max(min,speechDuration(manifest,id)+650);
 const shot=(id,moment,label,props={})=>({id,moment,label,duration:3000,view:'setupInput',state:'waiting',card:null,light:[.06,.06],curtain:[.03,.03],...props});
 const baseline={view:'setupInput',state:'listening'};
 if(branch==='missing')return [shot('incomplete',0,'补充执行日期',{...baseline,voice:'incomplete',role:'user',duration:voice('incomplete'),bubble:true}),shot('clarify',0,'必要信息待确认',{voice:'clarify',state:'speaking',card:'missing',duration:voice('clarify'),effect:'exception'}),shot('clarifyReply',0,'明确执行日期',{voice:'clarifyReply',role:'user',bubble:true,state:'listening',duration:voice('clarifyReply'),card:'missing'}),shot('understand',0,'需求已补充',{card:'summaryClarified',state:'processing'})];
 if(branch==='conditions')return [shot('conditions',1,'条件异常 · 合并说明',{card:'conditions',state:'speaking',voice:'backup',effect:'exception',duration:voice('backup')}),shot('conflict',1,'免扰规则冲突',{card:'conditions',state:'speaking',voice:'conflict',duration:voice('conflict')}),shot('conditionsWait',1,'等待处理',{card:'conditions',duration:3000})];
 if(branch==='lightFailure')return [shot('checkLight',2,'检查灯光响应',{view:'setupLight',card:'checking',state:'processing',duration:2500}),shot('lightFailure',2,'启用未成功',{view:'setupLight',card:'lightFailure',voice:'lightFailure',state:'speaking',effect:'exception',duration:voice('lightFailure')}),shot('failureWait',2,'等待处理',{card:'lightFailure',view:'setupLight'})];
 if(branch==='direct')return [shot('confirm',3,'确认启用',{voice:'confirm',role:'user',bubble:true,state:'listening',card:'draft',duration:voice('confirm')}),shot('saving',3,'检查并保存',{card:'saving',state:'processing',duration:3000}),shot('enabled',3,'方案已启用',{card:'enabled',state:'complete',voice:'enabled',effect:'complete',duration:voice('enabled'),view:'setupWide'})];
 if(branch==='stop')return [shot('stopped',2,'体验已停止',{card:'stopped',voice:'stop',state:'speaking',duration:voice('stop')})];
 if(branch==='disabled')return [shot('disabled',3,'方案已停用',{card:'disabled',voice:'disabled',state:'speaking',duration:voice('disabled')})];
 const shots=[
  shot('overview',0,'全景概览',{view:'overview',duration:4000,state:'idle'}),
  shot('walking',0,'走向中控屏',{view:'setupWide',duration:4500,state:'idle'}),
  shot('request',0,'用户表达需求',{...baseline,voice:'request',role:'user',bubble:true,duration:voice('request'),effect:'enter'}),
  shot('understand',0,'理解需求与关联设备',{card:'summary',state:'processing',duration:2500}),
  shot('recommend',1,'推荐渐进唤醒方案',{card:'draft',state:'speaking',voice:'recommend',effect:'generate',duration:voice('recommend')}),
  shot('choose',1,'用户选择体验',{card:'draft',state:'listening',bubble:true,role:'user',voice:'choose',duration:voice('choose')}),
  shot('experienceIntro',2,'开始短时体验',{card:'checking',voice:'experience',state:'speaking',duration:voice('experience')}),
  shot('light',2,'灯光柔和渐亮',{view:'setupLight',card:'experienceLight',state:'executing',duration:6500,light:[.06,.30]}),
  shot('curtain',2,'窗帘受限开启',{view:'setupCurtain',card:'experienceCurtain',state:'executing',duration:5500,light:[.30,.30],curtain:[.03,.20]}),
  shot('experienceEnd',2,'体验结束，恢复环境',{card:'experienceEnd',state:'waiting',duration:2000,light:[.30,.06],curtain:[.20,.03]}),
  shot('feedback',3,'用户评价体验',{voice:'feedback',role:'user',bubble:true,state:'listening',card:'experienceEnd',duration:voice('feedback')}),
  shot('adjust',3,'按反馈调整方案',{card:'adjusted',voice:'adjust',state:'speaking',effect:'generate',duration:voice('adjust')}),
 ];
 if(repeat)shots.push(shot('retryUser',3,'选择再次体验',{card:'adjusted',voice:'retryUser',role:'user',bubble:true,state:'listening',duration:voice('retryUser')}),shot('retryIntro',2,'按新方案再次体验',{card:'retry',voice:'retry',state:'speaking',duration:voice('retry')}),shot('retryDark',2,'重新体验 · 灯光熄灭',{view:'setupLight',card:'retry',state:'executing',duration:1800,light:[0,0]}),shot('retryLight',2,'更柔和、更缓慢的灯光',{view:'setupLight',card:'retry',state:'executing',duration:8500,light:[0,.19]}),shot('retryCurtain',2,'保持原定窗帘安排',{view:'setupCurtain',card:'retry',state:'executing',duration:5500,light:[.19,.19],curtain:[.03,.20]}),shot('retryEnd',3,'再次体验结束',{card:'adjusted',duration:2000,light:[.19,.06],curtain:[.20,.03]}));
 shots.push(shot('confirm',3,'用户确认启用',{card:'adjusted',voice:'confirm',role:'user',bubble:true,state:'listening',duration:voice('confirm')}),shot('saving',3,'检查授权、设备与保存状态',{card:'saving',state:'processing',duration:3000}),shot('enabled',3,'方案已启用',{card:'enabled',voice:'enabled',state:'complete',effect:'complete',duration:voice('enabled'),view:'setupWide'}));
 return shots;
}
