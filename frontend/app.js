const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const mediaGrid = document.querySelector('#media-grid');
const status = document.querySelector('#status');
const sectionTitle = document.querySelector('#section-title');
const sectionKicker = document.querySelector('#section-kicker');
const clearSearch = document.querySelector('#clear-search');
const uploadDialog = document.querySelector('#upload-dialog');
const uploadForm = document.querySelector('#upload-form');
const fileInput = document.querySelector('#file-input');
const fileLabel = document.querySelector('#file-label');
const uploadSubmit = document.querySelector('#upload-submit');
const uploadProgress = document.querySelector('#upload-progress');
const progressBar = document.querySelector('#progress-bar');
const progressLabel = document.querySelector('#progress-label');
const dropZone = document.querySelector('#drop-zone');
const playerDialog = document.querySelector('#player-dialog');
const videoPlayer = document.querySelector('#video-player');
const audioPlayer = document.querySelector('#audio-player');
const playerTitle = document.querySelector('#player-title');

let recentUploads = loadRecentUploads();
let droppedFile = null;
let recordingFile = null;
let mediaRecorder = null;
let recordingChunks = [];
let recordingStream = null;
let recordingStartedAt = 0;
let recordingTimer = null;

function loadRecentUploads() {
    try {
        return JSON.parse(localStorage.getItem('streamflix-recent-uploads') || '[]');
    } catch {
        return [];
    }
}

function saveRecentUploads() {
    localStorage.setItem('streamflix-recent-uploads', JSON.stringify(recentUploads.slice(0, 20)));
}

function isAudio(fileName) {
    return /\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(fileName);
}

function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
}

function renderMedia(items) {
    mediaGrid.replaceChildren();

    if (!items.length) {
        status.textContent = 'No media found.';
        return;
    }

    status.textContent = `${items.length} item${items.length === 1 ? '' : 's'} found`;

    items.forEach((item) => {
        const name = item.filename || item.title || item.originalname || 'Untitled media';
        const streamUrl = item.filename ? `/stream/${encodeURIComponent(item.filename)}` : null;
        const card = document.createElement('article');
        card.className = 'media-card';

        const preview = document.createElement('button');
        preview.type = 'button';
        preview.className = `card-preview${isAudio(name) ? ' audio' : ''}`;
        preview.textContent = isAudio(name) ? '\u266b' : '\u25b6';
        preview.setAttribute('aria-label', `Play ${name}`);

        const body = document.createElement('div');
        body.className = 'card-body';
        body.innerHTML = `<strong title="${escapeHtml(name)}">${escapeHtml(name)}</strong><small>${isAudio(name) ? 'Audio' : 'Video'}</small>`;

        preview.addEventListener('click', () => {
            if (!streamUrl) {
                status.textContent = 'This search result has no playable filename.';
                return;
            }
            openPlayer(name, streamUrl);
        });

        card.append(preview, body);
        mediaGrid.append(card);
    });
}

function openPlayer(name, url) {
    playerTitle.textContent = name;
    videoPlayer.pause();
    audioPlayer.pause();

    if (isAudio(name)) {
        videoPlayer.style.display = 'none';
        videoPlayer.removeAttribute('src');
        audioPlayer.style.display = 'block';
        audioPlayer.src = url;
    } else {
        audioPlayer.style.display = 'none';
        audioPlayer.removeAttribute('src');
        videoPlayer.style.display = 'block';
        videoPlayer.src = url;
    }

    playerDialog.showModal();
}

function showRecentUploads() {
    sectionKicker.textContent = 'Library';
    sectionTitle.textContent = 'Recently uploaded';
    clearSearch.hidden = true;
    renderMedia(recentUploads);
}

async function runSearch(query) {
    sectionKicker.textContent = 'Results';
    sectionTitle.textContent = `Search: ${query}`;
    clearSearch.hidden = false;
    status.textContent = 'Searching...';

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Search failed');
        renderMedia(data);
    } catch (error) {
        status.textContent = error.message;
        mediaGrid.replaceChildren();
    }
}

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) runSearch(query);
});

clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    showRecentUploads();
});

document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
        const view = button.dataset.view;
        document.querySelectorAll('[data-view]').forEach((item) => item.classList.remove('active'));
        document.querySelectorAll(`[data-view="${view}"]`).forEach((item) => item.classList.add('active'));

        if (view === 'search') {
            searchInput.focus();
        } else if (view === 'uploads') {
            uploadDialog.showModal();
        } else {
            showRecentUploads();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});

function openUpload() {
    uploadDialog.showModal();
}

document.querySelector('#open-upload').addEventListener('click', openUpload);
document.querySelector('#hero-upload').addEventListener('click', openUpload);
document.querySelector('#close-upload').addEventListener('click', () => {
    if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
        recordingStream?.getTracks().forEach((track) => track.stop());
        clearInterval(recordingTimer);
    }
    uploadDialog.close();
});
document.querySelector('#close-player').addEventListener('click', () => {
    videoPlayer.pause();
    audioPlayer.pause();
    playerDialog.close();
});

