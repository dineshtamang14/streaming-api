const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    tokenHash: { type: String, default: null, select: false },
    tokenExpiresAt: { type: Date, default: null, select: false },
    createdAt: { type: Date, default: Date.now }
}, {
    collection: 'users',
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
