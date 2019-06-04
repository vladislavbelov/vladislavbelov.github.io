/*
 * Copyright 2019 Vladislav Belov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

window.onload = function() {
    var isDrag = false;
    var sides  = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    var sideDirection = {
        'right': new THREE.Vector3(-1, 0, 0),
        'left': new THREE.Vector3(1, 0, 0),
        'front': new THREE.Vector3(0, 0, 1),
        'back': new THREE.Vector3(0, 0, -1),
        'top': new THREE.Vector3(0, 1, 0),
        'bottom': new THREE.Vector3(0, -1, 0),
    };

    var imagePrefix = 'sample/';
    var imageSuffix = '.png';

    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 512);
    var scene = new THREE.Scene();

    var skySideMeshes = {};
    for (let side of sides) {
        // Create a default mesh.
        let imageURL = imagePrefix + side + imageSuffix;
        let texture = new THREE.TextureLoader().load(imageURL);
        updateSide(side, texture);

        // Add a field to drag&drop a texture.
        let elem = document.getElementById(side);
        elem.style['background-image'] = 'url(' + imageURL + ')';

        // Setup drag&drop events to highlight a texture field.
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            elem.addEventListener(eventName, preventDefaults, false)
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            elem.addEventListener(eventName, function() {
                elem.classList.add('uponDrag');
            }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            elem.addEventListener(eventName, function() {
                elem.classList.remove('uponDrag');
            });
        });

        // Handle a drop.
        elem.addEventListener('drop', function(event) {
            let files = event.dataTransfer.files;
            if (files.length == 0)
                return false;
            let reader = new FileReader();
            reader.onload = function(event) {
                elem.style['background-image'] = 'url(' + event.target.result + ')';
                let texture = new THREE.TextureLoader().load(event.target.result);
                updateSide(side, texture);
            }
            reader.readAsDataURL(files[0]);
        }, false);
    }

    // Setup a renderer.
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('wrapper').appendChild(renderer.domElement);

    // Setup mouse events handlers to update the renderer correctly.
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseleave', onMouseLeave, false);
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousedown', onMouseDown, false);

    animate();

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    function preventDefaults(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    function updateSide(side, texture) {
        if (skySideMeshes[side])
            scene.remove(skySideMeshes[side]);
        let geometry = new THREE.PlaneGeometry(40, 40);
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.lookAt(sideDirection[side]);
        mesh.position.x = sideDirection[side].x * 20;
        mesh.position.y = sideDirection[side].y * 20;
        mesh.position.z = sideDirection[side].z * 20;
        scene.add(mesh);
        skySideMeshes[side] = mesh;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseDown(event) {
        isDrag = true;
    }

    function onMouseUp(event) {
        isDrag = false;
    }

    function onMouseLeave(event) {
        isDrag = false;
    }

    function onMouseMove(event) {
        // Mostly based on THREE.js example:
        // https://threejs.org/examples/?q=controls#misc_controls_pointerlock
        if (!isDrag)
            return false;

        let PI_2 = Math.PI / 2;

        let movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        let movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        let euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion( camera.quaternion );

        euler.y -= movementX * 0.002;
        euler.x -= movementY * 0.002;
        euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));

        camera.quaternion.setFromEuler(euler);
    }
}
