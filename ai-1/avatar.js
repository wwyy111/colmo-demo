import * as THREE from 'three';
export function createAvatar(root,{color='#718f9e',skin='#c2a184'}={}){
 const group=new THREE.Group();root.add(group);
 const cloth=new THREE.MeshStandardMaterial({color,roughness:.92});
 const skinMat=new THREE.MeshStandardMaterial({color:skin,roughness:.85});
 const hairMat=new THREE.MeshStandardMaterial({color:'#414444',roughness:1});
 const joints={};
 function sphere(name,r,material,scale=[1,1,1]){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),material);mesh.scale.set(...scale);mesh.castShadow=true;group.add(mesh);joints[name]=mesh;return mesh;}
 sphere('head',.16,skinMat,[.9,1.12,.94]);const hair=sphere('hair',.163,hairMat,[.93,.65,.98]);
 sphere('body',.27,cloth,[.77,1.3,.58]);sphere('hips',.2,cloth,[1.02,.65,.77]);
 const bones=[];
 for(const side of ['L','R'])for(const [a,b,r,material] of [['shoulder','elbow',.065,cloth],['elbow','hand',.05,skinMat],['hip','knee',.087,cloth],['knee','foot',.069,cloth]]){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.85,r,1,12),material);mesh.castShadow=true;group.add(mesh);bones.push({mesh,a:side+a,b:side+b});
 }
 for(const side of ['L','R']){sphere(side+'hand',.065,skinMat);sphere(side+'foot',.08,cloth,[1,.7,1.7]);}
 const v=p=>new THREE.Vector3(...p),mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
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
  const stride=(walk>0&&walk<1?Math.sin(t*7):0)*.22;
  const stretch=Math.sin(Math.PI*Math.min(1,Math.max(0,(sit-.25)/.75)))*(1-edge);
  for(const [side,sign] of [['L',-1],['R',1]]){
   points[side+'shoulder']=upper([sign*.22,.47,0]);
   points[side+'elbow']=upper([sign*(.25+stretch*.19),.22+stretch*.44, .04+wash*.28]);
   points[side+'hand']=upper([sign*(.24+stretch*.28),.01+stretch*.86+wash*.4,.12+wash*.4+stride*sign*.55]);
   if(a.setup!==undefined&&side==='R'&&a.setup>=1){points[side+'elbow']=upper([.24,.27,.27]);points[side+'hand']=upper([.18,.48,.46]);}
   points[side+'hip']=[sign*.12,0,0];
   points[side+'knee']=mix([sign*.12,-.03,.45],[sign*.12,-.42,.25*(1-stand)+stride*sign],Math.max(sit,stand));
   points[side+'foot']=mix([sign*.12,-.06,.85],[sign*.12,-.83,.27*(1-stand)-stride*sign],Math.max(edge,stand));
  }
  for(const [name,mesh] of Object.entries(joints)){if(name==='hair')continue;mesh.position.copy(v(points[name]));}
  joints.body.rotation.x=tilt; joints.head.rotation.x=tilt;hair.position.copy(joints.head.position).add(v(upper([0,.09,-.035])));hair.rotation.x=tilt;
  for(const {mesh,a:from,b:to} of bones){const start=v(points[from]),end=v(points[to]),delta=end.clone().sub(start);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.scale.y=delta.length();mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
  const breath=partner||sit===0?Math.sin(t*1.4)*.008:0;joints.body.scale.y=1.3+breath;
 }
 return{pose,group};
}
