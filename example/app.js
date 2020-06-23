/* eslint no-undef: "off", no-unused-vars: "off" */
let data = {}
data.definition = 'BranchNodeRnd.gh'
data.inputs = {
  'RH_IN:201:Length':document.getElementById('length').value,
  'RH_IN:201:Count':document.getElementById('count').value,
  'RH_IN:201:Radius':document.getElementById('radius').value
}

// set this to the target appserver url
let url = window.location.href
url = url.substring(0, url.lastIndexOf('/'))
url = url.substring(0, url.lastIndexOf('/')) + '/'


rhino3dm().then(async m => {
  console.log('Loaded rhino3dm.')
  rhino = m // global

  init()
  compute()
})

/**
 * Call appserver
 */
function compute(){
  let t0 = performance.now()

  var xhr = new XMLHttpRequest()
  xhr.open('POST', url + data.definition, true)

  //Send the proper header information along with the request
  xhr.setRequestHeader('Content-Type', 'application/json')

  xhr.onreadystatechange = function() { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      // Request finished. Do processing here.
      let t1 = performance.now()
      const computeSolveTime = t1 - t0
      t0 = t1

      // hide spinner
      document.getElementById('loader').style.display = 'none'
      let result = JSON.parse(xhr.response)
      let data = JSON.parse(result.values[0].InnerTree['{ 0; }'][0].data)

      let mesh = rhino.CommonObject.decode(data)
      
      t1 = performance.now()
      const decodeMeshTime = t1 - t0
      t0 = t1

      let material = new THREE.MeshNormalMaterial()
      let threeMesh = meshToThreejs(mesh, material)
      mesh.delete()

      // clear meshes from scene
      scene.traverse(child => {
        if(child.type === 'Mesh'){
          scene.remove(child)
        }
      })

      scene.add(threeMesh)
      t1 = performance.now()
      const rebuildSceneTime = t1 - t0

      console.log('[call compute and rebuild scene]')
      console.log(`  ${Math.round(computeSolveTime)} ms: appserver request`)
      let timings = xhr.getResponseHeader('server-timing').split(',')
      let sum = 0
      timings.forEach(element => {
        let name = element.split(';')[0].trim()
        let time = element.split('=')[1].trim()
        sum += Number(time)
        console.log(`  .. ${time} ms: ${name}`)
      })
      console.log(`  .. ${Math.round(computeSolveTime - sum)} ms: local to appserver network`)
      console.log(`  ${Math.round(decodeMeshTime)} ms: decode json to rhino3dm mesh`)
      console.log(`  ${Math.round(rebuildSceneTime)} ms: create threejs mesh and insert in scene`)
    } else {
      //console.log(this.status)
      if(this.status === 500) console.error(xhr)
    }
  }

  xhr.send(JSON.stringify(data))
}

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
function onSliderChange () {
  // show spinner
  document.getElementById('loader').style.display = 'block'

  // get slider values
  data.inputs = {
    'RH_IN:201:Length':document.getElementById('length').value,
    'RH_IN:201:Count':document.getElementById('count').value,
    'RH_IN:201:Radius':document.getElementById('radius').value
  }
  compute()
}

// BOILERPLATE //

var scene, camera, renderer, controls

function init () {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(1,1,1)
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 )

  renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  let canvas = document.getElementById('canvas')
  canvas.appendChild( renderer.domElement )

  controls = new THREE.OrbitControls( camera, renderer.domElement  )

  camera.position.z = 50

  window.addEventListener( 'resize', onWindowResize, false )

  animate()
}

var animate = function () {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render( scene, camera )
}
  
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}

function meshToThreejs (mesh, material) {
  let loader = new THREE.BufferGeometryLoader()
  var geometry = loader.parse(mesh.toThreejsJSON())
  return new THREE.Mesh(geometry, material)
}
