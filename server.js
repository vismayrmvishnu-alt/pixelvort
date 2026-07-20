const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'database.json');

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

// API Routes
// 1. User Registration
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const users = readUsers();

    // Check if email already registered
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash the password securely
    const { salt, hash } = hashPassword(password);

    // Save user record
    const newUser = {
        id: crypto.randomBytes(8).toString('hex'),
        username,
        email: email.toLowerCase(),
        salt,
        hash,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    return res.status(201).json({ 
        success: true, 
        message: 'Account successfully created!', 
        user: { id: newUser.id, username: newUser.username, email: newUser.email } 
    });
});

// 2. User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify hashed password match
    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token: crypto.randomBytes(16).toString('hex'), // Mock JWT session token
        user: { id: user.id, username: user.username, email: user.email }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`PV Studios Auth Server running at http://localhost:${PORT}`);
});
