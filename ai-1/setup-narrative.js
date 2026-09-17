// Storyboard annotations for reviewers, not spoken lines or live reasoning traces.
const explanations={
 overview:'AI 将结合用户需求、设备能力与免扰规则，推荐唤醒安排。',
 walking:'AI 等待用户发起设置，暂不执行设备动作。',
 request:'AI 聆听起床时间、唤醒偏好和免扰要求。',
 understand:'AI 提取时间与偏好，关联已授权设备，整理生成方案所需的信息。',
 recommend:'AI 根据本次需求，推荐灯光优先、窗帘辅助的方案，并避开声音干扰。',
 choose:'AI 等待用户选择，不把生成草案当成启用。',
 experienceIntro:'AI 根据用户选择检查设备，准备演示这套方案。',
 light:'AI 让灯光逐渐亮起，展示首次推荐的亮度与节奏。',
 curtain:'AI 小幅开启窗帘，让用户体验自然光与灯光的配合。',
 experienceEnd:'AI 恢复体验前的环境，等待用户反馈。',
 feedback:'AI 聆听用户对亮度和变化节奏的感受。',
 adjust:'AI 将“太亮、慢一点”转为更低亮度和更长渐亮时间，只修改相关设置。',
 retryUser:'AI 接收再次体验的选择，准备验证调整效果。',
 retryIntro:'AI 准备按修改后的方案，再演示一次。',
 retryDark:'AI 先将灯光熄灭，为重新体验建立清晰的起点。',
 retryLight:'AI 从熄灭状态缓慢渐亮，展示调整后的柔和效果。',
 retryCurtain:'AI 沿用原定窗帘安排，不改动用户已认可的部分。',
 retryEnd:'AI 结束再次体验，等待最终确认。',
 confirm:'AI 接收启用确认，尚未宣告设置完成。',
 saving:'AI 核对授权与设备条件，保存本次唤醒安排。',
 enabled:'AI 确认方案已启用，保留后续调整和停用入口。',
 incomplete:'AI 识别到执行日期不明确，只追问必要信息。',
 clarify:'AI 确认是一次性唤醒，还是重复安排。',
 clarifyReply:'AI 接收补充信息，更新执行日期。',
 conditions:'AI 合并提示备用缺项、免扰冲突和设备不可用，不擅自替换。',
 conflict:'AI 排除与免扰规则冲突的音箱，保留可用方案待确认。',
 conditionsWait:'AI 等待用户处理条件，暂不启用完整方案。',
 checkLight:'AI 检查灯光响应，不提前显示体验成功。',
 lightFailure:'AI 发现灯光未响应，标明未完成项，提供重查或调整。',
 failureWait:'AI 保留未完成状态，等待用户选择下一步。',
 stopped:'AI 停止本次体验，恢复环境并保留草案。',
 disabled:'AI 停用唤醒安排，保留草案供以后查看。',
};
export function explanationFor(shot){
 if(shot.id==='understand'&&shot.card==='summaryClarified')return 'AI 将补充的日期写入需求，不添加用户未表达的偏好。';
 if(shot.card==='custom')return 'AI 根据当前修改项演示设备效果，未确认前不启用。';
 return explanations[shot.id]||'AI 根据当前需求与已确认条件处理方案。';
}
export function deviceStatuses(shot){
 if(!shot)return {};
 const id=shot.id;
 if(['light','retryLight'].includes(id))return {lamp:'渐亮中'};
 if(id==='retryDark')return {lamp:'已熄灭 · 准备体验'};
 if(['curtain','retryCurtain'].includes(id))return {lamp:'保持亮度',curtain:shot.curtain[0]===shot.curtain[1]?'保持关闭':'开启中'};
 if(['experienceEnd','retryEnd'].includes(id))return {lamp:'恢复中',curtain:'恢复中'};
 if(['checkLight','experienceIntro'].includes(id))return {lamp:'检查中'};
 if(['lightFailure','failureWait'].includes(id))return {lamp:'未响应'};
 return {};
}
