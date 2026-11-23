const User = require('../models/User');
const { hashToken } = require('../utils/password');

async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authorization.slice(7).trim();
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    if (User.db.readyState !== 1) {
        return res.status(503).json({ error: 'Authentication database is unavailable' });
    }

    try {
        const tokenHash = hashToken(token);
        const user = await User.findOne({
            tokenHash,
            tokenExpiresAt: { $gt: new Date() }
        }).select('_id name email');

        if (!user) return res.status(401).json({ error: 'Invalid or expired session' });
        req.user = user;
        return next();
    } catch (error) {
        console.error('Authentication failed:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}

module.exports = requireAuth;