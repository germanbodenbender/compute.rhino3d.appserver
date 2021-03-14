// Import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/TransformControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/3DMLoader.js'

const model = 'mesh.3dm'

const material = new THREE.MeshBasicMaterial( { color:0xffffff, transparent: true, opacity: 0.75 } )
const lineMagentaMaterial = new THREE.LineBasicMaterial( { color: 0xff00ff} )
const lineBlackMaterial = new THREE.LineBasicMaterial( { color: 0x000000} )

document.addEventListener( 'pointerdown', handleInteraction, false)

// declare variables to store scene, camera, and renderer
let scene, camera, renderer, mouse, raycaster, controls, tcontrols
let terrainMesh, intersectables

init()
load()

// function to setup the scene, camera, renderer, etc
function init () {

    // Rhino models are z-up, so set this as the default
    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 )

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color( 1, 1, 1 )
    camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 0.1, 1000 )
    camera.position.x = 100
    camera.position.y = 100
    camera.position.z = 100

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer( { antialias: true } )
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( window.innerWidth, window.innerHeight )
    document.body.appendChild( renderer.domElement )

    // add some controls to orbit the camera
    controls = new OrbitControls( camera, renderer.domElement )

    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    intersectables = []

    // handle changes in the window size
    window.addEventListener( 'resize', onWindowResize, false )

    animate()

}

function load() {

    // load and pass to threejs
    const loader = new Rhino3dmLoader()
    loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )

    loader.load( model, function ( object ) {

        // uncomment to hide spinner when model loads
        document.getElementById( 'loader' ).style.display = 'none'

        object.traverse( child => {

            if ( child.isMesh ) {

                child.material = material
                child.name = 'terrainMesh'
                terrainMesh = child
                intersectables.push( terrainMesh )

            } else if ( child.isLine ) {

                const layerIndex = child.userData.attributes.layerIndex
                if ( object.userData.layers[ layerIndex ].name === 'dashed' )

                    child.material = lineMagentaMaterial

                else

                    child.material = lineBlackMaterial

            }

        } )

        console.log( object )

        scene.add( object )

    } )

}

let startPt, endPt, distance
function handleInteraction( event ) {

    // console.log( event )

    let coordinates = null
    if ( event instanceof PointerEvent ) {

        if ( event.type === 'pointerdown' ) {

            startPt = new THREE.Vector2( event.clientX, event.clientY )
            document.addEventListener( 'pointerup', handleInteraction, false )
            return

        } 
        
        if ( event.type === 'pointerup' ) {

            endPt = new THREE.Vector2( event.clientX, event.clientY )
            distance = startPt.distanceTo( endPt )
            coordinates =  { x: event.clientX, y: event.clientY }
            document.removeEventListener( 'pointerup', handleInteraction, false )

        }

    }

    onClick( coordinates )

}

function onClick( coo ) {

    console.log( `click! (${coo.x}, ${coo.y})`)
    console.log( `distance ${distance}` )

    // if we've been orbiting, distance will be > 0
    if ( distance > 0 ) return

	// calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

	mouse.x = ( coo.x / window.innerWidth ) * 2 - 1
    mouse.y = - ( coo.y / window.innerHeight ) * 2 + 1
    
    raycaster.setFromCamera( mouse, camera )

	// calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( intersectables, true )

    if ( intersects.length > 0 ) {

        // get closest object
        const object = intersects[ 0 ].object

        switch ( object.name ) {

            case 'terrainMesh':

                if ( tcontrols ) { 

                    scene.remove( tcontrols ) 
                    tcontrols.dispose()
                    tcontrols = null
                    return

                }

                const icoGeo = new THREE.IcosahedronGeometry()
                const icoMat = new THREE.MeshNormalMaterial()
                const ico = new THREE.Mesh( icoGeo, icoMat )
                ico.name = 'ico'
                ico.position.set(intersects[ 0 ].point.x, intersects[ 0 ].point.y, intersects[ 0 ].point.z)
                ico.userData.material = icoMat
                scene.add( ico )
                intersectables.push( ico )
                break

            case 'ico':

                if ( tcontrols ) { 

                    scene.remove( tcontrols ) 
                    tcontrols.dispose()

                }

                tcontrols = new TransformControls( camera, renderer.domElement )
                tcontrols.enabled = true
                tcontrols.attach( object )
                tcontrols.addEventListener( 'dragging-changed', onChange )
                scene.add(tcontrols)
                return

            default:
                return

        }

    }

    if ( tcontrols ) { 

        scene.remove( tcontrols ) 
        tcontrols.dispose()
        tcontrols = null
        return

    }

}

let dragging = false
let lastPt
function onChange( e ) {

    dragging = ! dragging

    // keep track of last valid intersection in case we drag off of the mesh
    const position = new THREE.Vector3( e.target.object.position.x, e.target.object.position.y, 100 )
    const intersector = new THREE.Raycaster()
    intersector.set( position, new THREE.Vector3( 0, 0, - 1 ) )
    const intersects = intersector.intersectObject( terrainMesh )

    if ( intersects.length > 0 ) {

        lastPt = intersects[ 0 ].point

    }

    if ( !dragging ) {

        e.target.object.position.set( lastPt.x, lastPt.y, lastPt.z )
        controls.enabled = true
        return 

    }

    controls.enabled = false
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
    animate()

}

// function to continuously render the scene
function animate() {

    requestAnimationFrame( animate )
    renderer.render( scene, camera )

}