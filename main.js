/* ==================================================
   PV Studios - AAA Cinematic Hero Section JS (WebGL)
   ================================================== */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Web Audio API Sci-Fi Sound Synthesizer
const AudioFX = {
    ctx: null,
    isMuted: false,

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported in this browser');
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playHover() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.008, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    },

    playClick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(360, this.ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.25);
        osc2.stop(this.ctx.currentTime + 0.25);
    },

    playWelcome() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        // Deep warm saw chord rising in pitch
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 chord base
        osc1.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 1.2);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(165, this.ctx.currentTime); // E3 chord fifth
        osc2.frequency.exponentialRampToValueAtTime(330, this.ctx.currentTime + 1.5);

        // Lowpass sweep for sci-fi swoop effect
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + 1.2);
        filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        // Envelope transition
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 1.8);
        osc2.stop(this.ctx.currentTime + 1.8);
    }
};

// 2. WebGL 3D Engine Setup
const WebGLEngine = {
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,

    // 3D Object groups
    leftGroup: null,
    rightGroup: null,
    centerGroup: null,

    // Interaction states
    mouseX: 0,
    mouseY: 0,
    targetCameraX: 0,
    targetCameraY: 0,
    scrollPercent: 0,

    // Glow highlight factors for models (fade in/out on hover)
    glowTargets: { left: 0, center: 0, right: 0 },
    glowCurrents: { left: 0, center: 0, right: 0 },

    // Bounded scales & sizes
    modelsLoaded: { left: false, right: false, center: false },
    bytesLoaded: { left: 0, right: 0, center: 0 },
    
    // File sizes (in bytes) to display clean percentage progress
    totalSizes: {
        left: 81284604,   // left_workstation.glb
        center: 57150580, // center_island.glb
        right: 51272432   // right_cube.glb
    },

    // 3D Particle Systems
    dustParticles: null,
    emberParticles: null,

    init() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) return;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 16);

        // Model root groups
        this.leftGroup = new THREE.Group();
        this.rightGroup = new THREE.Group();
        this.centerGroup = new THREE.Group();
        this.scene.add(this.leftGroup);
        this.scene.add(this.rightGroup);
        this.scene.add(this.centerGroup);

        this.setupLights();
        this.setupParticles();
        this.loadModels();
        this.sliceServicesHub();

        // Mouse listeners
        window.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) - 0.5;
            this.mouseY = (e.clientY / window.innerHeight) - 0.5;
            this.targetCameraX = this.mouseX * 3.5;
            this.targetCameraY = -this.mouseY * 3.5;
        });

        // Scroll listener to calculate page scroll percentage
        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            this.scrollPercent = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        });

        window.addEventListener('resize', () => this.resize());
        this.animate();
    },

    setupLights() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
        this.scene.add(ambientLight);

        // Warm Orange Key Directional Light
        const keyLight = new THREE.DirectionalLight(0xf59a23, 2.5);
        keyLight.position.set(5, 10, 5);
        this.scene.add(keyLight);

        // Rim Directional Lights (Back edges)
        const rimLightLeft = new THREE.DirectionalLight(0xe57f15, 1.8);
        rimLightLeft.position.set(-10, 5, -8);
        this.scene.add(rimLightLeft);

        const rimLightRight = new THREE.DirectionalLight(0xffc15a, 1.2);
        rimLightRight.position.set(10, 5, -8);
        this.scene.add(rimLightRight);

        // Accent Point Lights for local atmospheric glow
        this.leftPointLight = new THREE.PointLight(0xf59a23, 5, 12);
        this.leftPointLight.position.set(-5, 1, 1);
        this.scene.add(this.leftPointLight);

        this.rightPointLight = new THREE.PointLight(0xe57f15, 5, 12);
        this.rightPointLight.position.set(5, 1, 1);
        this.scene.add(this.rightPointLight);

        this.centerPointLight = new THREE.PointLight(0xffc15a, 4, 10);
        this.centerPointLight.position.set(0, -1, 1);
        this.scene.add(this.centerPointLight);
    },

    setupParticles() {
        // Generate circular gradient particle texture dynamically
        const createParticleTexture = () => {
            const pCanvas = document.createElement('canvas');
            pCanvas.width = 32;
            pCanvas.height = 32;
            const pCtx = pCanvas.getContext('2d');
            
            const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            pCtx.fillStyle = grad;
            pCtx.fillRect(0, 0, 32, 32);
            return new THREE.CanvasTexture(pCanvas);
        };

        const texture = createParticleTexture();

        // 1. Ambient Background Dust
        const dustCount = 200;
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(dustCount * 3);
        const dustVel = [];

        for (let i = 0; i < dustCount; i++) {
            dustPos[i * 3] = (Math.random() - 0.5) * 35;
            dustPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            dustPos[i * 3 + 2] = (Math.random() - 0.5) * 15;
            
            dustVel.push({
                x: (Math.random() - 0.5) * 0.01,
                y: -(Math.random() * 0.015 + 0.005),
                z: (Math.random() - 0.5) * 0.01
            });
        }

        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        const dustMat = new THREE.PointsMaterial({
            size: 0.15,
            map: texture,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.dustParticles = new THREE.Points(dustGeo, dustMat);
        this.dustParticles.velocities = dustVel;
        this.scene.add(this.dustParticles);

        // 2. Volumetric Orange Embers
        const emberCount = 90;
        const emberGeo = new THREE.BufferGeometry();
        const emberPos = new Float32Array(emberCount * 3);
        const emberVel = [];

        for (let i = 0; i < emberCount; i++) {
            emberPos[i * 3] = (Math.random() - 0.5) * 30;
            emberPos[i * 3 + 1] = (Math.random() - 0.5) * 18 - 8;
            emberPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            emberVel.push({
                x: (Math.random() - 0.5) * 0.02,
                y: -(Math.random() * 0.04 + 0.015),
                z: (Math.random() - 0.5) * 0.02,
                wobble: Math.random() * Math.PI,
                wobbleSpeed: Math.random() * 0.03 + 0.015
            });
        }

        emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
        const emberMat = new THREE.PointsMaterial({
            size: 0.35,
            map: texture,
            color: new THREE.Color(0xf59a23),
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.emberParticles = new THREE.Points(emberGeo, emberMat);
        this.emberParticles.velocities = emberVel;
        this.scene.add(this.emberParticles);
    },

    loadModels() {
        const loader = new GLTFLoader();

        // 1. Left Workstation Loading
        loader.load('assets/left_workstation.glb',
            (gltf) => {
                const normalized = this.normalizeModel(gltf.scene, 3.4);
                this.leftGroup.add(normalized);
                this.modelsLoaded.left = true;
                this.checkLoadComplete();
            },
            (xhr) => {
                this.bytesLoaded.left = xhr.loaded;
                this.updateProgressBar();
            },
            (err) => console.error('Error loading left workstation:', err)
        );

        // 2. Center Island Loading
        loader.load('assets/center_island.glb',
            (gltf) => {
                const normalized = this.normalizeModel(gltf.scene, 5.2);
                this.centerGroup.add(normalized);
                this.modelsLoaded.center = true;
                this.checkLoadComplete();
            },
            (xhr) => {
                this.bytesLoaded.center = xhr.loaded;
                this.updateProgressBar();
            },
            (err) => console.error('Error loading center island:', err)
        );

        // 3. Right Cube Loading
        loader.load('assets/right_cube.glb',
            (gltf) => {
                const normalized = this.normalizeModel(gltf.scene, 3.2);
                this.rightGroup.add(normalized);
                this.modelsLoaded.right = true;
                this.checkLoadComplete();
            },
            (xhr) => {
                this.bytesLoaded.right = xhr.loaded;
                this.updateProgressBar();
            },
            (err) => console.error('Error loading right cube:', err)
        );
    },

    normalizeModel(modelScene, targetSize) {
        const box = new THREE.Box3().setFromObject(modelScene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = targetSize / maxDim;
        
        modelScene.scale.set(scale, scale, scale);

        // Center origin point
        const center = box.getCenter(new THREE.Vector3());
        modelScene.position.x = -center.x * scale;
        modelScene.position.y = -center.y * scale;
        modelScene.position.z = -center.z * scale;

        // Apply metal/emissive tweaks
        modelScene.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                    child.material.roughness = Math.min(child.material.roughness, 0.45);
                    child.material.metalness = Math.max(child.material.metalness, 0.8);
                    
                    if (!child.material.emissive) {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                }
            }
        });

        const pivotGroup = new THREE.Group();
        pivotGroup.add(modelScene);
        return pivotGroup;
    },

    updateProgressBar() {
        const total = this.totalSizes.left + this.totalSizes.center + this.totalSizes.right;
        const loaded = this.bytesLoaded.left + this.bytesLoaded.center + this.bytesLoaded.right;
        
        const percent = Math.min(Math.round((loaded / total) * 100), 99);
        
        document.getElementById('loader-percent').innerText = `${percent}%`;

        const circle = document.querySelector('.spinner-path');
        if (circle) {
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }

        const statusEl = document.getElementById('loader-status');
        const substatusEl = document.querySelector('.loader-substatus');
        if (percent < 30) {
            statusEl.innerText = "Loading Creative Workspace...";
            substatusEl.innerText = `(${(loaded/1024/1024).toFixed(1)} MB / 180.9 MB)`;
        } else if (percent < 60) {
            statusEl.innerText = "Loading Development Cube...";
            substatusEl.innerText = "Allocating memory buffers...";
        } else if (percent < 90) {
            statusEl.innerText = "Loading Center Island core...";
            substatusEl.innerText = "Initializing shader compilation...";
        } else {
            statusEl.innerText = "Processing High-Contrast Bloom...";
            substatusEl.innerText = "Ready to start.";
        }
    },

    checkLoadComplete() {
        if (this.modelsLoaded.left && this.modelsLoaded.center && this.modelsLoaded.right) {
            setTimeout(() => {
                document.getElementById('loader-percent').innerText = `100%`;
                const circle = document.querySelector('.spinner-path');
                if (circle) circle.style.strokeDashoffset = 0;

                setTimeout(() => {
                    document.body.classList.add('loaded');
                    this.loadingScreenEnded = true;

                    // Play cinematic welcome chime sound
                    AudioFX.playWelcome();
                    this.welcomeSoundPlayed = true;

                    this.resize();
                }, 400);
            }, 600);
        }
    },

    // 3. Draw clean Services Hub visual onto canvas at runtime
    sliceServicesHub() {
        const servImg = new Image();
        servImg.src = 'assets/services_hub.jpg';
        
        servImg.onload = () => {
            const canvas = document.getElementById('canvas-services-hub');
            if (!canvas) return;

            canvas.width = 704;
            canvas.height = 576;
            const ctx = canvas.getContext('2d');
            
            // Draw the clean visual directly
            ctx.drawImage(servImg, 0, 0, 704, 576);
        };
    },

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        if (width > 992) {
            const widthOffset = aspect * 3.4;
            this.leftGroup.position.set(-widthOffset, 0.8, -1);
            this.rightGroup.position.set(widthOffset, 0.8, -1);
            this.centerGroup.position.set(0, -1.8, 0);

            this.leftGroup.visible = true;
            this.rightGroup.visible = true;
            
            this.leftPointLight.position.set(-widthOffset, 1, 1);
            this.rightPointLight.position.set(widthOffset, 1, 1);
        } else {
            this.leftGroup.visible = false;
            this.rightGroup.visible = false;
            this.centerGroup.position.set(0, -0.6, 0);
        }
    },

    animate() {
        const time = Date.now() * 0.001;

        // 1. Floating Animation Loop
        if (this.leftGroup) {
            this.leftGroup.position.y = 0.8 + Math.sin(time * 0.8) * 0.12;
            this.leftGroup.rotation.y = Math.sin(time * 0.3) * 0.05;
        }
        if (this.rightGroup) {
            this.rightGroup.position.y = 0.8 + Math.sin(time * 0.7) * 0.15;
            this.rightGroup.rotation.y = Math.cos(time * 0.3) * 0.05;
        }
        if (this.centerGroup) {
            this.centerGroup.position.y = (window.innerWidth > 992 ? -1.8 : -0.6) + Math.sin(time * 0.5) * 0.1;
            this.centerGroup.rotation.y = time * 0.03;
        }

        // 2. Smoothly Interpolate Hover Glow Highlights (traversal)
        const updateMeshGlow = (group, factor) => {
            group.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissive.setRGB(factor * 0.6, factor * 0.25, 0);
                }
            });
        };

        const easeGlow = (key) => {
            this.glowCurrents[key] += (this.glowTargets[key] - this.glowCurrents[key]) * 0.08;
        };

        easeGlow('left');
        easeGlow('center');
        easeGlow('right');

        updateMeshGlow(this.leftGroup, this.glowCurrents.left);
        updateMeshGlow(this.centerGroup, this.glowCurrents.center);
        updateMeshGlow(this.rightGroup, this.glowCurrents.right);

        // 3. Move Particles in 3D (Accelerate drift speed when scrolling page)
        const particleSpeedFactor = 1.0 + this.scrollPercent * 3.0; // 4x speed at 100% scroll

        if (this.dustParticles) {
            const posAttr = this.dustParticles.geometry.attributes.position;
            const vels = this.dustParticles.velocities;
            for (let i = 0; i < posAttr.count; i++) {
                let x = posAttr.getX(i) + vels[i].x;
                let y = posAttr.getY(i) + vels[i].y * particleSpeedFactor;
                let z = posAttr.getZ(i) + vels[i].z;

                if (y < -15) {
                    y = 15;
                    x = (Math.random() - 0.5) * 35;
                }
                posAttr.setXYZ(i, x, y, z);
            }
            posAttr.needsUpdate = true;
        }

        if (this.emberParticles) {
            const posAttr = this.emberParticles.geometry.attributes.position;
            const vels = this.emberParticles.velocities;
            for (let i = 0; i < posAttr.count; i++) {
                vels[i].wobble += vels[i].wobbleSpeed;
                
                let x = posAttr.getX(i) + vels[i].x + Math.sin(vels[i].wobble) * 0.015;
                let y = posAttr.getY(i) + vels[i].y * particleSpeedFactor;
                let z = posAttr.getZ(i) + vels[i].z;

                if (y < -10) {
                    y = 12;
                    x = (Math.random() - 0.5) * 30;
                }
                posAttr.setXYZ(i, x, y, z);
            }
            posAttr.needsUpdate = true;
        }

        // 4. Smooth Camera Parallax & Scroll Translation
        // Camera pans down in 3D by 14 units as the user scrolls to 100%
        const cameraScrollY = -this.scrollPercent * 14;

        this.camera.position.x += (this.targetCameraX - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.targetCameraY + cameraScrollY - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, cameraScrollY * 0.4, 0); // pan lookAt target downward slightly for composition

        // Render
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.animate());
    }
};

