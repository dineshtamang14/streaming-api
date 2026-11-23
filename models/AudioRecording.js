const mongoose = require('mongoose');

const audioRecordingSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true, unique: true },
    filename: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, default: null, min: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
    url: { type: String, required: true }
}, {
    collection: 'audio_recordings',
    timestamps: true
});

module.exports = mongoose.models.AudioRecording ||
    mongoose.model('AudioRecording', audioRecordingSchema);
