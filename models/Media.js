const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, unique: true, index: true },
    category: {
        type: String,
        enum: ['audio', 'video', 'image', 'document'],
        required: true,
        index: true
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, default: null, min: 0 },
    isRecording: { type: Boolean, default: false, index: true },
    url: { type: String, required: true },
    downloadUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now, index: true }
}, {
    collection: 'media',
    timestamps: true
});

mediaSchema.index({ title: 'text', originalName: 'text' });

module.exports = mongoose.models.Media || mongoose.model('Media', mediaSchema);
