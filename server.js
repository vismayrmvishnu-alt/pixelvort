const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'database.json');
const PREVIEW_FILE = path.join(__dirname, 'otp_preview.txt');

// Temporary in-memory cache for pending registrations awaiting email verification
const pendingRegistrations = {};

// Middleware
app.use(cors());
app.use(express.json());

// Initialize JSON database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 4));
}

// Helper: Read database users
function readUsers() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database file:', err);
        return [];
    }
}

// Helper: Write users to database
function writeUsers(users) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 4), 'utf8');
    } catch (err) {
        console.error('Error writing to database file:', err);
    }
}

// Helper: Hash password securely using PBKDF2
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

// Helper: Verify password match
function verifyPassword(password, salt, storedHash) {
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === storedHash;
}

// Helper: Send OTP via Nodemailer with local fallback
async function sendOTPEmail(email, username, otpCode) {
    const hasSmtpConfig = process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD;
    
    if (hasSmtpConfig) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD
                }
            });
            
            const mailOptions = {
                from: `"PV Studios" <${process.env.SMTP_EMAIL}>`,
                to: email,
                subject: 'Your PV Portal Access Code',
                text: `Your one-time authorization code is: ${otpCode}. This code is valid for 5 minutes.`,
                html: `
                    <div style="background:#0a0a0a; color:#ffffff; padding:40px; font-family:'Outfit', sans-serif; text-align:center; border:1px solid #f59a23; border-radius:12px; max-width:480px; margin:0 auto;">
                        <h2 style="color:#f59a23; margin-bottom:10px; font-size:24px; letter-spacing:0.05em;">PV PORTAL ACCESS</h2>
                        <p style="color:#cccccc; font-size:14px;">An access attempt was made to your PV Studios account.</p>
                        <p style="color:#aaaaaa; font-size:13px; margin:20px 0 10px 0;">Use the following authorization code to complete your verification:</p>
                        <div style="font-size:36px; font-weight:bold; letter-spacing:10px; color:#ffffff; margin:15px 0; background:#141414; padding:15px; border-radius:6px; display:inline-block; border:1px dashed rgba(245,154,35,0.4); text-indent:10px;">${otpCode}</div>
                        <p style="color:#777777; font-size:11px; margin-top:25px;">This code is valid for 5 minutes. If you did not request this login, please secure your credentials immediately.</p>
                    </div>
                `
            };
            
            await transporter.sendMail(mailOptions);
            console.log(`[SMTP] OTP sent successfully to ${email}`);
            return;
        } catch (err) {
            console.error('[SMTP] Failed to send email, falling back to local storage:', err);
        }
    }
    
    // Local fallback for offline sandboxed development
    const previewContent = `[OTP PREVIEW] Sent to: ${email} (${username}) | Code: ${otpCode} | Sent At: ${new Date().toLocaleString()}\n`;
    fs.writeFileSync(PREVIEW_FILE, previewContent, 'utf8');
    console.log('\n========================================');
    console.log(`[OFFLINE FALLBACK] ${previewContent.trim()}`);
    console.log(`Write details saved to: otp_preview.txt`);
    console.log('========================================\n');
}

// API Routes

// 1. User Registration Request (Step 1: Staging credentials and sending email verification OTP)
app.post('/api/register-request', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const users = readUsers();
    
    // Check if email already registered in active database
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Generate credentials and code
    const { salt, hash } = hashPassword(password);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache the pending registration details in-memory
    pendingRegistrations[email.toLowerCase()] = {
        username,
        salt,
        hash,
        otp: otpCode,
        otpExpires: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    // Send code
    await sendOTPEmail(email, username, otpCode);

    return res.status(200).json({
        success: true,
        otpSent: true,
        message: 'A verification code was dispatched to your email.'
    });
});

// 2. User Registration Verification (Step 2: Check OTP and commit account to active database)
app.post('/api/verify-registration-otp', (req, res) => {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
        return res.status(400).json({ success: false, message: 'Please enter the verification code.' });
    }

    const pending = pendingRegistrations[email.toLowerCase()];
    if (!pending) {
        return res.status(400).json({ success: false, message: 'No pending registration found for this email.' });
    }

    // Check expiration
    if (Date.now() > pending.otpExpires) {
        delete pendingRegistrations[email.toLowerCase()];
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please sign up again.' });
    }

    // Compare code
    if (pending.otp !== otpCode) {
        return res.status(401).json({ success: false, message: 'Invalid verification code.' });
    }

    // OTP Correct! Create active user record
    const users = readUsers();
    const newUser = {
        id: crypto.randomBytes(8).toString('hex'),
        username: pending.username,
        email: email.toLowerCase(),
        salt: pending.salt,
        hash: pending.hash,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    // Clean up temporary cache
    delete pendingRegistrations[email.toLowerCase()];

    return res.status(201).json({
        success: true,
        requireDetails: true,
        message: 'Email successfully verified! Profile setup required.'
    });
});

// 3. User Login (Step 1: Credentials Check and OTP Dispatch)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify hashed password
    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate 6-digit verification code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to database with 5-minute expiry
    user.otp = otpCode;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    writeUsers(users);

    // Send code
    await sendOTPEmail(user.email, user.username, otpCode);

    return res.status(200).json({
        success: true,
        otpSent: true,
        message: 'A security authorization code was sent to your email.'
    });
});

// 4. User Login Verification (Step 2: Check Login OTP and complete session)
app.post('/api/verify-otp', (req, res) => {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
        return res.status(400).json({ success: false, message: 'Please enter the verification code.' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || !user.otp || !user.otpExpires) {
        return res.status(400).json({ success: false, message: 'No pending validation session found.' });
    }

    // Check expiration
    if (Date.now() > user.otpExpires) {
        return res.status(400).json({ success: false, message: 'Verification code has expired.' });
    }

    // Compare code
    if (user.otp !== otpCode) {
        return res.status(401).json({ success: false, message: 'Invalid verification code.' });
    }

    // OTP Verified! Clear code
    user.otp = null;
    user.otpExpires = null;
    writeUsers(users);

    // Check if customer profile details are missing
    const requireDetails = !user.name || !user.address || !user.phone;

    if (requireDetails) {
        return res.status(200).json({
            success: true,
            requireDetails: true,
            message: 'OTP verified. Please complete your customer profile details.'
        });
    }

    // Already complete: complete sign-in session
    const token = crypto.randomBytes(16).toString('hex');
    return res.status(200).json({
        success: true,
        requireDetails: false,
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            address: user.address,
            phone: user.phone
        }
    });
});

// 5. User Login (Step 3: Save Customer Profile Details - Name, Address, Contact Number)
app.post('/api/save-details', (req, res) => {
    const { email, name, address, phone } = req.body;

    if (!email || !name || !address || !phone) {
        return res.status(400).json({ success: false, message: 'Please fill in all profile fields.' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    // Save profile details (Name, Address, Phone)
    user.name = name;
    user.address = address;
    user.phone = phone;
    writeUsers(users);

    // Complete session login
    const token = crypto.randomBytes(16).toString('hex');
    return res.status(200).json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            address: user.address,
            phone: user.phone
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`PV Studios Auth Server running at http://localhost:${PORT}`);
});
