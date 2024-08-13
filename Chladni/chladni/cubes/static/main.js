document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    const scene = new THREE.Scene();
    console.log('Scene created');

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    console.log('Camera created with initial position', camera.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(255);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visualization').appendChild(renderer.domElement);
    console.log('Renderer created and added to the DOM');

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.update();
    console.log('OrbitControls initialized');

    let currentMesh;
    let boundaryCondition = 'dirichlet'; // Default boundary condition

    function fetchAndRenderChladniPattern() {
        const A = parseFloat(document.getElementById('A').value);
        const B = parseFloat(document.getElementById('B').value);
        const C = parseFloat(document.getElementById('C').value);
        const D = parseFloat(document.getElementById('D').value);
        const E = parseFloat(document.getElementById('E').value);
        const F = parseFloat(document.getElementById('F').value);
        const u = parseInt(document.getElementById('u').value);
        const v = parseInt(document.getElementById('v').value);
        const w = parseInt(document.getElementById('w').value);
        const min_x = parseFloat(document.getElementById('min_x').value);
        const min_y = parseFloat(document.getElementById('min_y').value);
        const min_z = parseFloat(document.getElementById('min_z').value);
        const max_x = parseFloat(document.getElementById('max_x').value);
        const max_y = parseFloat(document.getElementById('max_y').value);
        const max_z = parseFloat(document.getElementById('max_z').value);

        fetch(`/api/chladni-pattern/?A=${A}&B=${B}&C=${C}&D=${D}&E=${E}&F=${F}&u=${u}&v=${v}&w=${w}&min_x=${min_x}&min_y=${min_y}&min_z=${min_z}&max_x=${max_x}&max_y=${max_y}&max_z=${max_z}&boundary=${boundaryCondition}`)
            .then(response => response.json())
            .then(data => {
                console.log('Received data:', data);

                if (!data.vertices || data.vertices.length === 0) {
                    console.error('No vertices received. Check the marching cubes algorithm.');
                    return;
                }

                if (currentMesh) {
                    scene.remove(currentMesh);
                }

                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array(data.vertices.flat());
                const indices = new Uint32Array(data.faces.flat());

                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(new THREE.BufferAttribute(indices, 1));

                geometry.computeVertexNormals();

                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load('/static/textures/concrete_seamless.jpg');
                texture.wrapS = THREE.RepeatWrapping; // Horizontal wrapping
                texture.wrapT = THREE.RepeatWrapping; // Vertical wrapping
                texture.repeat.set(7.5, 7.5); // Scale
                //texture.offset.set(2.4, 2.3); // Offset
                // Create a material with the loaded texture
                /*
                const checkerBoardMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    //color: 0x00ff00,
                    //metalness: 1.0,
                    roughness: 0.5,
                    side: THREE.DoubleSide

                });*/
                const checkerBoardMaterial = 
                new THREE.MeshPhongMaterial({
                    map: texture,
                    side: THREE.DoubleSide
                 })


                const material = new THREE.ShaderMaterial({
                    vertexShader: `
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize( normalMatrix * normal );
                            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                        }
                    `,
                    fragmentShader: `
                        varying vec3 vNormal;
                        uniform vec3 colorFront;
                        uniform vec3 colorBack;
                        varying vec3 vUv;

                        void main() 
                        {
                            if (dot(vNormal, vec3(0.0, 0.0, 1.0)) > 0.0) 
                            {
                                gl_FragColor = vec4(colorFront, 1.0);
                            } 
                                else {
                                gl_FragColor = vec4(colorBack, 1.0);
                            }                            
                        }
                    `,
                    uniforms: {
                        colorFront: { value: new THREE.Color(0x88ccee) }, // Color for the front side
                        colorBack: { value: new THREE.Color(0xee88cc) }   // Color for the back side
                    },
                    side: THREE.DoubleSide
                });
                

                



                currentMesh = new THREE.Mesh(geometry, checkerBoardMaterial);
                scene.add(currentMesh);
                console.log('Chladni pattern mesh added to the scene');

                const boundingBox = new THREE.Box3().setFromObject(currentMesh);
                const size = boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

                cameraZ *= 4;

                camera.position.set(cameraZ * Math.sin(Math.PI / 6),
                    cameraZ * Math.sin(Math.PI / 6),
                    cameraZ * Math.cos(Math.PI / 6));

                camera.lookAt(boundingBox.getCenter(new THREE.Vector3()));
                controls.target.copy(boundingBox.getCenter(new THREE.Vector3()));
                controls.update();
                console.log('Camera repositioned to', camera.position, 'to fit the Chladni pattern within view');
            })
            .catch(error => {
                console.error('Error fetching or processing Chladni pattern data:', error);
            });
    }

    // Debounce function to delay the execution
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Boundary condition buttons
    document.getElementById('dirichlet').addEventListener('click', () => {
        boundaryCondition = 'dirichlet';
        document.getElementById('dirichlet').classList.add('active');
        document.getElementById('neumann').classList.remove('active');
        fetchAndRenderChladniPattern();
    });

    document.getElementById('neumann').addEventListener('click', () => {
        boundaryCondition = 'neumann';
        document.getElementById('dirichlet').classList.remove('active');
        document.getElementById('neumann').classList.add('active');
        fetchAndRenderChladniPattern();
    });

    // Wrap fetchAndRenderChladniPattern with debounce
    const debouncedFetchAndRenderChladniPattern = debounce(fetchAndRenderChladniPattern, 300);

    // Initial pattern rendering
    fetchAndRenderChladniPattern();

    // Event listener for the Update Pattern button
    document.getElementById('updatePattern').addEventListener('click', debouncedFetchAndRenderChladniPattern);

    // Synchronize sliders with input fields with debounce
    document.querySelectorAll('#sliders input[type="range"]').forEach(input => {
        const correspondingInput = document.getElementById(input.id.replace('_slider', ''));
        input.addEventListener('input', () => {
            correspondingInput.value = input.value;
            debouncedFetchAndRenderChladniPattern(); // Use debounced function
        });
    });

    // Synchronize input fields with sliders with debounce
    document.querySelectorAll('#controls input[type="number"]').forEach(input => {
        const correspondingSlider = document.getElementById(input.id + '_slider');
        input.addEventListener('input', () => {
            correspondingSlider.value = input.value;
            debouncedFetchAndRenderChladniPattern(); // Use debounced function
        });
    });

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(50, 50, 50);
    scene.add(light);
    scene.add(light);
    console.log('Directional light added at position', light.position);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);
    console.log('Ambient light added to the scene');
    

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
    console.log('Animation loop started');
});