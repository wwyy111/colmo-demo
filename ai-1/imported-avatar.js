import * as THREE from 'three';
// Preserve the supplied OBJ surfaces; attach a small procedural rig for the demo.
function parse(source){
 const vertices=[],faces=[],adj=[];
 for(const line of source.split('\n')){const p=line.trim().split(/\s+/);if(p[0]==='v'){vertices.push(p.slice(1).map(Number));adj.push(new Set());}if(p[0]==='f')faces.push(p.slice(1).map(x=>Number(x.split('/')[0])-1));}
 faces.forEach(f=>f.forEach(i=>f.forEach(j=>adj[i].add(j))));
 const component=[],seen=new Set();let id=0;
 for(let i=0;i<vertices.length;i++){if(seen.has(i))continue;const q=[i];seen.add(i);while(q.length){const j=q.pop();component[j]=id;for(const k of adj[j])if(!seen.has(k)){seen.add(k);q.push(k);}}id++;}
 const indices=[];faces.forEach(f=>{for(let j=1;j<f.length-1;j++)indices.push(f[0],f[j],f[j+1]);});
 return{vertices,indices,component};
}
const assets=Object.fromEntries(await Promise.all(['Female','Male'].map(async name=>{const r=await fetch(new URL(`./models/${name}.obj`,import.meta.url));if(!r.ok)throw Error(`Model unavailable: ${name}`);return[name,parse(await r.text())];})));
export function importedAvatar(group,{model='Female',color='#718f9e'}={}){
 const data=assets[model],female=model==='Female',scale=female?.42:.37,hipY=female?2:2.4,shoulderY=female?3.27:3.73;
 const geometry=new THREE.BufferGeometry(),output=new Float32Array(data.indices.length*3);
 geometry.setAttribute('position',new THREE.BufferAttribute(output,3));
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.86,side:THREE.DoubleSide}));mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=`Imported ${model}`;mesh.frustumCulled=false;group.add(mesh);group.userData.model=model;
 const temp=new THREE.Vector3(),rotation=new THREE.Matrix4(),q=new THREE.Quaternion();
 function pose(points,tilt){
  rotation.makeRotationX(tilt);
  for(let n=0;n<data.indices.length;n++){
   const index=data.indices[n],v=data.vertices[index],c=data.component[index],sign=v[0]<0?-1:1,side=sign<0?'L':'R';
   const arm=female?[4,5,7,8].includes(c):[5,6,7,8].includes(c);
   if(arm){
    const shoulderX=sign*(female?.32:.4),from=new THREE.Vector3(shoulderX*scale,(shoulderY-hipY)*scale,-.12*scale).applyMatrix4(rotation),to=new THREE.Vector3(...points[side+'hand']);
    const length=(female?1.62:2.01)*scale,delta=to.sub(from);
    temp.set((v[0]-shoulderX)*scale,v[1]*scale-shoulderY*scale,(v[2]+.12)*scale);
    temp.x*=delta.length()/length;q.setFromUnitVectors(new THREE.Vector3(sign,0,0),delta.normalize());temp.applyQuaternion(q).add(from);
   }else if(v[1]<hipY){
    const pivotX=sign*(female?.16:.43),from=new THREE.Vector3(...points[side+'hip']),to=new THREE.Vector3(...points[side+'foot']);
    temp.set((v[0]-pivotX)*scale,(v[1]-hipY)*scale,v[2]*scale);
    q.setFromUnitVectors(new THREE.Vector3(0,-1,0),to.sub(from).normalize());temp.applyQuaternion(q).add(from);
    // Blend into the shared pelvis instead of tearing the connected torso mesh.
    const blend=Math.max(0,Math.min(1,(hipY-v[1])/.32));
    const upper=new THREE.Vector3(v[0]*scale,(v[1]-hipY)*scale,v[2]*scale).applyMatrix4(rotation);temp.lerp(upper,1-blend);
   }else temp.set(v[0]*scale,(v[1]-hipY)*scale,v[2]*scale).applyMatrix4(rotation);
   temp.toArray(output,n*3);
  }
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();
 }
 return{pose};
}
