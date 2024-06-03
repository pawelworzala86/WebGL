    var gltf
    
    {
        
        function glTypedArray(val){
            return {
                '5120': Int8Array,
                '5121': Uint8Array,
                '5122': Int16Array,
                '5123': Uint16Array,
                '5124': Int32Array,
                '5125': Uint32Array,
                '5126': Float32Array
            }[val]
        }
        
        function NumSize(val){
            return {
                'SCALAR': 1,
                'VEC2': 2,
                'VEC3': 3,
                'VEC4': 4,
                'MAT2': 4,
                'MAT3': 9,
                'MAT4': 16
            }[val]
        }
        
        function getAccessorTypedArrayAndStride(gltf, accessorIndex) {
            const accessor = gltf.accessors[accessorIndex];
            const bufferView = gltf.bufferViews[accessor.bufferView];
            const TypedArray = glTypedArray(accessor.componentType);
            const buffer = gltf.buffers[bufferView.buffer];
            accessor.size=NumSize(accessor.type)
            const array=new TypedArray(
              buffer,
              bufferView.byteOffset + (accessor.byteOffset || 0),
              accessor.count * accessor.size)
            return array/*{
              accessor,
              array,
          }*/
        }
        
        
        
        node('loadGLTF',async function(engine,uri){
        
            const gl=engine.gl
        
            //const shader=await node('createShader')('skin.vert','skin.frag')
            //const meshShader=await node('createShader')('skin')
            const shader=await node('createShaderByName')(gl,"skin")
        
            
            let path=uri.replace(uri.split('/').pop(),'')
        
            gltf=await node('load')(uri,"json")
        
            //console.log(gltf)
        
            for(const key of Object.keys(gltf.buffers)){
                const url=path+'/'+gltf.buffers[key].uri
                gltf.buffers[key]=await node('load')(url,'arrayBuffer')
            }
        
            gltf['data']=gltf['accessors'].map(accessor=>{
              const bufferView=gltf['bufferViews'][accessor['bufferView']]
              const TypedArray = glTypedArray(accessor['componentType'])
              return new TypedArray(
                  gltf.buffers[bufferView['buffer']],
                  bufferView['byteOffset'],//+ (accessor.byteOffset || 0),
                  accessor['count']* NumSize(accessor['type']))
          })
            
        
            gltf.accessors=gltf.accessors.map((accessor,index)=>{
                return getAccessorTypedArrayAndStride(gltf,index)
            })
        
            gltf.images=(gltf.images??[]).map(image=>{
                return node('loadTexture')(gl, path+'/'+image.uri)
            })
        
            gltf.textures=(gltf.textures??[]).map(texture=>{
                return gltf.images[texture.source]
            })
        
            gltf.materials=(gltf.materials??[]).map(material=>{
                const returnMaterial={}
                if(material.pbrMetallicRoughness){
                    const mat=material.pbrMetallicRoughness
                    returnMaterial.uColor= mat.baseColorFactor??[1,1,1,1]
                    returnMaterial.diffuseTexture=mat.baseColorTexture?gltf.textures[mat.baseColorTexture.index]:null//createTexture(gl,[128,128,128,255])
                }
                returnMaterial.normalTexture=material.normalTexture?(gltf.textures[material.normalTexture.index]):null//createTexture(gl,[0,0,255,255])
                returnMaterial.emissiveTexture=material.emissiveTexture?(gltf.textures[material.emissiveTexture.index]):null//createTexture(gl,[128,128,128,255])
                return returnMaterial
            })
        
            gltf.meshes=gltf.meshes.map(mesh=>{
                let buff={geometry:{}}
                for(const key of Object.keys(mesh.primitives[0].attributes)){
                    buff.geometry[(key.replace('_0','').toLowerCase()+'s').replace('ss','s')]=gltf.accessors[mesh.primitives[0].attributes[key]]
                }
          
                buff.geometry.indices=gltf.accessors[mesh.primitives[0].indices]
                buff.material=gltf.materials ? gltf.materials[mesh.primitives[0].material]:{}
          
                return buff
            })
        
            const skinnodes = [];
            const orignodes = gltf.nodes;
            gltf.nodes = gltf.nodes.map((n) => {
              const {name, skin, mesh, translation, rotation, scale} = n;
        
              const trs = node('TRS')(translation, rotation, scale);
              const nodeScene = node('Scene')(trs, name);
              const realMesh = gltf.meshes[mesh];
              if (skin !== undefined) {
                skinnodes.push({node: nodeScene, mesh: realMesh, skinNdx: skin});
              } else if (realMesh) {
                const mesh=node('Mesh')(engine,realMesh.geometry,shader,node)
                mesh.uniforms=realMesh.material
                //node.add(mesh)
                //node.drawables.push(mesh);
                //engine.meshes.push(mesh)
              }
              return nodeScene;
            });
        
            gltf.skins = (gltf.skins??[]).map((skin) => {
              const joints = skin.joints.map(ndx => gltf.nodes[ndx]);
              const array = gltf.accessors[skin.inverseBindMatrices]
              return node('Skin').bind(skin)(gl,joints, array);
            });
        
            for (const {node:nodeScene, mesh, skinNdx} of skinnodes) {
              //console.log('load model mesh: ',mesh)
              const meshAdd=node('Mesh')(engine,mesh.geometry,shader,nodeScene)
              meshAdd.uniforms=mesh.material
              const skin=gltf.skins[skinNdx]
              meshAdd.skin=skin
              //node.add(meshAdd)
              //node.drawables.push(meshAdd);
              //engine.meshes.push(meshAdd)
            }
        
            gltf.nodes.forEach((nodeScene, ndx) => {
              const children = orignodes[ndx].children;
              if (children) {
                addChildren(gltf.nodes, nodeScene, children);
              }
            });
        
            for (const scene of gltf.scenes) {
              scene.root = node('Scene')(node('TRS')(), scene.name);
              addChildren(gltf.nodes, scene.root, scene.nodes);
            }
        
            engine.add(gltf.scenes[0].root)
        
            console.log(gltf)

            //for(const mesh of gltf.meshes){
            //    engine.add(mesh)
            //}
        
            //node('assign')(this,gltf)
        
            //gltf.scenes[0].root.updateWorldMatrix()

            const model=node('Scene')()
            node('assign')(model,gltf)


            return model

            
        })


        
        
        function addChildren(nodes, nodeScene, childIndices) {
            childIndices.forEach((childNdx) => {
                const child = nodes[childNdx];
                //child.setParent(node);
                nodeScene.add(child)
            });
        }
        
        
        
        
    
    }
    
    