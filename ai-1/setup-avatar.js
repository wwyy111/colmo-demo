export const avatarStates={idle:'待机',listening:'聆听',processing:'整理与判断',speaking:'说明',waiting:'等待回应',executing:'执行体验',complete:'完成'};
export function butler(shape='line',state='waiting',small=false){
 return `<div class="butler ${small?'butler-small':''}" data-shape="${shape}" data-state="${state}" role="img" aria-label="${shape==='line'?'Dynamic Line':'Layered Glass'} · ${avatarStates[state]||'等待回应'}"><div class="butler-stage" aria-hidden="true"><span class="butler-field"></span><span class="butler-spine"></span><span class="butler-pane pane-one"></span><span class="butler-pane pane-two"></span><span class="butler-pane pane-three"></span><span class="butler-signal"></span></div><span class="butler-caption">${avatarStates[state]||'等待回应'}</span></div>`;
}
export function butlerPair(state='waiting',small=false){
 return `<section class="butler-pair ${small?'butler-pair-small':''}" aria-label="两套管家形象对照，同一状态"><div class="butler-pair-items">${[['line','Dynamic Line'],['glass','Layered Glass']].map(([shape,name])=>`<div class="butler-option">${butler(shape,state,small)}<span class="butler-option-name">${name}</span></div>`).join('')}</div><span class="butler-pair-state">${avatarStates[state]||'等待回应'}</span></section>`;
}
