{
  
    node('createCanvas',function(){
        const canvas=document.createElement('canvas')
        canvas.width=window.innerWidth
        canvas.height=window.innerHeight
        document.body.append(canvas)
        return canvas
    })

}

{




    node('engine',async function(canvas=node('createCanvas')() ){

      

      //if(canvas===undefined){
        /*canvas=document.createElement('canvas')
        canvas.width=window.innerWidth
        canvas.height=window.innerHeight
        document.body.append(canvas)*/
        //canvas=node('createCanvas')()
      //}
      const gl = canvas.getContext("webgl2")

      //var ext = gl.getExtension('WEBGL_depth_texture');

      const engine={
        gl,
        models:[],
        add(scene){
            this.models.push(scene)
        }
      }
      


  

    engine.buffers=[]

    const buffer1=node('createRenderBuffer')(gl,512,512)
    engine.buffers.push(buffer1)

    const buffer2=node('createRenderBuffer')(gl,512,512)
    buffer2.shader=await node('createShaderByName')(gl,"depth")
    buffer2.clearColor=[0,0,0,1]
    engine.buffers.push(buffer2)


    /*const ceratePrinter=node('ceratePrinter');

    var left=0, width=25
    var x=-(((left-100)/100)*2)-1, wx=(width/100)*2
    const print = await ceratePrinter(engine, 1,0.5, -x, -x+wx)*/

    /*var left=25, width=25
    var x=-(((left-100)/100)*2)-1, wx=(width/100)*2
    this.print2 = new Print(this, 1,0.5, -x, -x+wx)

    var left=50, width=25
    var x=-(((left-100)/100)*2)-1, wx=(width/100)*2
    this.print3 = new Print(this, 1,0.5, -x, -x+wx)



    var left=50, width=50
    var x=-(((left-100)/100)*2)-1, wx=(width/100)*2
    this.print4 = new Print(this, 0.0,-1.0, -x, -x+wx)*/


    const bgTexture=node('loadTexture')(gl,"/images/box.webp")

    engine.renderers=[]


        const render2d=await node('Render2D')(engine,"render2d")
        render2d.source.scale=vec3(0.5)//[0.5,0.5,0.5]
        //render2d.source.translation=[-0.5,0.5,0]
        render2d.uniforms.colorTexture=buffer1.color
        render2d.uniforms.depthTexture=buffer2.color
        engine.renderers.push(render2d)

        const print2d1=await node('Render2D')(engine,"print2d")
        print2d1.source.scale=vec3(0.35)//[0.5,0.5,0.5]
        print2d1.source.translation=[-0.5,0.5,0]
        print2d1.uniforms.colorTexture=buffer1.color
        //print2d1.uniforms.depthTexture=buffer2.color
        engine.renderers.push(print2d1)

      /*const render2d2=await node('Render2D')(engine)
      render2d2.source.scale=[0.5,0.5,0.5]
      render2d2.source.translation=[0,0.5,0]
      render2d2.uniforms.colorTexture=buffer.depth
      engine.renderers.push(render2d2)*/

      ///render2d.uniforms.colorTexture=diffuseTexture
      //engine.models.push(render2d)


    //const colorTexture=diffuseTexture//buffer.color




    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    //gl.colorMask(true, true, true, false);//.glcolorMask() 
    //gl.depthFunc(gl.LEQUAL);

    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //gl.enable(gl.BLEND);








    const camera=node('createCamera')(gl)
    camera.source.translation[2] = -2000

    engine.camera=camera

      var delta

      function render(gl, uniforms, frameTime, shader){

        for(const model of engine.models){
  
          if(model.animate){
            model.animate(frameTime)
          }

          //animSkin(gltf, gltf.skins[0], delta);
  
          if(!model.render){
              console.log('model without render()...', model)
          }
          model.render(gl, uniforms, frameTime, shader)
  
       }
  
      }

      console.log('engine',engine);

    node('setupScene')(gl)

    var time_old = 0;
    let frame=0;

    var animate = function(time) {


       const frameTime = (time-time_old)*0.001;
       delta = frameTime
       frame++;



       time_old = time;


        const uniforms={
            projection: camera.projection(),
            camera: camera.matrix(),
            cameraPosition:camera.source.translation,
            lightDirection:camera.source.translation,
            iResolution:[gl.canvas.width,gl.canvas.height],
            iTime:time,
            delta:frameTime,
            frame:frame,
            backgroundTexture:bgTexture,
        }


        for (const scene of engine.models) {
          scene.updateWorldMatrix();
          if(gltf.skins){
            //scene.animSkin(delta);
            animSkin(gltf, gltf.skins[0], delta);
            if(scene.skin&&scene.skin.update){
              scene.skin.update(scene)
            }
          }
        }

      //for(const anim of this.anims){
      //  anim.bind(this)(delta)
      //}


        /*for(const buffer of engine.buffers){
            node('clearSceneAndSetBuffer')(gl,buffer)
            render(gl, uniforms, frameTime, buffer.shader)
        }*/

        node('clearSceneAndSetBuffer')(gl)
        render(gl, uniforms, frameTime)//, buffer2.shader)
        

        //render2d.uniforms.colorTexture=buffer.color//colorTexture
        //print.render(gl,uniforms)
        /*for(const render of engine.renderers){
            render.render(gl,uniforms)
        }*/




       requestAnimationFrame(animate);


    }
    animate(0);

    return engine

    })



}
