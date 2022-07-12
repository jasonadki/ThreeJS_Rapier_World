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
loader.load('models/planeTorus.glb', function (gltf) {
    var terrain = gltf.scene;

    console.log(terrain);

    // Make terrain transparent
    // terrain.children[0].material.transparent = true;

    // Rotate the terrain -90 degrees around the x-axis.
    // terrain.rotation.x = Math.PI / 2;

    // // Rotate the terrain 90 degrees around the y-axis.
    // terrain.rotation.z = Math.PI / 2;
    


    // scale the geometry to fit the scene
    // terrain.children[0].geometry.scale(10, 10, 10);



    
    
    
    

    terrain.children[0].matrixAutoUpdate = false;
    // terrain.children.matrixAutoUpdate = false;

    var xyzScale = terrain.children[0].scale;
    // console.log(xyzScale)
    for(var i = 0; i < terrain.children[0].geometry.attributes.position.array.length; i += 3) {
        terrain.children[0].geometry.attributes.position.array[i] *= xyzScale.x;
        terrain.children[0].geometry.attributes.position.array[i + 1] *= xyzScale.y;
        terrain.children[0].geometry.attributes.position.array[i + 2] *= xyzScale.z;
    }

    // Swap the y and z values of the terrain.
    for(var i = 0; i < terrain.children[0].geometry.attributes.position.array.length; i += 3) {
        var temp = terrain.children[0].geometry.attributes.position.array[i + 1];
        terrain.children[0].geometry.attributes.position.array[i + 1] = terrain.children[0].geometry.attributes.position.array[i + 2];
        terrain.children[0].geometry.attributes.position.array[i + 2] = temp;
    }

    // Flip the z values of the terrain.
    for(var i = 0; i < terrain.children[0].geometry.attributes.position.array.length; i += 3) {
        terrain.children[0].geometry.attributes.position.array[i + 1] *= -1;
    }
    

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
        var sphere = new THREE.SphereGeometry(.1, 16, 16);
        var material = new THREE.MeshPhongMaterial({ color: 0xFF00FF });
        var mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(triangles[i][0], triangles[i][1], triangles[i][2]);
        scene.add(mesh);


    }

    

    // User vertices and indices to draw lines between the vertices.
    var points = [];
    var pointIndices = [];
    for (var i = 0; i < indices.length; i += 3) {
        var a = indices[i];
        var b = indices[i + 1];
        var c = indices[i + 2];
        points.push(new THREE.Vector3(vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2]));
        points.push(new THREE.Vector3(vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2]));
        points.push(new THREE.Vector3(vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2]));
        pointIndices.push(i);
        pointIndices.push(i + 1);
        pointIndices.push(i + 2);
    }
    var edges = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0x0000FF });
    var line = new THREE.Line(edges, material);
    scene.add(line);

    console.log(points)

    var expandedVertices = [];
    var expandedIndices = [];
    for (var i = 0; i < points.length; i++) {
        expandedVertices.push(points[i].x);
        expandedVertices.push(points[i].y);
        expandedVertices.push(points[i].z);

        expandedIndices.push(i);
    }

    // Print length of expandedVertices and expandedIndices.
    console.log(expandedVertices.length);
    console.log(expandedIndices.length);

    




    // Create a physics body for the terrain
    var terrainBodyDesc = RigidBodyDesc.fixed();
    var terrainBody = world.createRigidBody(terrainBodyDesc);
    var terrainCollider = ColliderDesc.trimesh(expandedVertices, expandedIndices);

        // Add the terrain to the scene
        // scene.add(terrain);
    console.log(terrainCollider)
    world.createCollider(terrainCollider, terrainBody);
})



var clock = new THREE.Clock();


var gameLoop = function () {
    var deltaTime = clock.getDelta();

    // if (characterControls) {
    //     characterControls.update(world, deltaTime, keysPressed);
    // }

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


