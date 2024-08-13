document.addEventListener('DOMContentLoaded', function () {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x202020);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visualization').appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.update();

    let currentMesh;
    let currentPatternData;
    let boundaryCondition = 'dirichlet'; 
    let currentLights = [];
    let ambientLight, directionalLight, hemisphereLight;
    let frontMesh, backMesh;

    function removeAllLights() {
        currentLights.forEach(light => scene.remove(light));
        currentLights = [];
    }

    function addLights(option) {
        removeAllLights();

        document.getElementById('ambientIntensity').disabled = true;
        document.getElementById('directionalIntensity').disabled = true;
        document.getElementById('hemisphereIntensity').disabled = true;

        if (option === 'option1') {
            ambientLight = new THREE.AmbientLight(0x404040, parseFloat(document.getElementById('ambientIntensity').value));
            scene.add(ambientLight);
            currentLights.push(ambientLight);

            directionalLight = new THREE.DirectionalLight(0xffffff, parseFloat(document.getElementById('directionalIntensity').value));
            directionalLight.position.set(50, 50, 50).normalize();
            scene.add(directionalLight);
            currentLights.push(directionalLight);

            hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, parseFloat(document.getElementById('hemisphereIntensity').value));
            scene.add(hemisphereLight);
            currentLights.push(hemisphereLight);

            document.getElementById('ambientIntensity').disabled = false;
            document.getElementById('directionalIntensity').disabled = false;
            document.getElementById('hemisphereIntensity').disabled = false;

        } else if (option === 'option2') {
            directionalLight = new THREE.DirectionalLight(0xffffff, parseFloat(document.getElementById('directionalIntensity').value));
            directionalLight.position.set(50, 50, 50);
            scene.add(directionalLight);
            currentLights.push(directionalLight);

            ambientLight = new THREE.AmbientLight(0x404040, parseFloat(document.getElementById('ambientIntensity').value));
            scene.add(ambientLight);
            currentLights.push(ambientLight);

            document.getElementById('ambientIntensity').disabled = false;
            document.getElementById('directionalIntensity').disabled = false;

        } else if (option === 'option3') {
            const pointLight = new THREE.PointLight(0xffffff, parseFloat(document.getElementById('directionalIntensity').value));
            camera.add(pointLight);
            scene.add(camera);
            currentLights.push(pointLight);

            document.getElementById('directionalIntensity').disabled = false;
        }
    }

    document.getElementById('ambientIntensity').addEventListener('input', () => {
        if (ambientLight) {
            ambientLight.intensity = parseFloat(document.getElementById('ambientIntensity').value);
        }
    });

    document.getElementById('directionalIntensity').addEventListener('input', () => {
        currentLights.forEach(light => {
            if (light instanceof THREE.DirectionalLight || light instanceof THREE.PointLight) {
                light.intensity = parseFloat(document.getElementById('directionalIntensity').value);
            }
        });
    });

    document.getElementById('hemisphereIntensity').addEventListener('input', () => {
        if (hemisphereLight) {
            hemisphereLight.intensity = parseFloat(document.getElementById('hemisphereIntensity').value);
        }
    });

    document.getElementById('lightingSelect').addEventListener('change', (event) => {
        addLights(event.target.value);
    });

    addLights('option1');

    document.getElementById('lightingSelect').addEventListener('change', function () {
        addLights(this.value);
    });

    function changeBackgroundColor(color) {
        renderer.setClearColor(parseInt(color, 16));
    }

    document.getElementById('backgroundColor').addEventListener('change', function () {
        changeBackgroundColor(this.value);
    });

    function changeShapeColor(color) {
        if (currentMesh) {
            currentMesh.material.color.set(color);
        }
    }

    document.getElementById('shapeColor').addEventListener('input', function () {
        changeShapeColor(this.value);
    });

    function createMaterial(type, color, side = THREE.FrontSide) {
        let material;
    
        switch (type) {
            case 'MeshPhysicalMaterial':
                material = new THREE.MeshPhysicalMaterial({
                    color: color,
                    metalness: 0.7,
                    roughness: 0.2,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1,
                    reflectivity: 0.5,
                    side: side,
                });
                break;
            case 'MeshStandardMaterial':
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.6,
                    roughness: 0.4,
                    side: side,
                });
                break;
            case 'MeshToonMaterial':
                material = new THREE.MeshToonMaterial({
                    color: color,
                    gradientMap: null,
                    side: side,
                });
                break;
            case 'MeshNormalMaterial':
                material = new THREE.MeshNormalMaterial({
                    flatShading: true,
                    side: side,
                });
                break;
            default:
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.5,
                    roughness: 0.5,
                    side: side,
                });
        }
        return material;
    }

    let backupSingleGeometry, backupSingleMaterial;
    let backupDoubleGeometry, backupFrontMaterial, backupBackMaterial;
    
    // Function to create or update material based on type and color
    function updateMaterial(material, type, color, side) {
        if (!material || material.type !== type || material.side !== side) {
            material = createMaterial(type, color, side);
        } else {
            material.color.set(color);
        }
        return material;
    }

    function changeShapeMaterial() {
        const selectedMaterialType = document.getElementById('shapeMaterial').value;
        const selectedColor = document.getElementById('shapeColor').value;
        const backColor = document.getElementById('backShapeColor').value;

        // Backup the original geometry, or use the existing geometry if currentMesh is not null
        const geometry = currentMesh ? currentMesh.geometry.clone() : new THREE.SphereGeometry(5, 32, 32);

        if (document.getElementById('renderMode').value === 'double') { // Double-sided rendering
            // Backup the single-sided geometry and material
            if (currentMesh) {
                backupSingleGeometry = currentMesh.geometry.clone();
                backupSingleMaterial = currentMesh.material.clone();
                scene.remove(currentMesh);
                currentMesh = null;
            }

            // Backup or restore the double-sided geometry and materials
            if (!frontMesh || !backMesh) {
                const frontMaterial = createMaterial(selectedMaterialType, selectedColor, THREE.FrontSide);
                const backMaterial = createMaterial(selectedMaterialType, backColor, THREE.BackSide);

                frontMesh = new THREE.Mesh(geometry.clone(), frontMaterial);
                backMesh = new THREE.Mesh(geometry.clone(), backMaterial);
                backMesh.position.z -= 0.001; // Slight offset to avoid z-fighting

                scene.add(frontMesh);
                scene.add(backMesh);
            } else {
                frontMesh.material = updateMaterial(frontMesh.material, selectedMaterialType, selectedColor, THREE.FrontSide);
                backMesh.material = updateMaterial(backMesh.material, selectedMaterialType, backColor, THREE.BackSide);
            }

        } else { // Single-sided rendering
            // Backup the double-sided geometry and materials
            if (frontMesh && backMesh) {
                backupDoubleGeometry = frontMesh.geometry.clone();
                backupFrontMaterial = frontMesh.material.clone();
                backupBackMaterial = backMesh.material.clone();
                scene.remove(frontMesh);
                scene.remove(backMesh);
                frontMesh = null;
                backMesh = null;
            }

            // Restore or create the single-sided mesh
            if (!currentMesh) {
                const material = createMaterial(selectedMaterialType, selectedColor, THREE.DoubleSide);
                currentMesh = new THREE.Mesh(backupSingleGeometry ? backupSingleGeometry.clone() : geometry.clone(), backupSingleMaterial ? backupSingleMaterial.clone() : material);
                scene.add(currentMesh);
            } else {
                currentMesh.material.color.set(selectedColor);
            }
        }

        // debugging
        console.log("Current Mesh:", currentMesh);
        console.log("Front Mesh:", frontMesh);
        console.log("Back Mesh:", backMesh);
    }

    // Add event listeners to update colors in real-time
    document.getElementById('shapeColor').addEventListener('input', changeShapeMaterial);
    document.getElementById('backShapeColor').addEventListener('input', changeShapeMaterial);

    document.getElementById('renderMode').addEventListener('change', function () {
        const backColorInput = document.getElementById('backShapeColor');
        const backColorPicker = document.getElementById('backColorPicker');
   
        if (this.value === 'double') {
            backColorPicker.style.display = 'block'; // Show the color picker
            backColorInput.disabled = false;
        } else {
            backColorPicker.style.display = 'none'; // Hide the color picker
            backColorInput.disabled = true;
        }
        changeShapeMaterial();
    });
   
    document.getElementById('backShapeColor').addEventListener('input', function () {
        changeShapeMaterial();
    });   

    document.getElementById('shapeMaterial').addEventListener('change', function () {
        changeShapeMaterial();
    });

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
    
        // alert to ensure the values are within expected ranges
        if (isNaN(u) || isNaN(v) || isNaN(w) || u < 1 || v < 1 || w < 1) {
            console.error('Invalid input: u, v, and w must be positive integers.');
            alert('Please enter valid positive integers for u, v, and w.');
            return;
        }
    
        fetch(`/api/chladni-pattern/?A=${A}&B=${B}&C=${C}&D=${D}&E=${E}&F=${F}&u=${u}&v=${v}&w=${w}&min_x=${min_x}&min_y=${min_y}&min_z=${min_z}&max_x=${max_x}&max_y=${max_y}&max_z=${max_z}&boundary=${boundaryCondition}`)
            .then(response => response.json())
            .then(data => {
                if (!data.vertices || data.vertices.length === 0) {
                    console.error('No vertices received.');
                    return;
                }
    
                if (currentMesh) scene.remove(currentMesh);
                if (frontMesh) scene.remove(frontMesh);
                if (backMesh) scene.remove(backMesh);
    
                currentPatternData = data;
    
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array(data.vertices.flat());
                const indices = new Uint32Array(data.faces.flat());
    
                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                geometry.computeVertexNormals();
    
                // Update backup geometry and material for single-sided view
                backupSingleGeometry = geometry.clone();
                backupSingleMaterial = new THREE.MeshStandardMaterial({
                    color: document.getElementById('shapeColor').value,
                    metalness: 0.5,
                    roughness: 0.5,
                    side: THREE.DoubleSide
                });
    
                const frontMaterial = new THREE.MeshStandardMaterial({
                    color: document.getElementById('shapeColor').value,
                    metalness: 0.5,
                    roughness: 0.5,
                    side: THREE.FrontSide
                });
    
                const backMaterial = new THREE.MeshStandardMaterial({
                    color: document.getElementById('backShapeColor').value,
                    metalness: 0.5,
                    roughness: 0.5,
                    side: THREE.BackSide
                });
    
                if (document.getElementById('renderMode').value === 'double') {
                    frontMesh = new THREE.Mesh(geometry, frontMaterial);
                    backMesh = new THREE.Mesh(geometry.clone(), backMaterial);
                    backMesh.position.z -= 0.001; // Slight offset to render together (avoid z-fighting)
    
                    scene.add(frontMesh);
                    scene.add(backMesh);
                } else {
                    currentMesh = new THREE.Mesh(geometry, backupSingleMaterial);
                    scene.add(currentMesh);
                }
    
                const boundingBox = new THREE.Box3().setFromObject(currentMesh || frontMesh);
                const size = boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 4;
    
                camera.position.set(cameraZ * Math.sin(Math.PI / 6),
                    cameraZ * Math.sin(Math.PI / 6),
                    cameraZ * Math.cos(Math.PI / 6));
    
                camera.lookAt(boundingBox.getCenter(new THREE.Vector3()));
                controls.target.copy(boundingBox.getCenter(new THREE.Vector3()));
                controls.update();
            })
            .catch(error => console.error('Error fetching or processing Chladni pattern data:', error));
    }
    

    function exportPatternData() {
        if (!currentPatternData || !currentMesh) {
            console.error("No pattern data or mesh available to export.");
            return;
        }

        const params = {
            A: parseFloat(document.getElementById('A').value),
            B: parseFloat(document.getElementById('B').value),
            C: parseFloat(document.getElementById('C').value),
            D: parseFloat(document.getElementById('D').value),
            E: parseFloat(document.getElementById('E').value),
            F: parseFloat(document.getElementById('F').value),
            u: parseInt(document.getElementById('u').value),
            v: parseInt(document.getElementById('v').value),
            w: parseInt(document.getElementById('w').value),
            min_x: parseFloat(document.getElementById('min_x').value),
            min_y: parseFloat(document.getElementById('min_y').value),
            min_z: parseFloat(document.getElementById('min_z').value),
            max_x: parseFloat(document.getElementById('max_x').value),
            max_y: parseFloat(document.getElementById('max_y').value),
            max_z: parseFloat(document.getElementById('max_z').value)
        };

        const exportData = {
            parameters: params,
            patternData: currentMesh.geometry.toJSON()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "chladni_pattern.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function importPatternData(event) {
        const file = event.target.files[0];
        if (!file) {
            console.error("No file selected for import.");
            return;
        }
    
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonContent = e.target.result;
            const importedData = JSON.parse(jsonContent);
    
            const loader = new THREE.BufferGeometryLoader();
            const geometry = loader.parse(importedData.patternData);
    
            // Remove any existing meshes (single or double-sided)
            if (currentMesh) scene.remove(currentMesh);
            if (frontMesh) scene.remove(frontMesh);
            if (backMesh) scene.remove(backMesh);
    
            const material = new THREE.MeshStandardMaterial({
                color: 0x88ccee,
                metalness: 0.5,
                roughness: 0.5,
                side: THREE.DoubleSide
            });
    
            currentMesh = new THREE.Mesh(geometry, material);
            scene.add(currentMesh);
    
            const boundingBox = new THREE.Box3().setFromObject(currentMesh);
            const size = boundingBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 4;
    
            camera.position.set(cameraZ * Math.sin(Math.PI / 6),
                cameraZ * Math.sin(Math.PI / 6),
                cameraZ * Math.cos(Math.PI / 6));
    
            camera.lookAt(boundingBox.getCenter(new THREE.Vector3()));
            controls.target.copy(boundingBox.getCenter(new THREE.Vector3()));
            controls.update();
        };
    
        reader.readAsText(file);
    
        // Reset the file input to ensure change event triggers on the same file selection
        event.target.value = '';
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

    // Wrap fetchAndRenderChladniPattern with debounce
    const debouncedFetchAndRenderChladniPattern = debounce(fetchAndRenderChladniPattern, 300);

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

    // Initial pattern rendering
    fetchAndRenderChladniPattern();

    // Event listeners
    document.getElementById('updatePattern').addEventListener('click', debouncedFetchAndRenderChladniPattern);
    document.getElementById('exportButton').addEventListener('click', exportPatternData);
    document.getElementById('importButton').addEventListener('change', importPatternData);
    document.getElementById('triggerImportButton').addEventListener('click', () => {
        document.getElementById('importButton').click();
    });

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

    // Initial scene setup
    fetchAndRenderChladniPattern();

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
});