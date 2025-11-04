const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const database = require('./database');

const router = express.Router();

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.sendStatus(403); // if token is no longer valid
        req.user = payload.user;
        next();
    });
};

// Generate a new 2FA secret for the logged-in user
router.post('/generate-2fa', authenticateToken, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ length: 20, name: `SpreeLeads (${req.user.email})`, issuer: 'SpreeLeads' });

        await new Promise((resolve, reject) => {
            // Store the secret in the database for the user
            database.db.run('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret.base32, req.user.id], function(err) {
                if (err) return reject(err);
                resolve();
            });
        });

        // Generate a QR code for the user to scan
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                console.error('QR Code generation error:', err);
                return res.status(500).json({ error: 'Could not generate QR code' });
            }
            res.json({ qrCodeUrl: data_url, secret: secret.base32 });
        });

    } catch (error) {
        console.error('2FA generation error:', error);
        res.status(500).json({ error: 'Server error during 2FA setup' });
    }
});

// Simplified User Registration (2FA disabled for local dev)
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const userExists = await new Promise((resolve, reject) => {
            database.db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        if (userExists) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userId = await new Promise((resolve, reject) => {
            database.db.run('INSERT INTO users (email, password, two_factor_enabled) VALUES (?, ?, 0)', [email, hashedPassword], function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });

        // Directly log the user in by issuing a token
        const payload = { user: { id: userId, email: email, tier: 'free' } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Verify 2FA and enable it for the user
router.post('/verify-2fa', authenticateToken, async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;

    try {
        const user = await new Promise((resolve, reject) => {
            database.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token,
        });

        if (verified) {
            await new Promise((resolve, reject) => {
                database.db.run('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [userId], function(err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
            res.json({ message: '2FA enabled successfully!' });
        } else {
            res.status(400).json({ error: 'Invalid 2FA token' });
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: 'Server error during 2FA verification' });
    }
});

// User Login
router.post('/login', (req, res) => {
    const { email, password, twoFactorToken } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    database.db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Server error during login' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If 2FA is enabled, verify the token
        if (user.two_factor_enabled) {
            if (!twoFactorToken) {
                return res.status(401).json({ error: '2FA token is required', twoFactorRequired: true });
            }

            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: twoFactorToken,
                window: 1 // Allow for a 30-second clock drift
            });

            if (!verified) {
                return res.status(401).json({ error: 'Invalid 2FA token', twoFactorRequired: true });
            }
        }

        // Create and sign JWT
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                tier: user.subscription_tier
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    });
});


module.exports = { authRouter: router, authenticateToken };
