import { Ray, RigidBody, World } from '@dimforge/rapier3d';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { A, D, DIRECTIONS, S, W } from './keydisplay'



export const CONTROLLER_BODY_RADIUS = 0.28;



var CharacterControls = /** @class */ (function () {
    function CharacterControls(model, mixer, animationsMap, orbitControl, camera, currentAction, ray, rigidBody) {
        
        this.animationsMap = new Map(); // Walk, Run, Idle

        // state
        this.toggleRun = true;

        // temporary data
        this.walkDirection = new THREE.Vector3();
        this.rotateAngle = new THREE.Vector3(0, 1, 0);
        this.rotateQuarternion = new THREE.Quaternion();
        this.cameraTarget = new THREE.Vector3();
        this.storedFall = 0;

        // constants
        this.fadeDuration = 0.2;
        this.runVelocity = 5;
        this.walkVelocity = 2;
        this.lerp = function (x, y, a) { return x * (1 - a) + y * a; };
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.animationsMap.forEach(function (value, key) {
            if (key == currentAction) {
                value.play();
            }
        });

        this.ray = ray;
        this.rigidBody = rigidBody;

        this.orbitControl = orbitControl;
        this.camera = camera;

        this.updateCameraTarget(new THREE.Vector3(0, 1, 5));
    }

    CharacterControls.prototype.switchRunToggle = function () {
        this.toggleRun = !this.toggleRun;
    };

    CharacterControls.prototype.update = function (world, delta, keysPressed) {
        var directionPressed = DIRECTIONS.some(function (key) { return keysPressed[key] == true; });

        var play = '';
        if (directionPressed && this.toggleRun) {
            play = 'Run';
        } else if (directionPressed) {
            play = 'Walk';
        }  else {
            play = 'Idle';
        }

        if (this.currentAction != play) {
            var toPlay = this.animationsMap.get(play);
            var current = this.animationsMap.get(this.currentAction);

            current.fadeOut(this.fadeDuration);
            toPlay.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play;
        }

        this.mixer.update(delta);

        this.walkDirection.x = this.walkDirection.y = this.walkDirection.z = 0;

        var velocity = 0;
        if (this.currentAction == 'Run' || this.currentAction == 'Walk') {

            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2((this.camera.position.x - this.model.position.x), (this.camera.position.z - this.model.position.z));
            
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed);
           
            // rotate model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);
            
            // calculate direction
            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);
            
            // run/walk velocity
            velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity;
        }

        var translation = this.rigidBody.translation();
        if (translation.y < -20) {
            // don't fall below ground
            this.rigidBody.setNextKinematicTranslation({
                x: 0,
                y: 10,
                z: 0
            });
        } else {
            var cameraPositionOffset = this.camera.position.sub(this.model.position);
            // update model and camera
            this.model.position.x = translation.x;
            this.model.position.y = translation.y;
            this.model.position.z = translation.z;
            this.updateCameraTarget(cameraPositionOffset);

            this.walkDirection.y += this.lerp(this.storedFall, -9.81 * delta, 0.10);
            this.storedFall = this.walkDirection.y;
            this.ray.origin.x = translation.x;
            this.ray.origin.y = translation.y;
            this.ray.origin.z = translation.z;
            var hit = world.castRay(this.ray, 0.5, false, 0xfffffffff);
            if (hit) {
                var point = this.ray.pointAt(hit.toi);
                var diff = translation.y - (point.y + CONTROLLER_BODY_RADIUS);
                if (diff < 0.0) {
                    this.storedFall = 0;
                    this.walkDirection.y = this.lerp(0, Math.abs(diff), 0.5);
                }
            }

            this.walkDirection.x = this.walkDirection.x * velocity * delta;
            this.walkDirection.z = this.walkDirection.z * velocity * delta;

            this.rigidBody.setNextKinematicTranslation({
                x: translation.x + this.walkDirection.x,
                y: translation.y + this.walkDirection.y,
                z: translation.z + this.walkDirection.z
            });
        }
    };

    CharacterControls.prototype.updateCameraTarget = function (offset) {
        // move camera
        var rigidTranslation = this.rigidBody.translation();
        this.camera.position.x = rigidTranslation.x + offset.x;
        this.camera.position.y = rigidTranslation.y + offset.y;
        this.camera.position.z = rigidTranslation.z + offset.z;

        // update camera target
        this.cameraTarget.x = rigidTranslation.x;
        this.cameraTarget.y = rigidTranslation.y + 1;
        this.cameraTarget.z = rigidTranslation.z;
        this.orbitControl.target = this.cameraTarget;
    };

    CharacterControls.prototype.directionOffset = function (keysPressed) {
        var directionOffset = 0; // w
        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // d
        }

        return directionOffset;
    };
    
    return CharacterControls;
}());

// Export CharacterControls
export {CharacterControls};