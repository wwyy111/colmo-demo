import {createAvatar} from './avatar.js';
import {dialogue} from './setup-dialogue.js';
import {actionAt,actionDuration,nodeAction} from './choreography.js';
import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
export function createRoom(container,hotspots,onSelect){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#172631');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;container.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(38,1,.1,70);camera.position.set(10.5,8.3,12);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.1,0);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.minDistance=6;controls.maxDistance=20;controls.maxPolarAngle=Math.PI*.475;controls.minPolarAngle=.28;
 scene.add(new THREE.HemisphereLight('#accadd','#55504d',2.2));
 const sun=new THREE.DirectionalLight('#ffe0bd',2);sun.position.set(-5,8,-1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:30});sun.shadow.normalBias=.035;scene.add(sun);
 const fill=new THREE.DirectionalLight('#a3c7ee',1.25);fill.position.set(6,5,8);scene.add(fill);
 const root=new THREE.Group();scene.add(root);
 const mat=(color,roughness=.6,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const m={wood:mat('#887360'),darkWood:mat('#51453e'),wall:mat('#a1a59f',.95),linen:mat('#e0ded3',.97),blanket:mat('#9eafb0',1),pillow:mat('#ebe7d9',1),stone:mat('#bbbeb5',.4),metal:mat('#a9b8b9',.22,.8),dark:mat('#1c2d34',.35,.25),gold:mat('#ae9a78',.3,.65),rug:mat('#959c92',1)};
 function box(w,h,d,x,y,z,material,parent=root){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function rounded(w,h,d,r,x,y,z,material,parent=root){const shape=new THREE.Shape(),a=w/2,b=d/2;shape.moveTo(-a+r,-b);shape.lineTo(a-r,-b);shape.quadraticCurveTo(a,-b,a,-b+r);shape.lineTo(a,b-r);shape.quadraticCurveTo(a,b,a-r,b);shape.lineTo(-a+r,b);shape.quadraticCurveTo(-a,b,-a,b-r);shape.lineTo(-a,-b+r);shape.quadraticCurveTo(-a,-b,-a+r,-b);const geo=new THREE.ExtrudeGeometry(shape,{depth:h-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:8});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2+r,0);const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cyl(r1,r2,h,x,y,z,material,parent=root){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,48),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function ball(r,x,y,z,material,parent=root){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function tube(points,r,material,parent=root){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,8,false),material);parent.add(mesh);return mesh;}
 function ring(radius,tubeRadius,x,y,z,material,parent=root){const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tubeRadius,8,60),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function tex(kind){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle=kind==='wood'?'#9d8b75':'#b4b5a7';c.fillRect(0,0,512,512);let seed=151;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};for(let i=0;i<500;i++){c.strokeStyle=`rgba(45,48,42,${rnd()*.1})`;c.lineWidth=.5+rnd();c.beginPath();const x=rnd()*512,y=rnd()*512;c.moveTo(x,y);c.lineTo(x+rnd()*8,y+(kind==='wood'?200:rnd()*15));c.stroke();}const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
 m.wood.map=tex('wood');m.rug.map=tex('linen');
 const warmMat=new THREE.MeshStandardMaterial({color:'#ffdeb1',emissive:'#f8c781',emissiveIntensity:.8});const glowMat=new THREE.MeshBasicMaterial({color:'#9cb9d0',transparent:true,opacity:.35});
 // Architectural cutaway: the right hand suite is a real modeled washroom.
 box(10.1,.23,7.1,0,-.18,0,m.darkWood);box(10,.06,7,0,-.035,0,m.wood);
 for(let i=-12;i<=12;i++)box(.009,.002,6.96,i*.4,.003,0,mat('#7e7668'));
 box(10,3.8,.14,0,1.84,-3.47,m.wall);box(.14,3.8,3.0,-4.96,1.84,-2,m.wall);
 // Bedroom wall panels and upholstered headboard.
 for(let i=0;i<10;i++)box(.013,3.6,.03,-4.5+i*.63,1.87,-3.37,m.darkWood);
 box(5.05,1.27,.13,-2.065,.97,-3.29,m.wood);
 rounded(3.06,1.22,.23,.075,-1.48,1.04,-2.48,m.blanket);
 // Soft bed, two pillows, folded duvet and a low upholstered bench.
 rounded(3.18,.32,3.65,.1,-1.48,.37,-.72,m.darkWood);
 // Split adjustable mattress: only the user's upper section pivots at the hip hinge.
 rounded(1.48,.28,3.48,.07,-2.26,.65,-.72,m.linen);
 rounded(1.48,.28,1.96,.07,-.73,.65,.04,m.linen);
 const bedBack=new THREE.Group();bedBack.position.set(-.73,.65,-.94);root.add(bedBack);
 rounded(1.48,.28,1.52,.065,0,0,-.76,m.linen,bedBack);
 rounded(1.13,.17,.55,.06,0,.22,-1.12,m.pillow,bedBack);
 rounded(1.13,.17,.55,.06,-2.26,.87,-2.06,m.pillow);
 // Folded cover leaves the articulated figures and their movements visible.
 rounded(1.43,.11,1.05,.035,-2.26,.91,.49,m.blanket);
 const userCover=rounded(1.43,.11,.6,.035,-.73,.91,.72,m.blanket);
 const requestBubble=document.createElement('div');requestBubble.className='request-bubble';requestBubble.setAttribute('role','img');requestBubble.setAttribute('aria-label','用户正在描述需求');requestBubble.innerHTML='<span></span><span></span><span></span>';requestBubble.hidden=true;container.parentElement.append(requestBubble);
 const userAvatar=createAvatar(root);const partnerAvatar=createAvatar(root,{color:'#a49a8f',skin:'#bea28d'});
 const bedLink=cyl(.028,.028,.65,-.73,.53,-1.6,m.metal);bedLink.rotation.x=.35;
 rounded(2.4,.18,.61,.06,-1.48,.56,1.85,m.blanket);for(const x of [-2.43,-.53])for(const z of [1.65,2.03])cyl(.025,.025,.43,x,.26,z,m.metal);
 rounded(4.55,.025,4.15,.01,-1.46,.045,.11,m.rug);
 // Nightstands and independently controlled lamps; partner side stays dim.
 const lamps=[];
 for(const [index,x] of [-3.57,.62].entries()){
  box(.83,.52,.77,x,.3,-1.91,m.wood);box(.87,.045,.81,x,.58,-1.91,m.stone);box(.64,.013,.02,x,.48,-1.51,m.gold);
  cyl(.16,.16,.03,x,.63,-2.03,m.gold);cyl(.015,.015,.39,x,.83,-2.03,m.gold);cyl(.2,.28,.24,x,1.12,-2.03,m.pillow);
  const lampMaterial=warmMat.clone();cyl(.245,.245,.014,x,.995,-2.03,lampMaterial);const light=new THREE.PointLight('#ffd5a1',index===0?1.7:.14,4,2);light.position.set(x,1.03,-2.03);scene.add(light);lamps.push({light,mat:lampMaterial});
 }
 // Wall control screen used by the configuration storyboard.
 box(.8,.52,.05,1.1,1.55,-3.34,m.dark);
 box(.72,.44,.008,1.1,1.55,-3.307,new THREE.MeshBasicMaterial({color:'#f1f4ed'}));
 for(let i=0;i<3;i++)box(.54,.045,.01,1.1,1.67-i*.105,-3.297,new THREE.MeshBasicMaterial({color:i===2?'#48675a':'#b3c0b5'}));
 // Device terminal and the authorised watch on the user's nightstand.
 box(.28,.17,.03,-3.56,.72,-1.63,m.dark);box(.245,.13,.007,-3.56,.72,-1.61,new THREE.MeshBasicMaterial({color:'#86b9c8'}));
 box(.055,.027,.28,-3.76,.629,-1.82,m.dark);rounded(.12,.035,.14,.012,-3.76,.65,-1.82,m.metal);box(.087,.005,.104,-3.76,.671,-1.82,m.dark);
 const watchRing=ring(.13,.008,-3.76,.68,-1.82,glowMat);watchRing.rotation.x=-Math.PI/2;
 cyl(.095,.095,.14,-3.33,.675,-1.82,m.dark);ring(.084,.006,-3.33,.75,-1.82,glowMat).rotation.x=-Math.PI/2;
 // Window glazing and movable pleated curtains on the left wall return.
 box(.035,2.65,2.15,-4.86,2.02,-1.63,m.dark);const skyMat=new THREE.MeshBasicMaterial({color:'#779bb5'});box(.045,2.47,1.99,-4.82,2.03,-1.63,skyMat);
 box(.06,.035,2,-4.775,2.03,-1.63,m.metal);box(.06,2.48,.035,-4.775,2.03,-1.63,m.metal);
 box(.28,.06,2.3,-4.72,.735,-1.63,m.stone);
 const curtains=[];for(const side of [-1,1]){const panel=new THREE.Group();root.add(panel);for(let i=0;i<12;i++){const wave=box(.085,2.85,.074,Math.sin(i*.8)*.025,0,(i-5.5)*.072,m.blanket,panel);wave.rotation.y=Math.sin(i*.8)*.2;}panel.position.set(-4.62,1.94,-1.63+side*.5);curtains.push({panel,side});}
 cyl(.014,.014,2.55,-4.6,3.39,-1.63,m.metal).rotation.x=Math.PI/2;
 // A daylight patch remains subtle; the changing directional light supplies the room transition.
 const beam=new THREE.Mesh(new THREE.PlaneGeometry(3.3,1.7),new THREE.MeshBasicMaterial({color:'#efd8a8',transparent:true,opacity:.06,depthWrite:false}));beam.rotation.x=-Math.PI/2;beam.rotation.z=-.35;beam.position.set(-2.8,.022,-.45);root.add(beam);
 // HVAC and humidifier, with animated airflow and mist.
 rounded(1.35,.36,.26,.05,-.6,3.01,-3.22,m.linen);box(1.12,.046,.035,-.6,2.89,-3.055,m.dark);for(let i=0;i<14;i++)box(.024,.046,.04,-1.08+i*.075,2.9,-3.04,m.linen);
 box(.75,.24,.03,1.06,3.03,-3.35,m.stone);for(let i=0;i<7;i++)box(.6,.011,.02,1.06,2.95+i*.024,-3.322,m.dark);
 cyl(.22,.2,.64,-4.15,.35,-.32,m.linen);cyl(.17,.17,.026,-4.15,.682,-.32,m.stone);cyl(.025,.025,.027,-4.15,.7,-.32,m.dark);
 const airGroup=new THREE.Group();root.add(airGroup);for(let i=0;i<3;i++)tube([[-.98+i*.32,2.87,-3],[-.98+i*.32,2.58,-2.65],[-.98+i*.32,2.43,-2.14]],.009,glowMat,airGroup);
 // Bathroom partition, tiled floor and open doorway.
 box(3.0,.042,6.88,3.45,.015,0,m.stone);const tileLine=mat('#a7b0a8');for(let z=-3;z<=3;z+=.7)box(2.9,.003,.009,3.43,.04,z,tileLine);
 const divider=mat('#879c9f',.13,.25);divider.transparent=true;divider.opacity=.25;divider.depthWrite=false;
 box(.055,2.65,2.95,1.99,1.39,-1.91,divider);box(.04,2.68,.04,1.98,1.39,-.46,m.metal);box(.04,.04,3.0,1.98,2.71,-1.91,m.metal);
 // Vanity, countertop basin, curved tap and backlit circular mirror.
 box(2.18,.66,.69,3.47,.76,-2.97,m.wood);box(2.28,.08,.85,3.47,1.13,-2.9,m.stone);
 cyl(.38,.29,.12,3.47,1.23,-2.85,m.pillow);cyl(.29,.29,.008,3.47,1.294,-2.85,m.stone);
 tube([[3.47,1.19,-3.19],[3.47,1.64,-3.19],[3.47,1.69,-3.01],[3.47,1.51,-2.97]],.022,m.metal);
 const mirror=new THREE.Mesh(new THREE.CircleGeometry(.69,64),mat('#667f8b',.12,.75));mirror.position.set(3.47,2.2,-3.36);root.add(mirror);const mirrorRing=ring(.71,.018,3.47,2.2,-3.345,warmMat.clone());
 const bathLight=new THREE.PointLight('#e5ecdd',.8,5);bathLight.position.set(3.47,2.3,-2.85);scene.add(bathLight);
 box(.3,.03,.18,2.77,1.2,-2.8,m.pillow);cyl(.045,.045,.19,4.15,1.27,-2.87,m.linen);cyl(.018,.018,.06,4.15,1.39,-2.87,m.gold);
 // Hot water unit and visible circulating water loop, no running tap.
 rounded(.65,1.07,.43,.075,4.39,2.18,-1.93,m.linen);box(.21,.12,.008,4.39,2.22,-1.697,m.dark);box(.12,.038,.009,4.39,2.23,-1.689,new THREE.MeshBasicMaterial({color:'#a6cbd7'}));
 const pipes=new THREE.Group();root.add(pipes);const pipeMat=new THREE.MeshBasicMaterial({color:'#8dbecf',transparent:true,opacity:.45});tube([[4.22,1.7,-1.93],[4.22,1.38,-1.93],[4.12,.3,-1.93],[3.2,.22,-1.93],[3.2,.65,-2.97]],.016,pipeMat,pipes);tube([[4.53,1.7,-1.93],[4.53,.22,-1.93],[3.72,.22,-1.93],[3.72,.65,-2.97]],.014,m.metal,pipes);cyl(.08,.08,.17,4.18,.72,-1.93,m.dark).rotation.z=Math.PI/2;
 const waterDots=[];for(let i=0;i<5;i++){const p=ball(.035,4.2,.4+i*.2,-1.93,pipeMat);waterDots.push(p);}
 // Hand towel rail, low step and soft path lighting.
 box(.48,.018,.03,4.56,1.17,-.85,m.metal);box(.38,.62,.025,4.56,.89,-.83,m.pillow);
 const path=new THREE.Group();root.add(path);for(let i=0;i<5;i++)box(.4,.007,.012,.55+i*.7,.06,1.6,glowMat,path);
 // Calm furnishing: reading chair, side table, books, a plant.
 rounded(.92,.2,.86,.07,-3.61,.56,2.22,m.linen);rounded(.88,.7,.16,.065,-3.61,.91,2.59,m.linen);for(const x of [-3.95,-3.27])for(const z of [1.94,2.48])cyl(.023,.018,.48,x,.26,z,m.darkWood);
 cyl(.34,.34,.035,-4.18,.66,1.09,m.wood);cyl(.035,.035,.62,-4.18,.34,1.09,m.gold);box(.32,.025,.22,-4.16,.7,1.09,m.blanket);box(.28,.03,.2,-4.18,.724,1.08,m.pillow);
 const green=mat('#5f7a69');cyl(.2,.15,.4,4.29,.24,1.92,m.pillow);for(let i=0;i<12;i++){const a=i*2.4;const x=4.29+Math.sin(a)*.22,z=1.92+Math.cos(a)*.22,y=.8+(i%4)*.2;tube([[4.29,.43,1.92],[x,y,z]],.01,green);const leaf=ball(.15,x,y,z,green);leaf.scale.set(.7,1.7,.2);leaf.rotation.z=Math.sin(a)*.6;}
 // Haze sprites remain off unless this node models active humidification.
 const hazeCanvas=document.createElement('canvas');hazeCanvas.width=hazeCanvas.height=64;const context=hazeCanvas.getContext('2d'),gradient=context.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(215,230,236,.7)');gradient.addColorStop(1,'rgba(215,230,236,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);const hazeTex=new THREE.CanvasTexture(hazeCanvas);const haze=[];for(let i=0;i<9;i++){const mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:hazeTex,opacity:.15,transparent:true,depthWrite:false}));mesh.scale.set(.18,.3,1);root.add(mesh);haze.push(mesh);}
 const labelData=[['air','空调 · 新风',[-.55,3.32,-3.1]],['humidifier','加湿器',[-4.15,1.1,-.32]],['lamp','床侧柔光',[.62,1.42,-2.03]],['speaker','音箱 · 手表',[-3.5,1.1,-1.55]],['curtain','智能窗帘',[-4.62,2.7,-.7]],['water','主卫备水',[4.35,2.95,-1.9]]];
 // Configuration-specific terminals retain the original legacy labels.
 box(.18,.28,.035,-2.7,1.02,-1.6,m.dark);
 box(.025,.22,.27,-4.45,2.5,-2.3,m.pillow);
 const setupLabels=[['lamp','主 · 灯光',[.62,1.42,-2.03]],['curtain','主 · 窗帘',[-4.62,2.7,-.7]],['speaker','主 · 音箱',[-3.5,1.1,-1.55]],['bed','主 · 智能床',[-1.5,.75,.6]],['radar','主 · 毫米波雷达',[-4.45,2.5,-2.3]],['panel','辅 · 4寸中控屏',[1.1,1.55,-3.34]],['app','辅 · App（手机）',[-2.7,1.02,-1.6]]];
 const legacyLabelCount=labelData.length;labelData.push(...setupLabels);
 const labels=labelData.map(([id,title,pos])=>{const el=document.createElement('button');el.className='hotspot';el.innerHTML='<i></i>'+title.replace(/^(主|辅) · /,'');el.title=title;el.onclick=()=>onSelect(id);hotspots.append(el);return{id,el,pos:new THREE.Vector3(...pos)};});
 let actionTime=0,actionPlaying=false,actionPreview=false,lastTick=0,setupStart=performance.now(),setupProgress=1,setupPaused=false;
 const motionUI={play:document.querySelector('#action-play'),reset:document.querySelector('#action-reset'),seek:document.querySelector('#action-seek'),caption:document.querySelector('#action-caption'),readout:document.querySelector('#action-readout')};
 function updateActionUI(a){motionUI.seek.value=actionTime;motionUI.caption.textContent=a.label;motionUI.readout.textContent=`${Math.round(actionTime)} / ${actionDuration} 秒 · 靠背 ${Math.round(a.bed)}° · 窗帘 ${Math.round(a.curtain*100)}%`;motionUI.play.textContent=actionPlaying?'Ⅱ 暂停动作':'▷ 播放动作';container.dataset.actionStage=String(a.stage);container.dataset.actionTime=String(actionTime.toFixed(1));container.dataset.bedAngle=String(a.bed.toFixed(1));}
 motionUI.play.onclick=()=>{if(!actionPreview||actionTime>=actionDuration)actionTime=0;actionPreview=true;actionPlaying=!actionPlaying;lastTick=performance.now();document.dispatchEvent(new Event('action-preview-start'));};
 motionUI.reset.onclick=()=>{actionTime=0;actionPreview=true;actionPlaying=true;lastTick=performance.now();document.dispatchEvent(new Event('action-preview-start'));};
 motionUI.seek.oninput=()=>{actionPreview=true;actionPlaying=false;actionTime=Number(motionUI.seek.value);document.dispatchEvent(new Event('action-preview-start'));};
 let currentView='overview',storyShot=null,storyProgress=0;
 let target={day:.2,light:.08,curtain:.04,active:[]},current={day:.2,light:.08,curtain:.04},viewTarget=null;
 const views={focusInput:{pos:[2.25,2.05,-.55],target:[1.1,1.48,-3.05]},focusConfirm:{pos:[2.5,2.05,-.3],target:[1.1,1.5,-3.15]},setup:{pos:[4.8,3.5,3.7],target:[.8,1.25,-2.0]},overview:{pos:[10.5,8.3,12],target:[0,1.1,0]},bed:{pos:[3.6,5.3,7.1],target:[-1.4,1,-.8]},bath:{pos:[8,4.6,4],target:[3.45,1.55,-1.7]}};
 Object.assign(views,{setupInput:{pos:[2.1,2.45,.7],target:[1.55,1.5,-2.7]},setupWide:{pos:[4.5,4.2,5.7],target:[.2,1.3,-1.5]},setupLight:{pos:[2.65,3.2,2.8],target:[.95,1.03,-1.95]},setupCurtain:{pos:[2.7,4.4,5.4],target:[-2.1,1.6,-1.3]}});
 controls.addEventListener('start',()=>viewTarget=null);
 function resize(){const w=container.clientWidth,h=container.clientHeight;camera.aspect=w/h;camera.fov=w/h<.9?58:38;camera.updateProjectionMatrix();renderer.setSize(w,h);}new ResizeObserver(resize).observe(container);resize();
 const clock=new THREE.Clock(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let visible=true;document.addEventListener('visibilitychange',()=>visible=!document.hidden);
 function frame(){requestAnimationFrame(frame);if(!visible)return;const t=clock.getElapsedTime(),now=performance.now();
 if(actionPlaying){actionTime=Math.min(actionDuration,actionTime+Math.min(.1,(now-lastTick)/1000));if(actionTime>=actionDuration)actionPlaying=false;}lastTick=now;
 let acted=actionPreview?actionAt(actionTime):nodeAction(target.nodeNumber||11);
 if(target.storyboard==='setup'){if(storyShot)setupProgress=storyShot.id==='overview'?0:storyShot.id==='walking'?(reduced?1:storyProgress):1;else if(!setupPaused)setupProgress=target.setupPhase==='overview'?0:target.setupPhase==='walking'?(reduced?1:Math.min(1,(now-setupStart)/4500)):1;const u=setupProgress;acted={...actionAt(0),sit:1,edge:1,stand:1,walk:target.setupPhase==='walking'&&u<1?.1:0,wash:0,setup:u};container.dataset.storyboard=target.setupPhase;container.dataset.walkProgress=u.toFixed(3);}
 if(actionPreview){updateActionUI(acted);document.querySelector('#scene-time').textContent=['06:55','06:57','07:00','07:02','07:05','07:10'][acted.stage];document.querySelector('#scene-stage').textContent='人物动作预演 · 非清醒识别结果';}else{container.dataset.actionStage='node';}
 const visual=actionPreview?{...target,day:acted.day,light:acted.light,curtain:acted.curtain}:target;
 bedBack.rotation.x=acted.bed*Math.PI/180;bedLink.scale.y=1+acted.bed/32;bedLink.position.y=.53+acted.bed/160;
 userAvatar.pose(acted,actionPreview?actionTime:target.storyboard==='setup'?storyProgress*(storyShot?.duration||0)/1000:t);partnerAvatar.pose({...acted,setup:undefined},t,true);userCover.visible=acted.edge<.1;
 for(const k of ['day','light','curtain'])current[k]=target.storyboard==='setup'&&storyShot?(visual[k]??current[k]):THREE.MathUtils.lerp(current[k],visual[k]??current[k],reduced?1:.035);
 container.dataset.light=current.light.toFixed(3);container.dataset.curtain=current.curtain.toFixed(3);
 sun.intensity=.8+current.day*3;skyMat.color.setRGB(.27+current.day*.35,.4+current.day*.3,.53+current.day*.25);beam.material.opacity=current.curtain*.11;
 curtains.forEach(({panel,side})=>{panel.position.z=-1.63+side*(.48+current.curtain*.6);panel.scale.z=1-current.curtain*.62;});
 lamps[1].light.intensity=.3+current.light*6;lamps[1].mat.emissiveIntensity=.2+current.light*3;lamps[0].light.intensity=.15;
 bathLight.intensity=target.active.includes('water')?2.2:.65;mirrorRing.material.emissiveIntensity=target.active.includes('water')?1.7:.5;
 airGroup.visible=Boolean(target.air);haze.forEach((p,i)=>{p.visible=Boolean(target.humidity);const f=reduced?i/9:(t*.27+i/9)%1;p.position.set(-4.15+Math.sin(i+t)*.05,.78+f*.7,-.32);p.material.opacity=.2*(1-f);});
 watchRing.visible=Boolean(target.haptic);watchRing.scale.setScalar(reduced?1:1+Math.sin(t*7)*.15);waterDots.forEach((p,i)=>{p.visible=Boolean(target.water);p.position.y=.3+(reduced?i/5:(t*.3+i/5)%1)*1.3;});pipeMat.color.set(target.danger?'#ee8b72':'#8dbecf');pipeMat.opacity=target.water?.8:.2;path.visible=target.active.includes('water');

 if(viewTarget){camera.position.lerp(new THREE.Vector3(...viewTarget.pos),reduced?1:.035);controls.target.lerp(new THREE.Vector3(...viewTarget.target),reduced?1:.035);if(camera.position.distanceTo(new THREE.Vector3(...viewTarget.pos))<.01)viewTarget=null;}
 controls.update();
 requestBubble.hidden=target.storyboard!=='setup'||!storyShot?.bubble;
 if(!requestBubble.hidden){const p=new THREE.Vector3(1.25,2.16,-2.52).project(camera);requestBubble.style.left=Math.max(86,Math.min(container.clientWidth*.55,(p.x*.5+.5)*container.clientWidth))+'px';requestBubble.style.top=Math.max(125,Math.min(container.clientHeight-135,(-p.y*.5+.5)*container.clientHeight))+'px';requestBubble.classList.toggle('paused',setupPaused);}
 for(const [index,item] of labels.entries()){const p=item.pos.clone().project(camera),x=(p.x*.5+.5)*container.clientWidth,y=(-p.y*.5+.5)*container.clientHeight;item.el.style.left=x+'px';item.el.style.top=(y-14)+'px';const offset=({speaker:[-22,-8],app:[22,14],curtain:[-18,6],radar:[18,-10]})[item.id]||[0,0];item.el.style.setProperty('--label-x',(x+offset[0])+'px');item.el.style.setProperty('--label-y',(y-14+offset[1])+'px');const setup=target.storyboard==='setup';item.el.hidden=setup?(index<legacyLabelCount||currentView!=='overview'||p.z>1||x<10||x>container.clientWidth-10||y<20||y>container.clientHeight-45):(index>=legacyLabelCount||p.z>1||x<42||x>container.clientWidth-42||y<145||y>container.clientHeight-120);if(setup&&index>=legacyLabelCount)item.el.classList.add('terminal-label');}renderer.render(scene,camera);
 }frame();
 return{
  setStoryboardProgress(shot,p){storyShot=shot;storyProgress=Math.max(0,Math.min(1,p));const u=reduced?1:storyProgress,e=u*u*(3-2*u);for(const k of ['light','curtain']){const range=shot[k]||[.03,.03];target[k]=range[0]+(range[1]-range[0])*e;}target.day=.14+target.curtain*.2;if(shot.bubble){requestBubble.textContent=dialogue[shot.voice]?.text||'正在描述需求';requestBubble.setAttribute('aria-label',requestBubble.textContent);}},
  pauseStoryboard(){setupPaused=true;viewTarget=null;},
  resumeStoryboard(){setupStart=performance.now()-setupProgress*4500;setupPaused=false;viewTarget=views[currentView];},
  setView(name,instant=false){currentView=name;viewTarget=views[name]||views.overview;if(instant){camera.position.set(...viewTarget.pos);controls.target.set(...viewTarget.target);controls.update();viewTarget=null;}},
  setState(next){target=next;storyShot=null;controls.minDistance=next.storyboard==='setup'?1.4:6;setupStart=performance.now();setupPaused=false;actionPlaying=false;actionPreview=false;motionUI.play.textContent='▷ 播放动作';motionUI.caption.textContent='动作预演 · 窗帘开启 / 靠背抬升 / 人物起身';motionUI.readout.textContent='34 秒 · 使用者侧靠背辅助已授权（模拟）';motionUI.seek.value=0;labels.forEach(l=>l.el.classList.toggle('active',next.active.includes(l.id)));}
 };
}
