const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cards={
 summary:{title:'我理解的需求',status:'整理需求',rows:[['时间','明早 07:00'],['优先方式','灯光渐亮，窗帘开一点'],['家庭要求','尽量不打扰伴侣']],note:'关联已授权的卧室设备'},
 summaryClarified:{title:'执行日期已补充',status:'需求已更新',rows:[['时间','明早 07:00，仅本次'],['已表达偏好','先用灯光']],note:'不将未表达的偏好写成用户要求'},
 draft:{title:'渐进唤醒方案',status:'草案 · 未启用',time:'07:00',rows:[['先柔和唤醒','灯光渐亮，窗帘受限开启'],['必要时补充','已授权的手表轻振'],['推荐理由','减少声音干扰，卧室音箱不参与']],actions:['体验一下','调整方案','确认启用'],note:'智能床不抬升；仅使用已授权的状态感知'},
 checking:{title:'准备短时体验',status:'正在检查',rows:[['体验范围','卧室灯光、窗帘'],['正在核验','设备响应与已确认范围']],note:'仅演示设备检查，不代表真实回执',actions:['停止体验']},
 experienceLight:{title:'灯光渐亮',status:'体验中 · 未启用',rows:[['正在体验','使用者侧柔光渐亮'],['设备响应','灯光已响应（演示）']],note:'窗帘下一步开启，音箱保持静默',actions:['停止体验']},
 experienceCurtain:{title:'窗帘开启一小部分',status:'体验中 · 未启用',rows:[['正在体验','在确认范围内引入自然光'],['设备响应','窗帘已响应（演示）']],note:'灯光保持，未进行正式唤醒',actions:['停止体验']},
 experienceEnd:{title:'体验结束',status:'等待反馈',rows:[['环境恢复','灯光与窗帘回到体验前状态'],['你的感受','亮度与变化节奏合适吗？']],actions:['调整方案','再次体验','确认启用'],note:'方案尚未启用'},
 adjusted:{title:'方案已更新',status:'待确认 · 未启用',rows:[['本次修改','灯光亮度调低，渐亮节奏放慢'],['保持不变','窗帘开度、时间、备用方式与免扰设置']],actions:['再次体验','确认启用','继续调整'],note:'参数更新不等于设备已执行'},
 retry:{title:'再体验调整后的方案',status:'再次体验',rows:[['这次变化','灯光更柔和，渐亮更慢'],['保持不变','窗帘在原定范围内开启']],actions:['停止体验'],note:'可随时叫停，确认前不启用'},
 saving:{title:'确认并启用',status:'检查与保存中',rows:[['正在核验','授权范围与关键设备响应'],['执行安排','保存为明早一次性唤醒']],note:'检查完成前仍未启用'},
 enabled:{title:'唤醒方案已启用',status:'已启用 · 演示',time:'07:00',rows:[['执行日期','明天，仅本次'],['可随时控制','调整或停用这套方案']],actions:['查看方案','停用'],note:'灯光、窗帘与备用安排已确认'},
 stopped:{title:'本次体验已停止',status:'未启用',rows:[['环境恢复','灯光与窗帘停止体验，回到原状态'],['方案保留','可继续调整或再次体验']],actions:['再次体验','调整方案','确认启用']},
 disabled:{title:'方案已停用',status:'停用 · 演示',rows:[['后续安排','不会按本演示方案自动执行'],['草案保留','可以查看后重新确认']],actions:['查看方案']},
 missing:{title:'执行日期待确认',status:'需要补充',rows:[['还需明确','仅明天，还是每个工作日？']],actions:['仅明天','每个工作日'],note:'明确说出“明天”时不重复追问'},
 conditions:{title:'方案条件待确认',status:'3 项待处理',tone:'warning',rows:[['备用偏好','未明确其他备用方式，不擅自补全'],['免扰冲突','音箱与家庭规则冲突，暂不加入'],['设备不可用','手表暂不可用，完整方案暂不启用']],actions:['体验可用设备','调整方案','重新检查'],note:'先解决相关条件，再确认完整方案'},
 lightFailure:{title:'灯光未响应',status:'体验未完成',tone:'warning',rows:[['未完成项','卧室灯光效果尚未验证'],['受影响范围','不能确认当前方案可完整执行']],actions:['重新检查','调整方案','结束体验'],note:'不把未响应设备标记为成功'},
 enableFailure:{title:'方案尚未启用',status:'启用失败',tone:'warning',rows:[['当前结果','不能确认明早会按此方案执行'],['下一步','重试或返回调整方案']],actions:['重试','返回调整'],note:'失败时不使用完成音效'},
};
export function setupCard(id,{compact=false}={}){
 const c=cards[id];if(!c)return '';
 return `<article class="setup-card ${compact?'setup-card-compact':''}" data-card="${id}" data-tone="${c.tone||'normal'}"><header><h4>${esc(c.title)}</h4><span>${esc(c.status)}</span></header>${c.time?`<div class="setup-time">${c.time}<small>明天的目标起床时间</small></div>`:''}<dl>${c.rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${!compact&&c.note?`<p class="setup-card-note">${esc(c.note)}</p>`:''}${!compact&&c.actions?`<div class="setup-actions">${c.actions.map((a,i)=>`<button ${i===0?'class="preferred"':''} data-setup-action="${esc(a)}">${esc(a)}</button>`).join('')}</div>`:''}</article>`;
}
export function deviceScope(){return `<details class="setup-rules"><summary>设备范围与免扰边界</summary><dl>${[
 ['灯光、窗帘','参与柔和唤醒与短时体验，强度和开度受确认范围限制。'],
 ['音箱','主线不启用，避免声音干扰。'],['智能床','本次不抬升、不振动，相关功能未纳入方案。'],
 ['毫米波雷达','仅在用户授权后提供在床等状态；本演示不代表真实识别结果。'],['手表','可选备用，须已授权且可用，不在本次体验中振动。'],
 ['4 寸中控屏、App','接收需求，查看、修改与确认方案。'],['使用范围','当前用户，明天一次性执行；随时可调整或停用。']
 ].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></details>`;}
