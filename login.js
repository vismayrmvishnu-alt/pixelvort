// 1. Custom Interactive Cursor Controller (Physics-based Lerp lag)
const CursorController = {
    dot: null,
    ring: null,
    mouse: { x: -100, y: -100 },
    ringPos: { x: -100, y: -100 },
    isVisible: false,
    
    init() {
        if (!window.matchMedia('(pointer: fine)').matches) return;
        
        this.dot = document.querySelector('.custom-cursor-dot');
        this.ring = document.querySelector('.custom-cursor-ring');
        if (!this.dot || !this.ring) return;
        
        this.dot.style.opacity = '0';
        this.ring.style.opacity = '0';
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (!this.isVisible) {
                this.dot.style.opacity = '1';
                this.ring.style.opacity = '1';
                this.isVisible = true;
            }
        });
        
        const addHoverEvents = () => {
            const hoverTargets = document.querySelectorAll(
                'a, button, input, .login-tab, .checkbox-container'
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
        
        window.addEventListener('mousedown', () => {
            document.body.classList.add('cursor-clicking');
        });
        
        window.addEventListener('mouseup', () => {
            document.body.classList.remove('cursor-clicking');
        });
        
        document.addEventListener('mouseleave', () => {
            this.dot.style.opacity = '0';
            this.ring.style.opacity = '0';
            this.isVisible = false;
        });
        
        this.tick();
    },
    
    tick() {
        const easeFactor = 0.15;
        this.ringPos.x += (this.mouse.x - this.ringPos.x) * easeFactor;
        this.ringPos.y += (this.mouse.y - this.ringPos.y) * easeFactor;
        
        if (this.isVisible) {
            this.dot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0) translate3d(-50%, -50%, 0)`;
            this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0) translate3d(-50%, -50%, 0)`;
        }
        
        requestAnimationFrame(() => this.tick());
    }
};

