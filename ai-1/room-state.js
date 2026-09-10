export const deviceNames={air:'空调与新风',humidifier:'智能加湿器',lamp:'床侧柔光',speaker:'床侧音箱与手表',curtain:'智能窗帘',water:'热水器与循环泵'};
export function roomState(node,status='ready'){
 const n=node.number,done=['success','settled'].includes(status),isWater=n>=22;
 const s={nodeNumber:n,day:n>=18&&!['setup','learn','check'].includes(node.kind)?.85:.2,light:n>=18?.3:.08,curtain:n>=18?.8:.04,air:n>=3&&n<=8,humidity:n===4,water:n===25,heat:n===25,temp:n===25?(done?38:35):28,haptic:n===16&&done,sound:n===15&&done,awake:n>=18&&n<=19,active:[],danger:node.kind==='risk',night:node.sleeping};
 if([1,2,11,12,22,23].includes(n)){s.day=.16;s.light=.08;s.curtain=.04;}
 if([13,14,15,16,17].includes(n)){s.day=.35;s.light=n===13?.1:n===14?.25:n===17?.08:.4;s.curtain=n===13?.08:n===17?.05:.22;}
 if(n===14&&done){s.light=.25;s.curtain=.25;}
 if(n===3&&done)s.humidity=true;
 if(n===24&&done){s.water=true;s.heat=true;}
 if(n===5){s.humidity=false;s.air=true;}
 if(n===6&&done){s.air=false;s.humidity=false;}
 if(n===7){s.air=true;s.humidity=false;}
 if(n===17&&done){s.light=.08;s.sound=false;s.haptic=false;}
 if(n===18){s.sound=false;s.haptic=false;s.light=.3;}
 if(n===26){s.water=!done;s.heat=!done;s.temp=52;}
 if(n===27){s.water=!done;s.heat=!done;s.temp=35;}
 if(n===28){s.water=false;s.heat=false;s.temp=38;}
 if(n<=10)s.active=['air','humidifier'];else if(n<=21)s.active=['lamp','curtain',...(n>=15?['speaker']:[])];else s.active=['water'];
 if(status==='rejected'||status==='restored'){s.water=false;s.heat=false;s.haptic=false;s.sound=false;s.air=false;s.humidity=false;}
 s.devices={
 air:s.air?'模拟回执：空调低风速、新风静音运行':'模拟状态：待机 / 常规模式',
 humidifier:n===5?(done?'雾化停止已核验 · 缺水仍未解决':'缺水异常 · 停止雾化待回执'):s.humidity?'模拟回执：低档雾化，当前湿度 43%':'模拟状态：雾化停止 / 待机',
 lamp:`使用者侧亮度 ${Math.round(s.light*100)}% · 伴侣侧保持 3% 夜灯`,
 speaker:n===16?(done?'音箱播放失败 · 手表轻振已执行 · 清醒未知':'音箱播放失败 · 手表备用请求待回执'):n===17&&done?'本次提醒已暂停 · 07:06 继续':s.sound?'模拟回执：床侧声音提醒 20% · 未确认清醒':'音箱待机 · 手表静默 · 床体振动未授权',
 curtain:`模拟开度 ${Math.round(s.curtain*100)}% · 仅演示渐进采光，不代表实际清醒`,
 water:n===26?(done?'加热与循环已停止 · 水温异常未解除 · 禁止自动重启':'水温回执异常偏高 · 加热/循环停止待确认'):s.water?`模拟回执：主卫预热中，水温 ${s.temp}°C · 龙头关闭`:n===28?'模拟回执：循环泵停止，热水器常规模式':`模拟状态：主卫水路待机 · 龙头关闭`
 };
 return s;
}
