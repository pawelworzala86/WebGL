{

    node('init',async function(){


        const engine=await node('engine')()


        //node('Render2DScene')()

        //node('TriangulationScene')()

        //node('CubesScene')(engine)


        node('GLTFScene')(engine)









        node('pageStart')()




    })

    /*window.addEventListener('DOMContentLoaded', () => {
        node('init')()
    })*/

    node('init')()









    node('pageStart',function(){


        const scope={}

        scope["loadScene"]=function(){
            console.log('scene load...')
        }

        node('compile')(document.body, scope)


    })




}