// 4. UI Interactions & Trigger Hooks
const UIController = {
    init() {
        // Check user session
        this.checkUserSession();

        // Attach Web Audio API sound triggers
        const interactives = document.querySelectorAll(
            '.nav-item, .btn-start-project, .btn-explore, .feature-item, .bottom-left, .bottom-center, .btn-explore-all, .btn-project-cta, .portfolio-card, .btn-cta-banner-start, .btn-explore-services, .hotspot, .nav-dot, .stat-item'
        );
        
        interactives.forEach(el => {
            el.addEventListener('mouseenter', () => {
                AudioFX.playHover();
            });
            el.addEventListener('click', () => {
                AudioFX.playClick();
            });
        });

        // Highlight WebGL models on feature item hovers
        const featureItems = document.querySelectorAll('.feature-item');
        featureItems.forEach(item => {
            const targetName = item.getAttribute('data-target');
            
            item.addEventListener('mouseenter', () => {
                if (WebGLEngine.glowTargets.hasOwnProperty(targetName)) {
                    WebGLEngine.glowTargets[targetName] = 1.0;
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (WebGLEngine.glowTargets.hasOwnProperty(targetName)) {
                    WebGLEngine.glowTargets[targetName] = 0.0;
                }
            });
        });

        // Interactive highlighting for portfolio card hovers
        const portfolioCards = document.querySelectorAll('.portfolio-card');
        portfolioCards.forEach((card, index) => {
            // Map card indexes to models (Card 1 -> Left, Card 2 -> Center, Card 3 -> Right, etc.)
            let targetName = 'center';
            if (index % 3 === 0) targetName = 'left';
            if (index % 3 === 2) targetName = 'right';

            card.addEventListener('mouseenter', () => {
                if (WebGLEngine.glowTargets.hasOwnProperty(targetName)) {
                    WebGLEngine.glowTargets[targetName] = 0.8;
                }
            });

            card.addEventListener('mouseleave', () => {
                if (WebGLEngine.glowTargets.hasOwnProperty(targetName)) {
                    WebGLEngine.glowTargets[targetName] = 0.0;
                }
            });
        });

        // Services Hotspots & Tooltip Controller
        const tooltip = document.getElementById('services-tooltip');
        const hotspots = document.querySelectorAll('.hotspot');
        const dots = document.querySelectorAll('.nav-dot');

        hotspots.forEach(hotspot => {
            hotspot.addEventListener('mouseenter', () => {
                const title = hotspot.getAttribute('data-title');
                const desc = hotspot.getAttribute('data-desc');
                const num = hotspot.querySelector('.hotspot-dot').innerText;

                tooltip.querySelector('.tooltip-num').innerText = num;
                tooltip.querySelector('.tooltip-title').innerText = title;
                tooltip.querySelector('.tooltip-desc').innerText = desc;

                // Move tooltip relative to hotspot coordinates
                const topVal = hotspot.style.top;
                const leftVal = hotspot.style.left;
                tooltip.style.top = topVal;
                tooltip.style.left = leftVal;
                tooltip.classList.add('active');

                // Map hotspot hover back to WebGL center model glow!
                WebGLEngine.glowTargets.center = 0.7;
            });

            hotspot.addEventListener('mouseleave', () => {
                tooltip.classList.remove('active');
                WebGLEngine.glowTargets.center = 0.0;
            });

            hotspot.addEventListener('click', () => {
                // Find active dot index based on hotspot index
                const num = parseInt(hotspot.querySelector('.hotspot-dot').innerText);
                const dotIdx = (num - 1) % 3;
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === dotIdx);
                });
            });
        });

        // Services Slide dot navigation links
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                
                // Trigger a momentary highlight glow on the center WebGL model
                WebGLEngine.glowTargets.center = 1.0;
                setTimeout(() => { WebGLEngine.glowTargets.center = 0; }, 600);
            });
        });

        // Scroll to discover action
        const scrollBtn = document.getElementById('bottom-scroll');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                const workSec = document.getElementById('work');
                if (workSec) {
                    workSec.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        this.setupNavigationHighlighting();
        this.setupScrollReveal();
    },

    // Setup active state highlighting in navigation bar on scroll
    setupNavigationHighlighting() {
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px', // Trigger when section occupies core viewport
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.getAttribute('id');
                    document.querySelectorAll('.nav-item').forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('href') === `#${sectionId}`) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
    },

    // Setup scroll reveal animation triggers on section elements
    setupScrollReveal() {
        const revealOptions = {
            root: null,
            rootMargin: '0px 0px -12% 0px', // Trigger slightly before entering viewport
            threshold: 0.08
        };

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target); // Animate once
                }
            });
        }, revealOptions);

        document.querySelectorAll('.reveal').forEach(el => {
            revealObserver.observe(el);
        });
    },

    // Check for active user session and render profile badge in navbar
    checkUserSession() {
        const sessionData = localStorage.getItem('user_session');
        if (!sessionData) return;
        
        try {
            const session = JSON.parse(sessionData);
            const ctaContainer = document.querySelector('.nav-cta');
            if (!ctaContainer) return;
            
            // Build the user profile badge markup
            ctaContainer.innerHTML = `
                <div class="user-profile-badge">
                    <img src="${session.avatar || 'assets/logo.png'}" alt="Avatar" class="user-avatar">
                    <span class="user-name">${session.username}</span>
                    <button class="btn-logout" id="btn-logout" title="Log Out">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Setup logout click handler
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', (e) => {
                    e.stopPropagation();
                    localStorage.removeItem('user_session');
                    window.location.reload();
                });
            }
        } catch (err) {
            console.error('Error parsing session data:', err);
        }
    }
};

// 3. Custom Interactive Cursor Controller (Physics-based Lerp lag)
const CursorController = {
    dot: null,
    ring: null,
    
    // Exact cursor positions
    mouse: { x: -100, y: -100 },
    // Smooth trailing ring positions
    ringPos: { x: -100, y: -100 },
    
    isVisible: false,
    
    init() {
        // Disable on touch screens (only run if fine pointer matches)
        if (!window.matchMedia('(pointer: fine)').matches) return;
        
        this.dot = document.querySelector('.custom-cursor-dot');
        this.ring = document.querySelector('.custom-cursor-ring');
        if (!this.dot || !this.ring) return;
        
        // Hide elements initially
        this.dot.style.opacity = '0';
        this.ring.style.opacity = '0';
        
        // Track mouse position
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (!this.isVisible) {
                this.dot.style.opacity = '1';
                this.ring.style.opacity = '1';
                this.isVisible = true;
            }
        });
        
        // Hover listeners for interactive targets
        const addHoverEvents = () => {
            const hoverTargets = document.querySelectorAll(
                'a, button, .portfolio-card, .hotspot, .nav-dot, .scroll-indicator, .play-button-wrapper, .bottom-center, .cta-button, .btn-explore, .btn-explore-all, .btn-project-cta, .btn-cta-banner-start, .btn-explore-services'
            );
            
            hoverTargets.forEach(target => {
                target.addEventListener('mouseenter', () => {
                    document.body.classList.add('cursor-hovering');
                });
                
                target.addEventListener('mouseleave', () => {
                    document.body.classList.remove('cursor-hovering');
                });
            });
        };
        
        addHoverEvents();
        
        // Click feedback states
        window.addEventListener('mousedown', () => {
            document.body.classList.add('cursor-clicking');
        });
        
        window.addEventListener('mouseup', () => {
            document.body.classList.remove('cursor-clicking');
        });
        
        // Hide cursor when leaving browser viewport
        document.addEventListener('mouseleave', () => {
            this.dot.style.opacity = '0';
            this.ring.style.opacity = '0';
            this.isVisible = false;
        });
        
        // Start animation loop
        this.tick();
    },
    
    tick() {
        // Smooth interpolation formula
        const easeFactor = 0.15;
        this.ringPos.x += (this.mouse.x - this.ringPos.x) * easeFactor;
        this.ringPos.y += (this.mouse.y - this.ringPos.y) * easeFactor;
        
        // Render positions using translate3d
        if (this.isVisible) {
            this.dot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0) translate3d(-50%, -50%, 0)`;
            this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0) translate3d(-50%, -50%, 0)`;
        }
        
        requestAnimationFrame(() => this.tick());
    }
};

// 4. Interactive Next-Level Physics Gravity Field Canvas (Spring Elasticity, Vortex Swirl & Wind Shear Trails)
const GravityField = {
    canvas: null,
    ctx: null,
    points: [],
    sparks: [],
    spacing: 50, // grid spacing in pixels
    mouse: { 
        x: -1000, 
        y: -1000, 
        lastX: -1000, 
        lastY: -1000, 
        vx: 0, 
        vy: 0, 
        speed: 0,
        active: false 
    },
    
    init() {
        this.canvas = document.getElementById('gravity-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            if (this.mouse.lastX === -1000) {
                this.mouse.lastX = e.clientX;
                this.mouse.lastY = e.clientY;
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;
        });
        
        document.addEventListener('mouseleave', () => {
            this.mouse.active = false;
            this.mouse.vx = 0;
            this.mouse.vy = 0;
            this.mouse.speed = 0;
        });
        
        this.tick();
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.points = [];
        const cols = Math.ceil(this.canvas.width / this.spacing) + 1;
        const rows = Math.ceil(this.canvas.height / this.spacing) + 1;
        
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                this.points.push({
                    homeX: c * this.spacing,
                    homeY: r * this.spacing,
                    x: c * this.spacing,
                    y: r * this.spacing,
                    vx: 0,
                    vy: 0,
                    angle: 0,
                    currentAngle: 0,
                    scale: 1,
                    brightness: 0
                });
            }
        }
    },
    
    tick() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const mX = this.mouse.x;
        const mY = this.mouse.y;
        const active = this.mouse.active;
        
        // 1. Calculate mouse velocity in this frame
        if (active && this.mouse.lastX !== -1000) {
            this.mouse.vx = this.mouse.x - this.mouse.lastX;
            this.mouse.vy = this.mouse.y - this.mouse.lastY;
            this.mouse.speed = Math.sqrt(this.mouse.vx * this.mouse.vx + this.mouse.vy * this.mouse.vy);
        } else {
            this.mouse.vx *= 0.9;
            this.mouse.vy *= 0.9;
            this.mouse.speed *= 0.9;
        }
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        
        // 2. Emit temporary orange embers when moving fast
        if (active && this.mouse.speed > 4) {
            const numSparks = Math.min(Math.floor(this.mouse.speed / 3), 4);
            for (let s = 0; s < numSparks; s++) {
                this.sparks.push({
                    x: mX + (Math.random() - 0.5) * 12,
                    y: mY + (Math.random() - 0.5) * 12,
                    vx: this.mouse.vx * 0.25 + (Math.random() - 0.5) * 2.5,
                    vy: this.mouse.vy * 0.25 + (Math.random() - 0.5) * 2.5,
                    size: 1.5 + Math.random() * 2.2,
                    alpha: 0.75 + Math.random() * 0.25,
                    life: 1.0,
                    decay: 0.015 + Math.random() * 0.015
                });
            }
        }
        
        // 3. Draw sparks trail
        for (let s = this.sparks.length - 1; s >= 0; s--) {
            const sp = this.sparks[s];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.vx *= 0.97;
            sp.vy *= 0.97;
            sp.life -= sp.decay;
            
            if (sp.life <= 0) {
                this.sparks.splice(s, 1);
                continue;
            }
            
            this.ctx.save();
            this.ctx.fillStyle = `rgba(245, 154, 35, ${sp.alpha * sp.life})`;
            this.ctx.shadowBlur = 6 * sp.life;
            this.ctx.shadowColor = 'rgba(255, 193, 90, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 4. Update and draw grid elements
        const springK = 0.06;  // Stiffness constant
        const damping = 0.82;   // Rubbery deceleration friction
        const repulsionRadius = 220; // Trigger distance for grid warp force
        
        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i];
            
            // Calculate vector to cursor
            const dxToMouse = pt.x - mX;
            const dyToMouse = pt.y - mY;
            const distToMouse = Math.sqrt(dxToMouse * dxToMouse + dyToMouse * dyToMouse);
            
            // A. Physical repulsion force calculation (spring grid warp)
            let forceX = 0;
            let forceY = 0;
            
            if (active && distToMouse < repulsionRadius) {
                const strength = (1 - distToMouse / repulsionRadius) * 22; // Repulsive amplitude
                const angle = Math.atan2(dyToMouse, dxToMouse);
                forceX = Math.cos(angle) * strength;
                forceY = Math.sin(angle) * strength;
            }
            
            // Apply spring mechanics (acceleration = force + spring_restoration)
            const ax = (pt.homeX - pt.x) * springK + forceX;
            const ay = (pt.homeY - pt.y) * springK + forceY;
            
            pt.vx = (pt.vx + ax) * damping;
            pt.vy = (pt.vy + ay) * damping;
            
            pt.x += pt.vx;
            pt.y += pt.vy;
            
            // B. Vortex Swirl calculations
            const targetX = active ? mX : this.canvas.width / 2;
            const targetY = active ? mY : this.canvas.height / 2;
            const dx = targetX - pt.x;
            const dy = targetY - pt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const angleToCursor = Math.atan2(dy, dx);
            let swirl = 0;
            const swirlRadius = 250;
            
            if (active && dist < swirlRadius) {
                // Swirl direction factor (blends from linear targeting to 90deg offset)
                swirl = (1 - dist / swirlRadius) * (Math.PI / 2.2);
            }
            
            pt.angle = angleToCursor + swirl;
            
            // Smoothly ease angle rotation (with wrapping fallback)
            let angleDiff = pt.angle - pt.currentAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            pt.currentAngle += angleDiff * 0.15;
            
            // C. Proximity brightness and velocity stretching
            const glowRadius = 220;
            let targetBrightness = 0;
            let targetScale = 1;
            
            if (active && dist < glowRadius) {
                const proximityFactor = 1 - (dist / glowRadius);
                targetBrightness = proximityFactor;
                
                // Add speed stretch offset based on cursor velocity
                const speedStretch = Math.min(this.mouse.speed * 0.07, 1.6);
                targetScale = 1 + proximityFactor * 0.45 + speedStretch * proximityFactor;
            }
            
            pt.brightness += (targetBrightness - pt.brightness) * 0.15;
            pt.scale += (targetScale - pt.scale) * 0.15;
            
            // D. Render elements
            this.ctx.save();
            this.ctx.translate(pt.x, pt.y);
            this.ctx.rotate(pt.currentAngle);
            
            const alpha = 0.04 + pt.brightness * 0.45;
            const length = 10 * pt.scale;
            const thickness = 1.2 * pt.scale;
            
            if (pt.brightness > 0.05) {
                this.ctx.strokeStyle = `rgba(245, 154, 35, ${alpha})`;
                this.ctx.shadowBlur = pt.brightness * 8;
                this.ctx.shadowColor = 'rgba(255, 193, 90, 0.45)';
            } else {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.lineWidth = thickness;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(-length / 2, 0);
            this.ctx.lineTo(length / 2, 0);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        requestAnimationFrame(() => this.tick());
    }
};

// Initialize everything on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    WebGLEngine.init();
    UIController.init();
    CursorController.init();
    GravityField.init();
    
    // Auto-initialize Audio Context and trigger playWelcome on first click if loaded but blocked
    document.addEventListener('click', () => {
        AudioFX.init();
        if (WebGLEngine.loadingScreenEnded && !WebGLEngine.welcomeSoundPlayed) {
            AudioFX.playWelcome();
            WebGLEngine.welcomeSoundPlayed = true;
        }
    }, { once: true });
});