const fileTab = document.querySelector('#file-tab');
const recordTab = document.querySelector('#record-tab');
const fileUploadPanel = document.querySelector('#file-upload-panel');
const recordUploadPanel = document.querySelector('#record-upload-panel');
const startRecording = document.querySelector('#start-recording');
const stopRecording = document.querySelector('#stop-recording');
const recordDot = document.querySelector('#record-dot');
const recordLabel = document.querySelector('#record-label');
const recordTime = document.querySelector('#record-time');
const recordingPreview = document.querySelector('#recording-preview');

function selectUploadMode(mode) {
    const recording = mode === 'record';
    fileTab.classList.toggle('active', !recording);
    recordTab.classList.toggle('active', recording);
    fileTab.setAttribute('aria-selected', String(!recording));
    recordTab.setAttribute('aria-selected', String(recording));
    fileUploadPanel.hidden = recording;
    recordUploadPanel.hidden = !recording;
    uploadSubmit.disabled = recording ? !recordingFile : !(droppedFile || fileInput.files[0]);
}

fileTab.addEventListener('click', () => selectUploadMode('file'));
recordTab.addEventListener('click', () => selectUploadMode('record'));

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartedAt) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    recordTime.textContent = `${minutes}:${seconds}`;
}

startRecording.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
        status.textContent = 'Audio recording is not supported in this browser.';
        return;
    }

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const preferredTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
        const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
        mediaRecorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);
        recordingChunks = [];
        recordingFile = null;
        recordingPreview.hidden = true;
        uploadSubmit.disabled = true;

        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size) recordingChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const type = mediaRecorder.mimeType || 'audio/webm';
            const extension = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
            const blob = new Blob(recordingChunks, { type });
            recordingFile = new File([blob], `recording-${Date.now()}.${extension}`, { type });
            recordingPreview.src = URL.createObjectURL(blob);
            recordingPreview.hidden = false;
            recordLabel.textContent = 'Recording ready';
            recordDot.classList.remove('recording');
            stopRecording.disabled = true;
            startRecording.disabled = false;
            startRecording.textContent = 'Record again';
            uploadSubmit.disabled = false;
            clearInterval(recordingTimer);
        });

        mediaRecorder.start();
        recordingStartedAt = Date.now();
        recordingTimer = setInterval(updateRecordingTime, 250);
        recordDot.classList.add('recording');
        recordLabel.textContent = 'Recording';
        recordTime.textContent = '00:00';
        startRecording.disabled = true;
        stopRecording.disabled = false;
    } catch (error) {
        recordLabel.textContent = 'Microphone unavailable';
        status.textContent = error.name === 'NotAllowedError'
            ? 'Microphone permission was denied.'
            : 'Unable to access the microphone.';
    }
});

stopRecording.addEventListener('click', () => {
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    recordingStream?.getTracks().forEach((track) => track.stop());
});

fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) return;
    droppedFile = null;
    fileLabel.textContent = fileInput.files[0].name;
    uploadSubmit.disabled = false;
});

['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add('dragging');
    });
});

['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.prevent.preventDefault();
        dropZone.classList.remove('dragging');
    });
});

dropZone.addEventListener('drop', (event) => {
    if (!event.dataTransfer.files.length) return;
    droppedFile = event.dataTransfer.files[0];
    fileLabel.textContent = droppedFile.name;
    uploadSubmit.disabled = false;
});

uploadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const file = recordingFile || droppedFile || fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload');

    uploadSubmit.disabled = true;
    uploadProgress.hidden = false;

    xhr.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
        progressLabel.textContent = `Uploading... ${percent}%`;
    });

    xhr.addEventListener('load', () => {
        let result;
        try {
            result = JSON.parse(xhr.responseText);
        } catch {
            result = { error: 'Upload failed' };
        }

        if (xhr.status >= 200 && xhr.status < 300) {
            const upload = result.file;
            recentUploads = [upload, ...recentUploads.filter((item) => item.filename !== upload.filename)];
            saveRecentUploads();
            progressLabel.textContent = 'Upload complete';
            progressBar.style.width = '100%';
            setTimeout(() => {
                uploadDialog.close();
                uploadForm.reset();
                droppedFile = null;
                recordingFile = null;
                recordingPreview.removeAttribute('src');
                recordingPreview.hidden = true;
                fileLabel.textContent = 'Choose a media file';
                uploadSubmit.disabled = true;
                uploadProgress.hidden = true;
                progressBar.style.width = '0';
                showRecentUploads();
            }, 600);
        } else {
            status.textContent = result.error || 'Upload failed';
            progressLabel.textContent = result.error || 'Upload failed';
            uploadSubmit.disabled = false;
        }
    });

    xhr.addEventListener('error', () => {
        status.textContent = 'Unable to connect to the server';
        progressLabel.textContent = 'Upload failed';
        uploadSubmit.disabled = false;
    });

    xhr.send(formData);
});

showRecentUploads();
