import * as THREE from 'three';
import {importedAvatar} from './imported-avatar.js';
export function createAvatar(root,{color='#718f9e',skin='#c2a184',model='Female'}={}){
 const group=new THREE.Group();root.add(group);
 const cloth=new THREE.MeshStandardMaterial({color,roughness:.92});
 const skinMat=new THREE.MeshStandardMaterial({color:skin,roughness:.85});
 const joints={};
 function sphere(name,r,material,scale=[1,1,1]){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),material);mesh.scale.set(...scale);mesh.castShadow=true;group.add(mesh);joints[name]=mesh;return mesh;}
 sphere('head',.19,skinMat,[1,1.08,1]);
 sphere('body',.27,cloth,[.82,1.2,.64]);sphere('hips',.2,cloth,[1.02,.65,.8]);
 const bones=[];
 for(const side of ['L','R'])for(const [a,b,r] of [['shoulder','hand',.078],['hip','foot',.095]]){
  const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,1-2*r,6,12),cloth);mesh.castShadow=true;group.add(mesh);bones.push({mesh,a:side+a,b:side+b});
 }
 for(const side of ['L','R']){sphere(side+'hand',.065,skinMat);sphere(side+'foot',.08,cloth,[1,.7,1.7]);}
 const v=p=>new THREE.Vector3(...p),mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 group.children.forEach(mesh=>{mesh.visible=false;});
 const imported=importedAvatar(group,{model,color});
 function pose(a,t=0,partner=false){
  const sit=partner?0:a.sit,edge=partner?0:a.edge,stand=partner?0:a.stand,walk=partner?0:a.walk,wash=partner?0:a.wash;
  const angle=partner?0:a.bed*Math.PI/180;
  let hip=[partner?-2.26:-.73,1.02,-.75];
  hip=mix(hip,[.04,1.02,-.55],edge);hip=mix(hip,[.65,.89,-.55],stand);
  // Route goes around the open front end of the glass partition, then approaches the basin.
  if(walk>0){const points=[[.65,.89,-.55],[1.25,.89,.7],[2.65,.89,.7],[3.4,.89,-2.05]];const q=walk*3,i=Math.min(2,Math.floor(q));hip=mix(points[i],points[i+1],q-i);}
  if(a.setup!==undefined)hip=mix([1.25,.89,1.1],[1.25,.89,-2.52],Math.min(a.setup,1));
  group.position.set(...hip);
  let yaw=edge*Math.PI/2;
  if(walk>0&&walk<1)yaw=walk<1/3?.45:walk<2/3?Math.PI/2:Math.PI;
  if(walk>=1)yaw=Math.PI;
  if(a.setup!==undefined)yaw=Math.PI;
  group.rotation.y=yaw;
  const tilt=(-Math.PI/2+angle)*(1-sit)+wash*.18;
  const rot=new THREE.Matrix4().makeRotationX(tilt);
  const upper=p=>v(p).applyMatrix4(rot).toArray();
  const points={hips:[0,0,0],body:upper([0,.28,0]),head:upper([0,.75,0])};
  const walking=walk>0&&walk<1;
  const envelope=a.setup!==undefined?Math.min(1,a.setup*8,(1-a.setup)*8):1;
  const stride=(walking?Math.sin(t*6)*Math.max(0,envelope):0)*.28;
  const stretch=Math.sin(Math.PI*Math.min(1,Math.max(0,(sit-.25)/.75)))*(1-edge);
  for(const [side,sign] of [['L',-1],['R',1]]){
   points[side+'shoulder']=upper([sign*.22,.47,0]);
   points[side+'hand']=upper([sign*(.27+stretch*.28),.01+stretch*.86+wash*.4,.06+wash*.4-stride*sign*.5]);
   if(a.setup!==undefined&&side==='R'&&a.setup>=1)points[side+'hand']=upper([.24,.43,.44]);
   points[side+'hip']=[sign*.12,0,0];
   points[side+'foot']=mix([sign*.12,-.06,.85],[sign*.12,-.83*Math.cos(stride),.27*(1-stand)+.83*Math.sin(stride)*sign],Math.max(edge,stand));
  }
  for(const [name,mesh] of Object.entries(joints))mesh.position.copy(v(points[name]));
  joints.body.rotation.x=tilt; joints.head.rotation.x=tilt;
  for(const {mesh,a:from,b:to} of bones){const start=v(points[from]),end=v(points[to]),delta=end.clone().sub(start);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.scale.y=delta.length();mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
  const breath=partner||sit===0?Math.sin(t*1.4)*.008:0;joints.body.scale.y=1.2+breath;
  imported.pose(points,tilt);
 }
 return{pose,group};
}
