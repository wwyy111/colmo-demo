import {setupSequence} from './setup-storyboard.js';
import {dialogue,matchingRecording} from './setup-dialogue.js';
const purposes=[
 '正常流程以聆听为主，不重复询问；仅在执行日期缺失时追问，帮助用户补齐必要信息。',
 '简要说明推荐的唤醒方式；遇到条件冲突时解释问题，帮助用户作出选择。',
 '提示体验开始；设备未响应时说明问题，并告诉用户接下来可以怎么处理。',
 '简短回应本次修改，并在保存完成后确认启用结果，不重复复述整套方案。',
];
const effects={enter:['进入提示','提示管家已进入聆听状态。'],generate:['方案更新提示','提示方案已生成或更新，引导用户查看。'],complete:['完成提示','在保存完成后确认操作结果。'],exception:['异常提示','提醒有条件需要处理，同一异常案例只响一次。']};
const titles={clarify:'补充执行日期',recommend:'说明推荐方案',backup:'说明备用条件',conflict:'说明免扰冲突',experience:'开始体验',retry:'再次体验',lightFailure:'灯光未响应',stop:'停止体验',adjust:'回应方案调整',enabled:'确认启用',saved:'确认保存',disabled:'确认停用'};
export function audioPresentation(manifest,moment,mode,voiceIds){
 const branch=['missing','conditions','lightFailure'].includes(mode)?mode:'normal';
 const sequence=setupSequence(manifest,true,branch).filter(s=>s.moment===moment);
 const effectIds=[...new Set(sequence.map(s=>s.effect).filter(Boolean))];
 const ids=branch==='normal'?voiceIds:[...new Set(sequence.map(s=>s.voice).filter(Boolean))];
 const player=(a,label)=>`<audio controls preload="metadata" src="./media/setup/${a.file}" aria-label="${label}"></audio>`;
 const sounds=effectIds.map(id=>{const a=manifest.effects?.[id],note=effects[id];return `<div class="audio-block"><h4>${note[0]}</h4><p>${note[1]}</p>${a?player(a,note[0]):'<p>提示音待补充。</p>'}</div>`;}).join('');
 const voices=ids.filter(id=>dialogue[id]?.role==='ai').map(id=>{const a=matchingRecording(manifest,id);return `<div class="audio-block" data-voice="${id}"><h4>${titles[id]||'语音回应'}</h4><p>${dialogue[id].text}</p>${a?player(a,titles[id]||'AI 管家语音'):'<small>文案已更新，待补新录音。</small>'}</div>`;}).join('');
 return `<section class="audio-section"><h3>提示音</h3>${sounds||'<p class="channel-note">本时间点不额外播放提示音，避免打断设备体验。</p>'}</section><section class="audio-section"><h3>AI 管家语音</h3><p class="channel-note">${purposes[moment]}</p>${voices}</section>`;
}
