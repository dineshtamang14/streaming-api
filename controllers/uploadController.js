const Media = require('../models/Media');
const AudioRecording = require('../models/AudioRecording');
const Movie = require('../models/Movie');

async function persistMedia(req, files, category, isRecording = false) {
    if (Media.db.readyState !== 1) {
        return files.map((file) => ({
            title: file.originalname.replace(/\.[^.]+$/, '') || file.filename,
            originalName: file.originalname,
            filename: file.filename,
            category,
            mimeType: file.mimetype,
            size: file.size,
            isRecording,
            url: category === 'audio'
                ? `/audio/file/${encodeURIComponent(file.filename)}`
                : category === 'image'
                    ? `/images/${encodeURIComponent(file.filename)}`
                    : `/documents/${encodeURIComponent(file.filename)}`
        }));
    }

    return Promise.all(files.map(async (file) => {
        const title = file.originalname.replace(/\.[^.]+$/, '') || file.filename;
        const url = category === 'audio'
            ? `/stream/${encodeURIComponent(file.filename)}`
            : category === 'image'
                ? `/images/${encodeURIComponent(file.filename)}`
                : `/documents/${encodeURIComponent(file.filename)}`;

        const media = await Media.findOneAndUpdate(
            { filename: file.filename },
            {
                title,
                originalName: file.originalname,
                filename: file.filename,
                category,
                mimeType: file.mimetype,
                size: file.size,
                isRecording,
                url,
                downloadUrl: `${url}${url.includes('?') ? '&' : '?'}download=1`
            },
            { upsert: true, new: true, runValidators: true }
        );

        return media;
    }));
}

async function uploadMedia(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more files are required' });
    }
    try {
        const media = await persistMedia(
            req,
            req.files,
            req.files.every((file) => /\.(mp3|m4a|wav|ogg|aac|flac|opus|weba|webm)$/i.test(file.originalname))
                ? 'audio'
                : 'video'
        );
        return res.json({ message: 'Files uploaded successfully', files: req.files, media });
    } catch (error) {
        console.error('Media metadata save failed:', error);
        return res.status(500).json({ error: 'Files uploaded but metadata could not be saved' });
    }
}

async function uploadAudio(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more audio files are required' });
    }

    try {
        const media = await persistMedia(req, req.files, 'audio');
        if (AudioRecording.db.readyState !== 1) {
            return res.status(200).json({
                message: 'Audio uploaded successfully',
                files: req.files,
                media,
                recordings: req.body.isRecording === 'true'
                    ? media.map((item) => ({
                        title: item.title,
                        filename: item.filename,
                        mimeType: item.mimeType,
                        size: item.size,
                        url: item.url
                    }))
                    : []
            });
        }

        const recordings = await Promise.all(media.map((item) => {
            if (!req.body.isRecording || req.body.isRecording === 'false') return null;
            return AudioRecording.findOneAndUpdate(
                { filename: item.filename },
                {
                    title: item.title,
                    mediaId: item._id,
                    filename: item.filename,
                    mimeType: item.mimeType,
                    size: item.size,
                    url: item.url
                },
                { upsert: true, new: true, runValidators: true }
            );
        }));

        return res.status(200).json({
            message: 'Audio uploaded successfully',
            files: req.files,
            media,
            recordings: recordings.filter(Boolean)
        });
    } catch (error) {
        console.error('Audio metadata save failed:', error);
        return res.status(500).json({ error: 'Audio uploaded but metadata could not be saved' });
    }
}

async function uploadDocuments(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more documents are required' });
    }
    try {
        const media = await persistMedia(req, req.files, 'document');
        return res.status(200).json({
            message: 'Documents uploaded successfully',
            documents: req.files,
            media
        });
    } catch (error) {
        console.error('Document metadata save failed:', error);
        return res.status(500).json({ error: 'Documents uploaded but metadata could not be saved' });
    }
}

async function uploadImages(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more images are required' });
    }
    try {
        const media = await persistMedia(req, req.files, 'image');
        return res.status(200).json({
            message: 'Images uploaded successfully',
            images: req.files,
            media
        });
    } catch (error) {
        console.error('Image metadata save failed:', error);
        return res.status(500).json({ error: 'Images uploaded but metadata could not be saved' });
    }
}

async function uploadMovies(req, res) {
    if (!req.files?.length) {
        return res.status(400).json({ error: 'One or more movies are required' });
    }

    try {
        const movies = await Promise.all(req.files.map(async (file) => {
            const title = typeof req.body.title === 'string' && req.body.title.trim()
                ? req.body.title.trim()
                : file.originalname.replace(/\.[^.]+$/, '');
            const description = typeof req.body.description === 'string'
                ? req.body.description.trim()
                : '';
            const watchUrl = `/watch/${encodeURIComponent(file.filename)}`;
            const downloadUrl = `${watchUrl}?download=1`;
            const movieData = {
                title,
                description,
                originalName: file.originalname,
                filename: file.filename,
                mimeType: file.mimetype,
                size: file.size,
                watchUrl,
                downloadUrl,
                uploaderId: req.user?._id || null
            };

            if (Movie.db.readyState !== 1) return movieData;
            return Movie.findOneAndUpdate(
                { filename: file.filename },
                movieData,
                { upsert: true, new: true, runValidators: true }
            );
        }));

        return res.status(200).json({
            message: 'Movies uploaded successfully',
            movies,
            files: req.files
        });
    } catch (error) {
        console.error('Movie metadata save failed:', error);
        return res.status(500).json({ error: 'Movies uploaded but metadata could not be saved' });
    }
}

module.exports = { uploadMedia, uploadAudio, uploadMovies, uploadDocuments, uploadImages };
