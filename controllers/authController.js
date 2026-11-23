const User = require('../models/User');
const {
    createPasswordHash,
    verifyPassword,
    createToken,
    hashToken
} = require('../utils/password');

async function signup(req, res) {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'A valid email is required' });
    }
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (User.db.readyState !== 1) {
        return res.status(503).json({ error: 'Authentication database is unavailable' });
    }

    try {
        if (await User.findOne({ email })) {
            return res.status(409).json({ error: 'An account with that email already exists' });
        }

        const passwordData = createPasswordHash(password);
        const token = createToken();
        const user = await User.create({
            name,
            email,
            passwordHash: passwordData.hash,
            passwordSalt: passwordData.salt,
            tokenHash: hashToken(token),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Signup failed:', error);
        return res.status(500).json({ error: 'Unable to create account' });
    }
}

async function signin(req, res) {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (User.db.readyState !== 1) {
        return res.status(503).json({ error: 'Authentication database is unavailable' });
    }

    try {
        const user = await User.findOne({ email }).select('+passwordHash +passwordSalt');
        if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = createToken();
        user.tokenHash = hashToken(token);
        user.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        return res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Signin failed:', error);
        return res.status(500).json({ error: 'Unable to sign in' });
    }
}

module.exports = { signup, signin };
