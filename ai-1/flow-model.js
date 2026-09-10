export const flowLinks={
 'S1-SCENE-I01':[1,11,22],'S1-SCENE-I02':[1,11,22],'S1-SCENE-I03':[2,12,23],'S1-SCENE-I04':[2,12,23],
 'S1-T01-A01':[14],'S1-T01-A02':[13],'S1-T01-A03':[13,17],'S1-T01-A04':[13,15],'S1-T01-A05':[14,15,16],'S1-T01-A06':[14],'S1-T01-A07':[14,18],'S1-T01-A08':[17],'S1-T01-A09':[17,18],
 'S1-T02-A01':[3],'S1-T02-A02':[1,3],'S1-T02-A03':[3],'S1-T02-A04':[4],'S1-T02-A05':[5],'S1-T02-A06':[5,6],'S1-T02-A07':[7],
 'S1-T03-A01':[24],'S1-T03-A02':[23,24],'S1-T03-A03':[24],'S1-T03-A04':[25],'S1-T03-A05':[25,26],'S1-T03-A06':[27],'S1-T03-A07':[27,28],'S1-T03-A08':[29],
 'S1-SCENE-R01':[7,18,28],'S1-SCENE-R02':[8,19,29],'S1-SCENE-L01':[8,19,29],'S1-SCENE-L02':[8,19,29],
 'S1-SCENE-O01':[9,20,30],'S1-SCENE-O02':[10,21,31]
};
export const flowScripts={
 snooze:'本次唤醒延后五分钟，声音和触觉已暂停。卧室环境和热水任务保持各自原安排。',
 water:'本次热水预热已停止，其他成员的水路不受影响。唤醒和卧室环境任务保持原安排。',
 failure:'音箱播放失败，已核验手表备用轻振。清醒状态仍未知，卧室环境和备水任务保持原安排。',
 feedback:'已记录本次体感。将结合七到十四天的可比记录观察，不会因为一次反馈修改长期规则。'
};
export function initialTasks(){return{wake:'柔光进行中 · 清醒未知',environment:'静音预调中 · 尚未达标',water:'主卫预热中 · 末端温度待核验'};}
export function changeTask(tasks,action){const next={...tasks};if(action==='snooze')next.wake='提醒已暂停 · 本次延后 5 分钟'+(tasks.wake.includes('音箱失败')?' · 音箱故障未解除':'');if(action==='water')next.water='本次循环已停止 · 恢复常规模式';if(action==='failure')next.wake='音箱失败 · 轻振已执行 · 清醒未知';return next;}
