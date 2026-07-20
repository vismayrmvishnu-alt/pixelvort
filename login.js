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
    // Current state variables
    email: '',
    
    // DOM elements
    panelCredentials: null,
    panelOtp: null,
    panelDetails: null,
    
    formLogin: null,
    formOtp: null,
    formDetails: null,
    
    alertBox: null,
    
    inputEmail: null,
    inputPassword: null,
    otpBoxes: [],
    
    inputPhone: null,
    inputCompany: null,
    inputInterest: null,
    inputBrief: null,
    
    btnLoginSubmit: null,
    btnOtpSubmit: null,
    btnDetailsSubmit: null,
    
    init() {
        this.panelCredentials = document.getElementById('panel-credentials');
        this.panelOtp = document.getElementById('panel-otp');
        this.panelDetails = document.getElementById('panel-details');
        
        this.formLogin = document.getElementById('form-login');
        this.formOtp = document.getElementById('form-otp');
        this.formDetails = document.getElementById('form-details');
        
        this.alertBox = document.getElementById('auth-alert');
        
        this.inputEmail = document.getElementById('auth-email');
        this.inputPassword = document.getElementById('auth-password');
        this.otpBoxes = Array.from(document.querySelectorAll('.otp-box'));
        
        this.inputPhone = document.getElementById('details-phone');
        this.inputCompany = document.getElementById('details-company');
        this.inputInterest = document.getElementById('details-interest');
        this.inputBrief = document.getElementById('details-brief');
        
        this.btnLoginSubmit = document.getElementById('btn-login-submit');
        this.btnOtpSubmit = document.getElementById('btn-otp-submit');
        this.btnDetailsSubmit = document.getElementById('btn-details-submit');
        
        if (!this.formLogin) return;
        
        // Form Submit Listeners
        this.formLogin.addEventListener('submit', (e) => this.handleLogin(e));
        this.formOtp.addEventListener('submit', (e) => this.handleVerifyOtp(e));
        this.formDetails.addEventListener('submit', (e) => this.handleSaveDetails(e));
        
        // OTP Inputs Focus Shift Listeners
        this.setupOtpInputBehavior();
    },
    
    showPanel(activePanel) {
        // Hide all
        this.panelCredentials.classList.add('hidden');
        this.panelOtp.classList.add('hidden');
        this.panelDetails.classList.add('hidden');
        
        // Show target
        activePanel.classList.remove('hidden');
        
        // Focus first field
        if (activePanel === this.panelOtp && this.otpBoxes[0]) {
            setTimeout(() => this.otpBoxes[0].focus(), 100);
        } else if (activePanel === this.panelDetails && this.inputPhone) {
            setTimeout(() => this.inputPhone.focus(), 100);
        }
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
    
    setupOtpInputBehavior() {
        this.otpBoxes.forEach((box, index) => {
            // Typing key auto shift
            box.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length > 0) {
                    // Force only single numeric characters
                    e.target.value = value.replace(/[^0-9]/g, '').slice(-1);
                    
                    // Focus next box
                    if (index < this.otpBoxes.length - 1 && e.target.value) {
                        this.otpBoxes[index + 1].focus();
                    }
                }
            });
            
            // Backspace delete shift
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && index > 0) {
                    this.otpBoxes[index - 1].focus();
                }
            });
            
            // Clipboard Paste support
            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = (e.clipboardData || window.clipboardData).getData('text');
                const cleanDigits = pasteData.replace(/[^0-9]/g, '').slice(0, 6);
                
                cleanDigits.split('').forEach((char, i) => {
                    if (this.otpBoxes[i]) {
                        this.otpBoxes[i].value = char;
                    }
                });
                
                // Focus final populated digit or last field
                const focusIdx = Math.min(cleanDigits.length, this.otpBoxes.length - 1);
                if (this.otpBoxes[focusIdx]) {
                    this.otpBoxes[focusIdx].focus();
                }
            });
        });
    },
    
    // Step 1: Submit Credentials & dispatch code
    async handleLogin(e) {
        e.preventDefault();
        
        const emailVal = this.inputEmail.value.trim();
        const passwordVal = this.inputPassword.value;
        
        this.showAlert('info', 'Verifying security credentials...');
        this.btnLoginSubmit.setAttribute('disabled', 'true');
        
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailVal, password: passwordVal })
            });
            
            const data = await response.json();
            this.btnLoginSubmit.removeAttribute('disabled');
            
            if (data.success && data.otpSent) {
                this.email = emailVal; // Cache email
                this.showAlert('success', 'Access code dispatched to customer logs!');
                
                // Switch panel with animation delay
                setTimeout(() => {
                    this.showAlert('', '');
                    this.showPanel(this.panelOtp);
                }, 1000);
            } else {
                this.showAlert('error', data.message || 'Verification rejected.');
            }
        } catch (err) {
            console.error(err);
            this.btnLoginSubmit.removeAttribute('disabled');
            this.showAlert('error', 'Auth server connection offline. Please run "node server.js".');
        }
    },
    
    // Step 2: Validate OTP Code
    async handleVerifyOtp(e) {
        e.preventDefault();
        
        const otpCode = this.otpBoxes.map(box => box.value.trim()).join('');
        
        if (otpCode.length < 6) {
            this.showAlert('error', 'Please fill in the entire 6-digit code.');
            return;
        }
        
        this.showAlert('info', 'Evaluating authorization signature...');
        this.btnOtpSubmit.setAttribute('disabled', 'true');
        
        try {
            const response = await fetch('http://localhost:5000/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.email, otpCode })
            });
            
            const data = await response.json();
            this.btnOtpSubmit.removeAttribute('disabled');
            
            if (data.success) {
                if (data.requireDetails) {
                    this.showAlert('success', 'OTP signature verified! Customer onboarding required.');
                    
                    setTimeout(() => {
                        this.showAlert('', '');
                        this.showPanel(this.panelDetails);
                    }, 1200);
                } else {
                    this.showAlert('success', 'Validation complete. Access granted!');
                    localStorage.setItem('user_session', JSON.stringify(data.user));
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            } else {
                this.showAlert('error', data.message || 'Invalid code.');
            }
        } catch (err) {
            console.error(err);
            this.btnOtpSubmit.removeAttribute('disabled');
            this.showAlert('error', 'Server error. Could not verify code.');
        }
    },
    
    // Step 3: Register profile information
    async handleSaveDetails(e) {
        e.preventDefault();
        
        const phone = this.inputPhone.value.trim();
        const company = this.inputCompany.value.trim();
        const interest = this.inputInterest.value;
        const brief = this.inputBrief.value.trim();
        
        this.showAlert('info', 'Recording customer profile details...');
        this.btnDetailsSubmit.setAttribute('disabled', 'true');
        
        try {
            const response = await fetch('http://localhost:5000/api/save-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.email,
                    phone,
                    company,
                    interest,
                    brief
                })
            });
            
            const data = await response.json();
            this.btnDetailsSubmit.removeAttribute('disabled');
            
            if (data.success) {
                this.showAlert('success', 'Profile registered. Welcome to PV Studios!');
                localStorage.setItem('user_session', JSON.stringify(data.user));
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            } else {
                this.showAlert('error', data.message || 'Submission rejected.');
            }
        } catch (err) {
            console.error(err);
            this.btnDetailsSubmit.removeAttribute('disabled');
            this.showAlert('error', 'Server connection failure.');
        }
    }
};

// Start elements on load
document.addEventListener('DOMContentLoaded', () => {
    CursorController.init();
    GravityField.init();
    AuthController.init();
});
