// Import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/TransformControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/3DMLoader.js'

const model = 'drone.3dm'

// BOILERPLATE //
let scene, camera, renderer, controls

init()
load()

function init () {

    THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1)

    scene = new THREE.Scene()
    scene.background = new THREE.Color(1,1,1)
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 )
    camera.position.set(26,-40,5)

    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )
    document.body.appendChild( renderer.domElement )

    controls = new OrbitControls( camera, renderer.domElement )

    window.addEventListener( 'resize', onWindowResize, false )

    animate()
}

function load() {

    const loader = new Rhino3dmLoader()
    loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )

    loader.load( model, function ( object ) {

        // hide spinner
        document.getElementById('loader').style.display = 'none'

        console.log( object )

        object.name = 'drone'

        scene.add( object )

        const tcontrols = new TransformControls( camera, renderer.domElement )
        tcontrols.enabled = true
        tcontrols.attach( object )
        tcontrols.addEventListener( 'dragging-changed', onChange )
        scene.add(tcontrols)

        const d2 = object.clone(true)
        d2.position.set(10,10,10)
        scene.add( d2 )
        const tcontrols2 = new TransformControls( camera, renderer.domElement )
        tcontrols2.enabled = true
        tcontrols2.attach( d2 )
        tcontrols2.addEventListener( 'dragging-changed', onChange )
        scene.add(tcontrols2)

        const d3 = object.clone(true)
        d3.position.set(10,0,15)
        scene.add( d3 )
        const tcontrols3 = new TransformControls( camera, renderer.domElement )
        tcontrols3.enabled = true
        tcontrols3.attach( d3 )
        tcontrols3.addEventListener( 'dragging-changed', onChange )
        scene.add(tcontrols3)

    
    } )

}

let points = []
let dragging = false
function onChange() {
  dragging = ! dragging
  if ( !dragging ) {
    // update points position
    points = []
    scene.traverse(child => {
      if ( child.name === 'drone' ) {
        const pt = "{\"X\":" + child.position.x + ",\"Y\":" + child.position.y + ",\"Z\":" + child.position.z + "}"
        points.push( pt )
        console.log(pt)
      }
    }, false)

    //Call compute
    //compute()

    controls.enabled = true
    return 
}

  controls.enabled = false

}

function animate () {
    requestAnimationFrame( animate )
    renderer.render( scene, camera )
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
    animate()
}