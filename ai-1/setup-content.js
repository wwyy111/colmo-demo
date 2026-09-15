// Authored design proposal. All card states are demonstrative, not device receipts.
export const setup = {
 title:'制定并启用唤醒方案',
 description:'用自然语言描述唤醒需求，AI 推荐设备安排；支持短时体验和反馈调整，确认后启用。',
 goal:'按时、舒适地醒来，尽量不打扰伴侣，也不必逐台配置设备。',
 pain:'不知道如何组合设备、设置强度，也难以提前判断方案是否舒适、能否执行。',
 points:[['理解需求','提取时间、偏好和免扰要求，关联已授权设备，只追问必要缺项。'],['推荐策略','补全唤醒顺序和备用方式，说明关键理由，提供可行替代方案。'],['验证体验','检查设备响应，按需组织短时体验，支持随时停止。'],['反馈调整','根据用户感受修改相关设置，保留其他安排，确认后启用。']],
 boundary:'只使用已授权的数据和设备；短时体验不代表正式启用，也不能保证实际唤醒效果。',
 risks:[['介入过多','反复追问、逐台播报或强制体验，会增加配置负担；擅自修改安排会削弱信任。'],['介入过少','只生成卡片、不解释取舍或核验设备，用户难以判断方案是否适合、是否可用。']],
};
export const moments=[
 {title:'表达需求',story:'用户走到中控屏前，描述起床时间、唤醒偏好和免扰要求。',input:'明天早上七点叫我，先用灯光，尽量别吵醒旁边的人。',ai:'理解目标与限制，关联可用设备；已有信息不重复询问，关键缺项才追问。',path:'聆听 → 整理需求',speech:'',sound:'进入时播放简短提示音，用户表达过程中不主动播报。',visual:'先概览设备，再聚焦用户与中控屏。用户表达结束后短暂呈现需求摘要，不提前生成方案卡。',normal:'正常情况 · 理解需求',exception:'必要追问 · 日期不明确',faultTitle:'执行安排待确认',faultText:'尚不明确是仅执行一次，还是按工作日重复。',faultSpeech:'这次只用于明天，还是每个工作日？',faultActions:['仅明天','每个工作日'],faultNote:'仅在日期或重复安排不明确时追问。当前示例已说“明天”，不重复询问。'},
 {title:'推荐方案',story:'用户查看推荐安排，选择体验、调整或直接确认。',ai:'将用户目标转为设备策略，补全顺序与备用方式，并解释影响选择的关键理由。',path:'生成方案 → 说明 → 等待选择',speech:'建议先用灯光，必要时加入手表轻振，卧室音箱不参与。你可以先体验，也可以直接确认。',sound:'方案生成时使用轻提示音，不使用启用成功音；说明结束后静默等待。',visual:'管家说明与方案卡同步出现。突出推荐理由，草案明确标注未启用；规则详情按需展开。',normal:'正常情况 · 推荐安排',exception:'条件不足 · 备用方式待确认',faultTitle:'方案有待确认',faultText:'手表暂不可用，当前缺少已确认的备用方式。',faultSpeech:'手表暂不可用。可以先体验灯光，或调整备用安排；未确认前不启用完整方案。',faultActions:['调整方案','重新检查','暂不启用'],faultNote:'替代方式也须已授权且可用，不自动加入未知设备。'},
 {title:'确认体验',story:'用户选择短时体验，感受灯光变化；不合适时可随时停止。',ai:'在允许范围内运行体验，同步核验设备响应，不逐台播报普通检查结果。',path:'执行体验 → 等待反馈',speech:'先体验一下灯光渐亮的效果，你可以随时叫停。',sound:'简短说明体验开始；普通设备检查不逐台播报，失败时再提示。',visual:'镜头聚焦灯具与受光区域，配合体验卡显示响应状态。短时体验结束后停止临时动作。',normal:'正常情况 · 短时体验',exception:'设备异常 · 灯光未响应',faultTitle:'部分体验未完成',faultText:'卧室灯暂未响应，灯光效果尚未验证。',faultSpeech:'卧室灯暂未响应，还不能确认灯光效果。你可以重新检查，或调整方案。',faultActions:['重新检查','调整方案','结束体验'],faultNote:'设备未响应不显示体验成功。体感体验可选，必要的设备和授权检查不能跳过。'},
 {title:'反馈与确认',story:'用户评价体验效果，提出修改；满意后确认启用。',input:'有点亮，调暗一点，变化再慢一些。',ai:'把体验反馈转为具体设置变化，仅修改相关部分；需要时再次体验，最终确认后保存启用。',path:'聆听 → 调整 → 等待确认 → 完成',speech:'已调低方案中的灯光亮度，并放慢渐亮节奏，其他安排不变。要再体验一下，还是按这个方案启用？',sound:'反馈时聆听，调整后简短说明变化；保存和启用均成功后才使用完成反馈。',visual:'更新卡突出本次修改与保持不变的安排。区分方案已更新、待确认和启用成功，不以参数更新代替设备响应。',normal:'正常情况 · 反馈调整',exception:'异常情况 · 启用未成功',faultTitle:'方案尚未启用',faultText:'启用未成功，不能确认明早会按此方案执行。',faultSpeech:'方案还没有启用成功，请重试。',faultActions:['重试','返回调整'],faultNote:'没有修改需求时直接确认原方案，不强制用户提供反馈。'},
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const speechFor=(i,fault,enabled=false)=>fault?moments[i].faultSpeech:enabled?'已启用，明早七点按这套方案唤醒。':moments[i].speech;
export function cardMarkup(i,fault=false,enabled=false,compact=false){
 const m=moments[i];let title,status,rows,actions;
 if(fault){title=m.faultTitle;status='待处理';rows=[['当前问题',m.faultText],['处理原则',m.faultNote]];actions=m.faultActions;}
 else if(i===0){title='需求摘要';status='整理中';rows=[['时间','明早 07:00'],['偏好','灯光优先'],['要求','减少对伴侣的打扰']];actions=[];}
 else if(i===1){title='渐进唤醒方案';status='草案 · 未启用';rows=[['目标时间','明早 07:00'],['推荐安排','先用灯光渐亮；必要时加入手表轻振。'],['推荐理由','你希望先用灯光，并减少声音干扰，因此不启用卧室音箱。'],['备用条件','手表已授权且可用时参与。']];actions=['体验一下','调整方案','确认启用'];}
 else if(i===2){title='体验灯光渐亮';status='体验中 · 尚未启用';rows=[['当前体验','灯光渐亮'],['设备状态','正在检查'],['说明','本次为短时效果体验，不改变正式启用状态。']];actions=['停止体验'];}
 else if(enabled){title='唤醒方案已启用';status='启用成功';rows=[['执行安排','明早 07:00'],['说明','将按已确认方案执行，可随时调整或停用。']];actions=['查看方案','停用'];}
 else{title='方案已更新';status='待确认 · 未启用';rows=[['本次修改','灯光亮度调低，渐亮节奏放慢。'],['保持不变','起床时间、设备顺序和免扰设置。']];actions=['再次体验','确认启用','继续调整'];}
 const shown=compact?rows.slice(0,i<=1?3:2):rows;
 return `<article class="setup-card ${compact?'setup-card-compact':''}"><header><h4>${esc(title)}</h4><span>${esc(status)}</span></header><dl>${shown.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${!compact&&actions.length?`<div class="setup-actions">${actions.map(a=>`<button data-setup-action="${esc(a)}">${esc(a)}</button>`).join('')}</div>`:''}</article>`;
}
export function rulesMarkup(){return `<details class="setup-rules"><summary>规则详情</summary><dl>${[['适用成员','当前用户'],['执行日期','明天'],['设备范围','已授权的卧室灯、手表'],['免扰设置','卧室音箱不参与，灯光不超过确认的强度上限。'],['数据用途','仅在获得授权后，使用相关状态辅助判断唤醒进度。']].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></details>`;}