// 2. Interactive Next-Level Physics Gravity Field Canvas (Spring Elasticity, Vortex Swirl & Wind Shear Trails)
const GravityField = {
    canvas: null,
    ctx: null,
    points: [],
    sparks: [],
    spacing: 50,
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
        
        // Embers
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
        
        // Draw sparks
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
        
        const springK = 0.06;
        const damping = 0.82;
        const repulsionRadius = 220;
        
        for (let i = 0; i < this.points.length; i++) {
            const pt = this.points[i];
            
            const dxToMouse = pt.x - mX;
            const dyToMouse = pt.y - mY;
            const distToMouse = Math.sqrt(dxToMouse * dxToMouse + dyToMouse * dyToMouse);
            
            let forceX = 0;
            let forceY = 0;
            
            if (active && distToMouse < repulsionRadius) {
                const strength = (1 - distToMouse / repulsionRadius) * 22;
                const angle = Math.atan2(dyToMouse, dxToMouse);
                forceX = Math.cos(angle) * strength;
                forceY = Math.sin(angle) * strength;
            }
            
            const ax = (pt.homeX - pt.x) * springK + forceX;
            const ay = (pt.homeY - pt.y) * springK + forceY;
            
            pt.vx = (pt.vx + ax) * damping;
            pt.vy = (pt.vy + ay) * damping;
            
            pt.x += pt.vx;
            pt.y += pt.vy;
            
            const targetX = active ? mX : this.canvas.width / 2;
            const targetY = active ? mY : this.canvas.height / 2;
            const dx = targetX - pt.x;
            const dy = targetY - pt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const angleToCursor = Math.atan2(dy, dx);
            let swirl = 0;
            const swirlRadius = 250;
            
            if (active && dist < swirlRadius) {
                swirl = (1 - dist / swirlRadius) * (Math.PI / 2.2);
            }
            
            pt.angle = angleToCursor + swirl;
            
            let angleDiff = pt.angle - pt.currentAngle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            pt.currentAngle += angleDiff * 0.15;
            
            const glowRadius = 220;
            let targetBrightness = 0;
            let targetScale = 1;
            
            if (active && dist < glowRadius) {
                const proximityFactor = 1 - (dist / glowRadius);
                targetBrightness = proximityFactor;
                const speedStretch = Math.min(this.mouse.speed * 0.07, 1.6);
                targetScale = 1 + proximityFactor * 0.45 + speedStretch * proximityFactor;
            }
            
            pt.brightness += (targetBrightness - pt.brightness) * 0.15;
            pt.scale += (targetScale - pt.scale) * 0.15;
            
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

// 3. Authentication Forms Controller
const AuthController = {
    mode: 'signin', // 'signin' or 'signup'
    form: null,
    alertBox: null,
    btnSubmit: null,
    tabSignIn: null,
    tabSignUp: null,
    groupUsername: null,
    inputUsername: null,
    inputEmail: null,
    inputPassword: null,
    
    init() {
        this.form = document.getElementById('form-auth');
        this.alertBox = document.getElementById('auth-alert');
        this.btnSubmit = document.getElementById('btn-submit');
        this.tabSignIn = document.getElementById('tab-signin');
        this.tabSignUp = document.getElementById('tab-signup');
        this.groupUsername = document.getElementById('group-username');
        this.inputUsername = document.getElementById('auth-username');
        this.inputEmail = document.getElementById('auth-email');
        this.inputPassword = document.getElementById('auth-password');
        
        if (!this.form) return;
        
        // Tab click listeners
        this.tabSignIn.addEventListener('click', () => this.switchMode('signin'));
        this.tabSignUp.addEventListener('click', () => this.switchMode('signup'));
        
        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },
    
    switchMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        
        // Toggle tab highlights
        this.tabSignIn.classList.toggle('active', mode === 'signin');
        this.tabSignUp.classList.toggle('active', mode === 'signup');
        
        // Toggle username inputs
        if (mode === 'signup') {
            this.groupUsername.classList.remove('hidden');
            this.inputUsername.setAttribute('required', 'true');
            this.inputUsername.removeAttribute('disabled');
            this.btnSubmit.querySelector('span').innerText = 'CREATE ACCOUNT';
        } else {
            this.groupUsername.classList.add('hidden');
            this.inputUsername.removeAttribute('required');
            this.inputUsername.setAttribute('disabled', 'true');
            this.btnSubmit.querySelector('span').innerText = 'ENTER PORTAL';
        }
        
        // Clear alerts
        this.showAlert('', '');
    },
    
    showAlert(type, message) {
        this.alertBox.className = 'auth-alert';
        if (type) {
            this.alertBox.classList.add(type);
            this.alertBox.innerText = message;
            this.alertBox.classList.add('visible');
        } else {
            this.alertBox.innerText = '';
        }
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const email = this.inputEmail.value.trim();
        const password = this.inputPassword.value;
        const username = this.inputUsername.value.trim();
        
        this.showAlert('info', 'Authenticating with security protocol...');
        this.btnSubmit.setAttribute('disabled', 'true');
        
        const endpoint = this.mode === 'signin' ? '/api/login' : '/api/register';
        const payload = this.mode === 'signin' 
            ? { email, password } 
            : { username, email, password };
            
        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            this.btnSubmit.removeAttribute('disabled');
            
            if (data.success) {
                if (this.mode === 'signup') {
                    this.showAlert('success', 'Account created! Redirecting to login tab...');
                    setTimeout(() => {
                        this.switchMode('signin');
                        this.inputEmail.value = email;
                        this.inputPassword.value = '';
                    }, 1500);
                } else {
                    this.showAlert('success', 'Access granted. Welcome to PV Studios!');
                    localStorage.setItem('user_session', JSON.stringify(data.user));
                    
                    // Redirect back home on success
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1200);
                }
            } else {
                this.showAlert('error', data.message || 'Authentication failed.');
            }
        } catch (err) {
            console.error(err);
            this.btnSubmit.removeAttribute('disabled');
            this.showAlert('error', 'Auth server connection offline. Please run "node server.js".');
        }
    }
};

// Start elements on load
document.addEventListener('DOMContentLoaded', () => {
    CursorController.init();
    GravityField.init();
    AuthController.init();
});
