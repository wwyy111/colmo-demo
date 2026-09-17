// These utterances are demo scripts, not real device receipts.
export const dialogue={
 request:{role:'user',text:'明天早上七点叫我，先用灯光，窗帘也开一点，尽量别吵醒旁边的人。'},
 recommend:{role:'ai',text:'按你刚才说的，明早先用柔光，窗帘也开一点。'},
 choose:{role:'user',text:'好，先体验一下。'},
 experience:{role:'ai',text:'好，来试试这套方案。'},
 feedback:{role:'user',text:'有点亮，灯光再暗一点，变化再慢一些。窗帘这样就可以。'},
 adjust:{role:'ai',text:'好，灯光再柔和一点，亮起来也慢一些。'},
 retryUser:{role:'user',text:'再体验一下吧。'},
 retry:{role:'ai',text:'好，再试一次。'},
 confirm:{role:'user',text:'就按这个方案启用吧。'},
 enabled:{role:'ai',text:'已启用，明早七点按这套方案唤醒。'},
 incomplete:{role:'user',text:'早上七点叫我，先用灯光。'},
 clarify:{role:'ai',text:'这次只用于明天，还是每个工作日？'},
 clarifyReply:{role:'user',text:'只用明天。'},
 backup:{role:'ai',text:'手表现在用不了，备用方式还需要你确认。'},
 conflict:{role:'ai',text:'你设置了免扰，这次就不加音箱了。'},
 lightFailure:{role:'ai',text:'灯光暂时没有响应，可以重新检查，或者先体验窗帘。'},
 stop:{role:'ai',text:'本次体验已停止，方案尚未启用。'},
 saved:{role:'ai',text:'方案修改已保留，确认前不会启用。'},
 disabled:{role:'ai',text:'已停用这套唤醒方案。'},
};
export function matchingRecording(manifest,id){const entry=manifest.voices?.[id];return entry&&entry.text===dialogue[id]?.text?entry:null;}
export function speechDuration(manifest,id){return matchingRecording(manifest,id)?.duration||Math.max(1800,(dialogue[id]?.text.length||0)*230);}
