import './style.css'
import * as THREE from 'three'
import { AmbientLight, BoxBufferGeometry, MeshPhongMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

import { CameraHelper } from 'three'
import { KeyDisplay } from './utils/keydisplay';
import { CharacterControls, CONTROLLER_BODY_RADIUS } from './utils/characterControls';
import { RigidBodyDesc, World, ColliderDesc, Ray } from '@dimforge/rapier3d';


// SCENE
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 1005;
orbitControls.enablePan = false;
// orbitControls.maxPolarAngle = Math.PI / 2 - .05; // Prevent Camera Below Ground
// orbitControls.minPolarAngle = Math.PI / 4; // Prevent top down view
orbitControls.update();

// LIGHTS
//      directionalLight
var dLight = new THREE.DirectionalLight('white', 0.6);
dLight.position.x = 20;
dLight.position.y = 30;
dLight.castShadow = true;
dLight.shadow.mapSize.width = 4096;
dLight.shadow.mapSize.height = 4096;

var d = 35;
dLight.shadow.camera.left = -d;
dLight.shadow.camera.right = d;
dLight.shadow.camera.top = d;
dLight.shadow.camera.bottom = -d;
scene.add(dLight);

//      ambientLight
var aLight = new THREE.AmbientLight('white', 0.4);
scene.add(aLight);


// Use the RAPIER module here.
var gravity = { x: 0.0, y: -9.81, z: 0.0 };
// var world = new World(gravity);
// Make global world variable
var world = new World(gravity);
// Bodys
var bodys = [];

// ANIMATE
document.body.appendChild(renderer.domElement);


// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);


function loadTexture(path) {
    var texture = new THREE.TextureLoader().load(path);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.x = 10;
    texture.repeat.y = 10;
    return texture;
}


// LOAD TERRAIN MODEL
var loader = new GLTFLoader();
loader.load('models/Plane.glb', function (gltf) {
    var terrain = gltf.scene;

    console.log(terrain.children[0])


    // scale the geometry to fit the scene
    // terrain.children[0].geometry.scale(10, 10, 10);



    
    // Add the terrain to the scene
    scene.add(terrain);

    terrain.children[0].matrixAutoUpdate = false;


    // var xyzScale = terrain.children[0].scale;
    // // console.log(xyzScale)
    // for(var i = 0; i < terrain.children[0].geometry.attributes.position.array.length; i += 3) {
    //     terrain.children[0].geometry.attributes.position.array[i] *= xyzScale.x;
    //     terrain.children[0].geometry.attributes.position.array[i + 1] *= xyzScale.y;
    //     terrain.children[0].geometry.attributes.position.array[i + 2] *= xyzScale.z;
    // }


    


    var vertices = terrain.children[0].geometry.attributes.position.array;
    // var vertices = terrain.children[0].matrix.elements;
    
    // Get the indices of the vertices.
    var indices = terrain.children[0].geometry.index.array;

    // For each index, get the 3 vertices that form a triangle.
    var triangles = [];
    for (var i = 0; i < indices.length; i += 3) {
        var a = indices[i];
        var b = indices[i + 1];
        var c = indices[i + 2];
        triangles.push([vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2]]);
        triangles.push([vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2]]);
        triangles.push([vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2]]);
    }
    console.log(triangles)

    // For each triangle put a bright purple sphere on the world.
    for (var i = 0; i < triangles.length; i++) {
        var sphere = new THREE.SphereGeometry(1, 16, 16);
        var material = new THREE.MeshPhongMaterial({ color: 0xFF00FF });
        var mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(triangles[i][0], triangles[i][1], triangles[i][2]);
        scene.add(mesh);
    }




    // Create a physics body for the terrain
    var terrainBodyDesc = RigidBodyDesc.fixed();
    var terrainBody = world.createRigidBody(terrainBodyDesc);
    terrainCollider = ColliderDesc.trimesh(vertices, indices);
    world.createCollider(terrainCollider, terrainBody);


    // // Add the terrain body to the array of bodies


    // // Create a physics shape for the terrain
    // var terrainShapeDesc = ColliderDesc.polyline(terrainVerticesArray);
    // world.createCollider(terrainShapeDesc, terrainBody);

    

    // // Create a physics body for the terrain
    // var terrainBodyDesc = RigidBodyDesc.fixed();
    // var terrainBody = world.createRigidBody(terrainBodyDesc);
    
    // // Create polyline collider for the terrain get indices
    // var indices = geometry.index.array;
    // var terrainColliderDesc = ColliderDesc.trimesh(vertices, indices);
    // world.createCollider(terrainColliderDesc, terrainBody);

    
})

// Add collision detection around the terrain
var terrainCollider = new ColliderDesc();
// terrainCollider.type = ColliderDesc.Type.BOX;
// terrainCollider.size = { x: 10, y: 0.5, z: 10 };
// terrainCollider.restitution = 0.0;
// terrainCollider.friction = 0.0;
// world.addCollider(terrainCollider);




