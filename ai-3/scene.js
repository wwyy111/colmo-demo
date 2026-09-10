import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';

export function createKitchen(container,hotspots,onSelect){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1b292d');scene.fog=new THREE.Fog('#1b292d',22,40);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;container.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(38,1,.1,80);camera.position.set(9,7.3,10.5);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.25,0);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=6;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.475;controls.minPolarAngle=.28;controls.enablePan=false;
 scene.add(new THREE.HemisphereLight('#d6e4ec','#514736',2.3));
 const sun=new THREE.DirectionalLight('#ffe0b1',4.2);sun.position.set(-4,9,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:28});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
 const fill=new THREE.DirectionalLight('#abcfe4',1.5);fill.position.set(5,5,-3);scene.add(fill);
 const mats={};const material=(color,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 mats.wood=material('#88705a',.7);mats.darkwood=material('#4a4036',.75);mats.cabinet=material('#c4bfb0',.45);mats.wall=material('#a8a89c',.9);mats.stone=material('#d2d0be',.32);mats.metal=material('#939e9e',.23,.8);mats.black=material('#172020',.28,.25);mats.glass=material('#233638',.16,.4);mats.gold=material('#b39b70',.32,.7);mats.blue=material('#adcfd9',.3,.3);
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=kind==='wood'?'#8f795f':'#c8c7b9';ctx.fillRect(0,0,512,512);let seed=17;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let i=0;i<(kind==='wood'?260:65);i++){ctx.strokeStyle=kind==='wood'?`rgba(49,32,19,${random()*.13})`:`rgba(90,97,86,${random()*.14})`;ctx.lineWidth=random()*(kind==='wood'?2:1.5)+.2;ctx.beginPath();let x=random()*512,y=random()*512;ctx.moveTo(x,y);for(let k=0;k<12;k++){x+=(kind==='wood'?random()*5:random()*35-9);y+=60;ctx.lineTo(x,y);}ctx.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
 mats.wood.map=texture('wood');mats.stone.map=texture('stone');
 const group=new THREE.Group();scene.add(group);const clickables=[];
 function box(w,h,d,x,y,z,mat,parent=group){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function cylinder(r1,r2,h,x,y,z,mat,parent=group){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,48),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function sphere(r,x,y,z,mat,parent=group){const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 function ring(radius,tube,x,y,z,mat,parent=group){const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,60),mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;}
 function line(points,mat,r=.012,parent=group){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,8,false),mat);parent.add(m);return m;}
 function labelTexture(text,fg='#c9e4e5',bg='#182a2d'){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,256);ctx.fillStyle=fg;ctx.textAlign='center';ctx.font='30px sans-serif';ctx.fillText('COLMO',256,68);ctx.font='54px sans-serif';ctx.fillText(text,256,156);ctx.font='14px sans-serif';ctx.fillText('INTELLIGENT LIVING',256,208);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t});}
 function deviceBox(id,...args){const m=box(...args);m.userData.device=id;clickables.push(m);return m;}
 // A cutaway architectural model: oak plinth, tile floor, two walls.
 box(8.7,.23,6.6,0,-.18,0,mats.darkwood);box(8.6,.06,6.5,0,-.035,0,mats.stone);
 const grout=material('#aaa998');for(let i=-4;i<=4;i++)box(.009,.002,6.45,i,.001,0,grout);for(let i=-3;i<=3;i++)box(8.55,.002,.009,0,.001,i,grout);
 box(8.6,3.65,.12,0,1.78,-3.12,mats.wall);box(.12,3.65,3.2,-4.25,1.78,-1.5,mats.wall);
 // Vertical oak slats on the left return wall.
 for(let i=0;i<23;i++)box(.07,3.55,.07,-4.16,1.78,-3+i*.133,mats.wood);
 box(8.5,.1,.08,0,.07,-3.02,mats.darkwood);
 // Back counter and fronts.
 box(5.5,1.04,1.1,.1,.53,-2.43,mats.darkwood);box(5.62,.11,1.2,.1,1.105,-2.4,mats.stone);
 for(let i=0;i<6;i++){box(.88,.91,.045,-2.2+i*.92,.59,-1.863,i<2?mats.wood:mats.cabinet);box(.36,.016,.035,-2.2+i*.92,.98,-1.826,mats.metal);}
 box(5.6,.67,.035,.1,1.52,-3.02,mats.stone);
 // Upper floating cabinets, warm concealed lighting.
 for(const x of [-1.98,-1.06,1.68,2.6]){box(.9,.93,.58,x,2.69,-2.75,mats.cabinet);box(.002,.85,.005,x,2.7,-2.45,mats.darkwood);}
 const warm=new THREE.MeshStandardMaterial({color:'#ffdeb0',emissive:'#ffc777',emissiveIntensity:2});box(5.2,.014,.016,.15,2.21,-2.55,warm);
 const counterLight=new THREE.PointLight('#ffd9a0',6,5,2);counterLight.position.set(0,2,-2.1);scene.add(counterLight);
 // Refrigerator with actual modeled door seams, dispenser and handles.
 deviceBox('fridge',1.24,3.1,1.27,-3.43,1.55,-2.4,mats.metal);box(1.16,2.02,.06,-3.43,2.02,-1.73,mats.cabinet);box(1.16,.95,.06,-3.43,.48,-1.73,mats.cabinet);box(.018,1.97,.02,-3.43,2.01,-1.69,mats.darkwood);box(.025,.7,.055,-3.5,1.98,-1.65,mats.metal);box(.025,.7,.055,-3.36,1.98,-1.65,mats.metal);box(.3,.4,.02,-3.7,1.98,-1.686,mats.black);box(.17,.1,.015,-3.69,2.07,-1.67,labelTexture('4°'));
 // Cooktop, burners, fish and pan.
 deviceBox('stove',1.55,.055,.82,-.05,1.184,-2.34,mats.black);
 const burnerMat=new THREE.MeshStandardMaterial({color:'#83b6d5',emissive:'#68bdf4',emissiveIntensity:.2,metalness:.4,roughness:.2});
 const burner=ring(.27,.018,-.4,1.218,-2.3,burnerMat);ring(.22,.01,.45,1.218,-2.3,mats.metal);
 for(let i=0;i<4;i++){const g=box(.6,.022,.025,-.4,1.245,-2.3,mats.black);g.rotation.y=i*Math.PI/2;}
 cylinder(.32,.24,.13,-.4,1.31,-2.3,mats.black);cylinder(.296,.296,.01,-.4,1.38,-2.3,material('#544f43'));
 const handle=box(.13,.06,.58,-.4,1.34,-1.91,mats.darkwood);handle.rotation.x=-.08;
 const fish=box(.25,.07,.34,-.4,1.42,-2.3,material('#e5a17a',.6));fish.rotation.y=.2;for(let i=0;i<5;i++){const stripe=box(.235,.003,.009,-.4,1.457,-2.43+i*.06,material('#eed0aa'));stripe.rotation.y=.2;}
 cylinder(.17,.13,.2,.46,1.32,-2.3,mats.metal);cylinder(.175,.175,.025,.46,1.43,-2.3,mats.metal);sphere(.025,.46,1.46,-2.3,mats.black);
 // Hood and chimney.
 deviceBox('hood',1.42,.14,.93,-.03,2.35,-2.5,mats.metal);box(.6,1.15,.4,-.03,2.98,-2.82,mats.metal);box(1.18,.02,.035,-.03,2.268,-2.08,warm);
 // Built-in oven tower, glass cavity and illuminated display.
 box(1.25,3.32,1.26,3.55,1.66,-2.42,mats.wood);box(1.16,.94,.065,3.55,2.77,-1.748,mats.cabinet);box(1.16,.84,.065,3.55,.46,-1.748,mats.cabinet);
 deviceBox('oven',1.15,1.28,.085,3.55,1.64,-1.72,mats.black);box(.99,.73,.02,3.55,1.49,-1.665,mats.glass);box(.81,.5,.015,3.55,1.5,-1.65,material('#3b3c32',.2,.2));box(.86,.045,.12,3.55,1.98,-1.63,mats.metal);box(.43,.17,.01,3.55,2.16,-1.665,labelTexture('STEAM'));
 for(let i=0;i<4;i++)box(.7,.012,.02,3.55,1.29+i*.12,-1.636,mats.metal);
 const ovenGlow=new THREE.PointLight('#ffb66f',1,1.8);ovenGlow.position.set(3.55,1.5,-1.4);scene.add(ovenGlow);
 // Island in oak with broad stone worktop and recessed foot detail.
 box(4.2,1,1.45,.25,.56,.76,mats.wood);box(3.98,.17,1.24,.25,.13,.76,mats.darkwood);box(4.55,.13,1.75,.25,1.14,.72,mats.stone);
 for(let i=0;i<38;i++)box(.012,.94,.023,-1.76+i*.107,.58,1.496,mats.darkwood);
 // Inset sink + arch faucet.
 box(.98,.022,.63,-.9,1.211,.59,mats.metal);box(.85,.02,.51,-.9,1.225,.59,mats.black);box(.72,.022,.4,-.9,1.239,.59,material('#495958',.22,.65));
 line([[-.9,1.2,.2],[-.9,1.66,.2],[-.9,1.78,.39],[-.9,1.65,.55]],mats.metal,.025);cylinder(.043,.043,.08,-.72,1.25,.2,mats.metal);
 // Preparation props, cutting board, vegetables, plates, bottle.
 box(.87,.045,.64,.45,1.23,.6,mats.wood);const veg=material('#51784b',.8);const stem=material('#8ba270');for(let i=0;i<5;i++){const v=sphere(.105,.2+i*.12,1.32,.52+Math.sin(i)*.13,veg);v.scale.set(1,.7,1);}
 for(let i=0;i<3;i++){const v=cylinder(.028,.03,.33,.37+i*.13,1.29,.71,stem);v.rotation.z=Math.PI/2;}
 const knife=box(.06,.018,.28,.8,1.27,.63,mats.metal);knife.rotation.y=-.3;box(.065,.03,.16,.86,1.28,.82,mats.darkwood);
 for(let i=0;i<3;i++)cylinder(.23,.215,.025,1.47,1.24+i*.024,.72,mats.cabinet);cylinder(.065,.06,.3,1.83,1.35,.35,material('#576647',.17,.2));cylinder(.029,.029,.09,1.83,1.54,.35,mats.gold);
 // Tabletop AI terminal, used as the center of simulated coordination.
 const terminal=box(.58,.31,.035,.5,1.4,.04,mats.black);terminal.rotation.x=-.28;const screen=box(.51,.255,.006,.5,1.4,.066,labelTexture('18:30'));screen.rotation.x=-.28;box(.33,.024,.19,.5,1.235,.015,mats.metal);
 // Pair of sculptural stools.
 for(const x of [-.8,1.25]){cylinder(.31,.28,.09,x,.73,2.2,mats.darkwood);for(const dx of [-.19,.19])for(const dz of [-.19,.19]){const leg=cylinder(.024,.019,.7,x+dx,.36,2.2+dz,mats.metal);leg.rotation.z=-dx*.2;}ring(.25,.013,x,.29,2.2,mats.metal);}
 // Small herb pot and utensils bring scale to the architectural model.
 cylinder(.16,.12,.22,2.34,1.28,-2.6,material('#b5b09a'));for(let i=0;i<11;i++){const a=i*2.4;line([[2.34,1.35,-2.6],[2.34+Math.sin(a)*.12,1.7+Math.cos(a)*.09,-2.6+Math.cos(a)*.12]],veg,.012);const leaf=sphere(.09,2.34+Math.sin(a)*.15,1.68+Math.cos(a)*.09,-2.6+Math.cos(a)*.15,veg);leaf.scale.set(1,.25,.6);}
 cylinder(.11,.1,.22,1.5,1.28,-2.73,mats.cabinet);for(let i=0;i<4;i++){const u=box(.018,.38,.018,1.46+i*.035,1.52,-2.73,mats.wood);u.rotation.z=(i-2)*.1;}
 // Suspension lamps (thin stems, warm pools).
 for(const x of [-.95,1.3]){cylinder(.009,.009,.72,x,3.6,.7,mats.black);cylinder(.24,.31,.18,x,3.17,.7,mats.black);cylinder(.27,.27,.013,x,3.072,.7,warm);const l=new THREE.PointLight('#ffd4a1',2.5,3);l.position.set(x,2.95,.7);scene.add(l);}
 // Discrete floor glow outlines the digital space without changing alert semantics.
 const baseGlow=new THREE.MeshStandardMaterial({color:'#8abbc5',emissive:'#6aabbf',emissiveIntensity:.6});box(8.45,.012,.012,0,-.11,3.28,baseGlow);
 const linkMat=new THREE.MeshBasicMaterial({color:'#8bcde7',transparent:true,opacity:.38});const links=new THREE.Group();group.add(links);
 line([[.5,1.32,.01],[.5,1.55,-.7],[-.4,1.65,-1.45],[-.4,1.56,-2.3]],linkMat,.01,links);line([[.5,1.32,.01],[1.7,1.55,-.7],[2.65,1.75,-1.15],[3.55,1.75,-1.65]],linkMat,.01,links);links.visible=false;
 const steamCanvas=document.createElement('canvas');steamCanvas.width=steamCanvas.height=64;const ctx=steamCanvas.getContext('2d');const grad=ctx.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(221,237,234,.65)');grad.addColorStop(1,'rgba(221,237,234,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);const steamTex=new THREE.CanvasTexture(steamCanvas);const steam=[];
 for(let i=0;i<13;i++){const p=new THREE.Sprite(new THREE.SpriteMaterial({map:steamTex,transparent:true,opacity:.16,depthWrite:false}));p.scale.set(.23,.35,1);group.add(p);steam.push(p);}
 const anchors={fridge:new THREE.Vector3(-3.43,2.94,-1.65),hood:new THREE.Vector3(-.03,2.58,-2),stove:new THREE.Vector3(-.4,1.63,-1.75),oven:new THREE.Vector3(3.55,2.45,-1.6)};
 const names={fridge:'智能冰箱',hood:'智能烟机',stove:'智能灶具',oven:'蒸烤一体机'};
 const labels=Object.entries(anchors).map(([id,pos])=>{const el=document.createElement('button');el.className='hotspot';el.innerHTML='<i></i>'+names[id];el.onclick=()=>onSelect(id);hotspots.appendChild(el);return{id,pos,el};});
 let currentState='welcome',targetView=null;
 const views={overview:{pos:[9,7.3,10.5],target:[0,1.25,0]},stove:{pos:[2.6,4.8,4.8],target:[-.35,1.6,-1.8]},island:{pos:[5.5,5.3,6.6],target:[.1,1.1,.7]}};
 function setView(name){targetView=views[name]||views.overview;}
 controls.addEventListener('start',()=>targetView=null);
 let pointerStart;renderer.domElement.addEventListener('pointerdown',e=>pointerStart=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const r=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(clickables)[0];if(hit)onSelect(hit.object.userData.device);});
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w/h<1?51:38;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(container);resize();
 const clock=new THREE.Clock();let active=true;document.addEventListener('visibilitychange',()=>active=!document.hidden);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function animate(){requestAnimationFrame(animate);if(!active)return;const t=clock.getElapsedTime();if(targetView){camera.position.lerp(new THREE.Vector3(...targetView.pos),.045);controls.target.lerp(new THREE.Vector3(...targetView.target),.045);if(camera.position.distanceTo(new THREE.Vector3(...targetView.pos))<.01)targetView=null;}controls.update();const cooking=['cooking','action','finishing'].includes(currentState);steam.forEach((p,i)=>{p.visible=cooking;p.position.set(-.4+Math.sin(i*1.9+t*.5)*.12,1.5+((reduced?i/13:(t*.24+i/13)%1))*.8,-2.3+Math.cos(i*2+t*.3)*.1);p.material.opacity=.13*(1-(t*.24+i/13)%1);});if(!reduced)linkMat.opacity=.22+Math.sin(t*2)*.13;
 for(const a of labels){const p=a.pos.clone().project(camera);const x=(p.x*.5+.5)*container.clientWidth,y=(-p.y*.5+.5)*container.clientHeight;a.el.style.left=x+'px';a.el.style.top=y+'px';a.el.hidden=p.z>1||x<45||x>container.clientWidth-45||y<92||y>container.clientHeight-100;}
 renderer.render(scene,camera);
 }animate();
 return{setView,setState(next,rgb){currentState=next;const cooking=['cooking','action','finishing'].includes(next);const danger=['risk','protecting','protected'].includes(next);burnerMat.emissive.set(danger?'#ee5346':'#68bdf4');burnerMat.emissiveIntensity=cooking?2:danger?2.5:.06;ovenGlow.intensity=cooking?2.5:.3;links.visible=cooking||next==='starting';labels.forEach(a=>a.el.classList.toggle('active',danger?a.id==='stove':cooking&&a.id!=='fridge'));linkMat.color.set(`rgb(${rgb})`);}};
}
