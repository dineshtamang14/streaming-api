const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, unique: true, index: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, default: null, min: 0 },
    posterUrl: { type: String, default: null },
    watchUrl: { type: String, required: true },
    downloadUrl: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    uploadedAt: { type: Date, default: Date.now, index: true }
}, {
    collection: 'movies',
    timestamps: true
});

movieSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