// character controller
var characterControls;



var loader = new GLTFLoader();
loader.load('models/Soldier.glb', function (gltf) {
    var model = gltf.scene;
    model.traverse(function (object) {
        if (object.isMesh)
            object.castShadow = true;
    });
    scene.add(model);

    

    var gltfAnimations = gltf.animations;
    var mixer = new THREE.AnimationMixer(model);
    var animationsMap = new Map();
    gltfAnimations.filter(function (a) { return a.name != 'TPose'; }).forEach(function (a) {
        animationsMap.set(a.name, mixer.clipAction(a));
    });
    // RIGID BODY
    var bodyDesc = RigidBodyDesc.kinematicPositionBased().setTranslation(-1, 3, 1);
    var rigidBody = world.createRigidBody(bodyDesc);
    var dynamicCollider = ColliderDesc.ball(CONTROLLER_BODY_RADIUS);
    world.createCollider(dynamicCollider, rigidBody);

    characterControls = new CharacterControls(model, mixer, 
        animationsMap, orbitControls, 
        camera,  'Idle',
        new Ray( 
            { x: 0, y: 0, z: 0 },
            { x: 0, y: -1, z: 0} 
        ), rigidBody)
});



function body(scene, world, bodyType, colliderType, dimension, translation, rotation, color) {
    var bodyDesc;

    if (bodyType === 'dynamic') {
        bodyDesc = RigidBodyDesc.dynamic();
    } else if (bodyType === 'kinematicPositionBased') {
        bodyDesc = RigidBodyDesc.kinematicPositionBased();
    } else if (bodyType === 'static') {
        bodyDesc = RigidBodyDesc.fixed();
    }

    


    if (translation) {
        bodyDesc.setTranslation(translation.x, translation.y, translation.z);
    }

    if (rotation) {
        var q = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(rotation.x, rotation.y, rotation.z, 'XYZ')
        );
        bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }

    var rigidBody = world.createRigidBody(bodyDesc);


    var collider;
    if (colliderType === 'cube') {
        collider = ColliderDesc.cuboid(dimension.hx, dimension.hy, dimension.hz);
    } else if (colliderType === 'sphere') {
        collider = ColliderDesc.ball(dimension.radius);
    } else if (colliderType === 'cylinder') {
        collider = ColliderDesc.cylinder(dimension.hh, dimension.radius);
    } else if (colliderType === 'cone') {
        collider = ColliderDesc.cone(dimension.hh, dimension.radius);
        // cone center of mass is at bottom
        collider.centerOfMass = { x: 0, y: 0, z: 0 };
    }
    // Create collider on the global world
    world.createCollider(collider, rigidBody);

    

    var bufferGeometry;
    if (colliderType === 'cube') {
        bufferGeometry = new THREE.BoxBufferGeometry(dimension.hx * 2, dimension.hy * 2, dimension.hz * 2);
    } else if (colliderType === 'sphere') {
        bufferGeometry = new THREE.SphereBufferGeometry(dimension.radius, 32, 32);
    } else if (colliderType === 'cylinder') {
        bufferGeometry = new THREE.CylinderBufferGeometry(dimension.radius, dimension.radius, dimension.hh * 2, 32, 32);
    } else if (colliderType === 'cone') {
        bufferGeometry = new THREE.ConeBufferGeometry(dimension.radius, dimension.hh * 2, 32, 32);
    }

    var threeMesh = new THREE.Mesh(bufferGeometry, new THREE.MeshPhongMaterial({ color: color }));
    threeMesh.castShadow = true;
    threeMesh.receiveShadow = true;
    scene.add(threeMesh);
    
    return { rigid: rigidBody, mesh: threeMesh };
}

function generateTerrain(nsubdivs, scale) {
    var heights = [];
    // three plane
    var threeFloor = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(scale.x, scale.z, nsubdivs, nsubdivs),
        new THREE.MeshStandardMaterial({
            map: loadTexture('/textures/grass/Grass_005_BaseColor.jpg'),
            normalMap: loadTexture('/textures/grass/Grass_005_Normal.jpg'),
            aoMap: loadTexture('/textures/grass/Grass_005_AmbientOcclusion.jpg'),
            roughnessMap: loadTexture('/textures/grass/Grass_005_Roughness.jpg'),
            roughness: 0.6
        })
    );
    threeFloor.rotateX(-Math.PI / 2);
    threeFloor.receiveShadow = true;
    threeFloor.castShadow = true;
    scene.add(threeFloor);
    // add height data to plane
    var vertices = threeFloor.geometry.attributes.position.array;
    var dx = scale.x / nsubdivs;
    var dy = scale.z / nsubdivs;
    // store height data in map column-row map
    var columsRows = new Map();
    for (var i = 0; i < vertices.length; i += 3) {
        // translate into colum / row indices
        var row = Math.floor(Math.abs(vertices[i] + (scale.x / 2)) / dx);
        var column = Math.floor(Math.abs(vertices[i + 1] - (scale.z / 2)) / dy);
        // generate height for this column & row
        var randomHeight = Math.random();
        vertices[i + 2] = scale.y * randomHeight;
        // store height
        if (!columsRows.get(column)) {
            columsRows.set(column, new Map());
        }
        columsRows.get(column).set(row, randomHeight);
    }
    threeFloor.geometry.computeVertexNormals();
    // store height data into column-major-order matrix array
    for (var i = 0; i <= nsubdivs; ++i) {
        for (var j = 0; j <= nsubdivs; ++j) {
            heights.push(columsRows.get(j).get(i));
        }
    }
    var groundBodyDesc = RigidBodyDesc.fixed();
    var groundBody = world.createRigidBody(groundBodyDesc);
    var groundCollider = ColliderDesc.heightfield(nsubdivs, nsubdivs, new Float32Array(heights), scale);
    world.createCollider(groundCollider, groundBody.handle);
}




// Create Ground.
var nsubdivs = 1;
var scale = new THREE.Vector3(120.0, 3.0, 120.0);
// generateTerrain(nsubdivs, scale);

var staticB = body(
    scene,
    world,
    'static',
    'cube',
    { hx: 10, hy: 0.8, hz: 10 },
    { x: scale.x / 2, y: 2.5, z: 0 },
    { x: 0, y: 0, z: 0.3 },
    'pink'
);
bodys.push(staticB);

var cubeBody = body(
    scene,
    world,
    'dynamic',
    'cube',
    { hx: 0.5, hy: 0.5, hz: 0.5 },
    { x: 0, y: 3, z: 0 },
    { x: 0, y: 0.4, z: 0.7 },
    'orange'
);
bodys.push(cubeBody);

var sphereBody = body(
    scene,
    world,
    'dynamic',
    'sphere',
    { radius: 0.7 },
    { x: 4, y: 8, z: 2 },
    { x: 0, y: 1, z: 0 },
    'blue'
);
bodys.push(sphereBody);

var sphereBody2 = body(
    scene,
    world,
    'dynamic',
    'sphere',
    { radius: 0.7 },
    { x: 0, y: 15, z: 0 },
    { x: 0, y: 1, z: 0 },
    'red'
);
bodys.push(sphereBody2);

var cylinderBody = body(
    scene,
    world,
    'dynamic',
    'cylinder',
    { hh: 1.0, radius: 0.7 },
    { x: -7, y: 15, z: 8 },
    { x: 0, y: 1, z: 0 },
    'green'
);
bodys.push(cylinderBody);

var coneBody = body(
    scene,
    world,
    'dynamic',
    'cone',
    { hh: 1.0, radius: 1 },
    { x: 7, y: 10, z: -8 },
    { x: 0, y: 1, z: 0 },
    'purple'
);
bodys.push(coneBody);

// Add bodies to the world.

var keysPressed = {};
var keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', function (event) {
    keyDisplayQueue.down(event.key);
    if (event.shiftKey && characterControls) {
        characterControls.switchRunToggle();
    }
    keysPressed[event.key.toLowerCase()] = true;
}, false);
document.addEventListener('keyup', function (event) {
    keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false;
}, false);


// let bd = RigidBodyDesc.dynamic();
// bd.setTranslation(0,0,0);
// bd.setRotation(0, 0, 0);
// let rb = world.createRigidBody(bd);
// let cc = ColliderDesc.cuboid(1, 1, 1);
// world.createCollider(cc, rb.handle);

// let bf = new THREE.BoxBufferGeometry(1, 1, 1);
// let bm = new THREE.Mesh(bf, new THREE.MeshStandardMaterial({
//     color: 'red'
// }));
// scene.add(bm);

// bodys.push(rb);


var clock = new THREE.Clock();


var gameLoop = function () {
    var deltaTime = clock.getDelta();

    if (characterControls) {
        characterControls.update(world, deltaTime, keysPressed);
    }

    // Step the simulation forward.  
    world.step();
    
    // console.log(bodys[8].rigid.translation())
    // console.log(world)

    // console.log(bodys[2])



    // update 3d world with physical world
    bodys.forEach(function (body) {
        var position = body.rigid.translation();
        var rotation = body.rigid.rotation();
        body.mesh.position.set(position.x, position.y, position.z);
        body.mesh.setRotationFromQuaternion(
            new THREE.Quaternion(
                rotation.x,
                rotation.y,
                rotation.z,
                rotation.w
            )
        );


    });
    orbitControls.update();
    renderer.render(scene, camera);
    setTimeout(gameLoop, 16);
};
gameLoop();


