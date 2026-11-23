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
let droppedFiles = [];
let recordingFile = null;
let documentFile = null;
let documentFiles = [];
let imageFile = null;
let imageFiles = [];
let activeLibraryFilter = 'all';
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

function isDocument(fileName) {
    return /\.(pdf|doc|docx|txt|csv|xls|xlsx|ppt|pptx|rtf)$/i.test(fileName);
}

function isImage(fileName) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
}

function getCategory(fileName) {
    if (isImage(fileName)) return 'image';
    if (isDocument(fileName)) return 'document';
    if (isAudio(fileName)) return 'audio';
    return 'video';
}

function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
}

function renderMedia(items) {
    mediaGrid.replaceChildren();

    const filteredItems = activeLibraryFilter === 'all'
        ? items
        : items.filter((item) => getCategory(item.filename || item.title || item.originalname || '') === activeLibraryFilter);

    if (!filteredItems.length) {
        status.textContent = 'No media found.';
        return;
    }

    status.textContent = `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'} found`;

    filteredItems.forEach((item) => {
        const name = item.filename || item.title || item.originalname || 'Untitled media';
        const category = getCategory(name);
        let streamUrl = null;
        if (item.filename) {
            if (category === 'document') streamUrl = `/documents/${encodeURIComponent(item.filename)}`;
            else if (category === 'image') streamUrl = `/images/${encodeURIComponent(item.filename)}`;
            else streamUrl = `/stream/${encodeURIComponent(item.filename)}`;
        }
        const card = document.createElement('article');
        card.className = 'media-card';

        const preview = document.createElement('button');
        preview.type = 'button';
        preview.className = `card-preview${category === 'audio' ? ' audio' : ''}`;
        preview.textContent = category === 'document' ? '\u9776' : category === 'image' ? '\u25a1' : category === 'audio' ? '\u266b' : '\u25b6';
        preview.setAttribute('aria-label', `${category} ${name}`);

        const body = document.createElement('div');
        body.className = 'card-body';
        body.innerHTML = `<strong title="${escapeHtml(name)}">${escapeHtml(name)}</strong><small>${category[0].toUpperCase() + category.slice(1)}</small>`;

        if (category === 'image' && streamUrl) {
            preview.style.background = `center / cover no-repeat url("${streamUrl}")`;
            preview.textContent = '';
        }

        preview.addEventListener('click', () => {
            if (!streamUrl) {
                status.textContent = 'This search result has no playable filename.';
                return;
            }
            if (category === 'document') {
                window.open(streamUrl, '_blank', 'noopener');
                return;
            }
            if (category === 'image') {
                openImage(name, streamUrl);
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
    const imageViewer = document.querySelector('#image-viewer');
    if (imageViewer) imageViewer.hidden = true;

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

function openImage(name, url) {
    playerTitle.textContent = name;
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.style.display = 'none';
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.style.display = 'none';

    let imageViewer = document.querySelector('#image-viewer');
    if (!imageViewer) {
        imageViewer = document.createElement('img');
        imageViewer.id = 'image-viewer';
        imageViewer.alt = name;
        playerDialog.append(imageViewer);
    }
    imageViewer.src = url;
    imageViewer.hidden = false;
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

document.querySelectorAll('[data-library-filter]').forEach((button) => {
    button.addEventListener('click', () => {
        activeLibraryFilter = button.dataset.libraryFilter;
        document.querySelectorAll('[data-library-filter]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        showRecentUploads();
    });
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
const documentTab = document.querySelector('#document-tab');
const imageTab = document.querySelector('#image-tab');
const fileUploadPanel = document.querySelector('#file-upload-panel');
const recordUploadPanel = document.querySelector('#record-upload-panel');
const documentUploadPanel = document.querySelector('#document-upload-panel');
const imageUploadPanel = document.querySelector('#image-upload-panel');
const documentInput = document.querySelector('#document-input');
const documentLabel = document.querySelector('#document-label');
const imageInput = document.querySelector('#image-input');
const imageLabel = document.querySelector('#image-label');
const startRecording = document.querySelector('#start-recording');
const stopRecording = document.querySelector('#stop-recording');
const recordDot = document.querySelector('#record-dot');
const recordLabel = document.querySelector('#record-label');
const recordTime = document.querySelector('#record-time');
const recordingPreview = document.querySelector('#recording-preview');

function selectUploadMode(mode) {
    const recording = mode === 'record';
    const documentMode = mode === 'document';
    const imageMode = mode === 'image';
    fileTab.classList.toggle('active', mode === 'file');
    recordTab.classList.toggle('active', recording);
    documentTab.classList.toggle('active', documentMode);
    imageTab.classList.toggle('active', imageMode);
    fileTab.setAttribute('aria-selected', String(mode === 'file'));
    recordTab.setAttribute('aria-selected', String(recording));
    documentTab.setAttribute('aria-selected', String(documentMode));
    imageTab.setAttribute('aria-selected', String(imageMode));
    fileUploadPanel.hidden = mode !== 'file';
    recordUploadPanel.hidden = !recording;
    documentUploadPanel.hidden = !documentMode;
    imageUploadPanel.hidden = !imageMode;
    uploadSubmit.disabled = recording
        ? !recordingFile
        : documentMode
            ? documentFiles.length === 0
            : imageMode
                ? imageFiles.length === 0
                : droppedFiles.length === 0;
}

fileTab.addEventListener('click', () => selectUploadMode('file'));
recordTab.addEventListener('click', () => selectUploadMode('record'));
documentTab.addEventListener('click', () => selectUploadMode('document'));
imageTab.addEventListener('click', () => selectUploadMode('image'));

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
    droppedFiles = Array.from(fileInput.files);
    fileLabel.textContent = droppedFiles.length === 1
        ? droppedFiles[0].name
        : `${droppedFiles.length} files selected`;
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
    droppedFiles = Array.from(event.dataTransfer.files);
    fileLabel.textContent = droppedFiles.length === 1
        ? droppedFiles[0].name
        : `${droppedFiles.length} files selected`;
    uploadSubmit.disabled = false;
});

documentInput.addEventListener('change', () => {
    if (!documentInput.files.length) return;
    documentFile = documentInput.files[0];
    documentFiles = Array.from(documentInput.files);
    documentLabel.textContent = documentFiles.length === 1
        ? documentFiles[0].name
        : `${documentFiles.length} documents selected`;
    uploadSubmit.disabled = false;
});

const documentDropZone = document.querySelector('#document-drop-zone');
['dragenter', 'dragover'].forEach((eventName) => {
    documentDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        documentDropZone.classList.add('dragging');
    });
});
['dragleave', 'drop'].forEach((eventName) => {
    documentDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        documentDropZone.classList.remove('dragging');
    });
});
documentDropZone.addEventListener('drop', (event) => {
    if (!event.dataTransfer.files.length) return;
    documentFiles = Array.from(event.dataTransfer.files);
    documentLabel.textContent = documentFiles.length === 1
        ? documentFiles[0].name
        : `${documentFiles.length} documents selected`;
    uploadSubmit.disabled = false;
});

const imageDropZone = document.querySelector('#image-drop-zone');

imageInput.addEventListener('change', () => {
    if (!imageInput.files.length) return;
    imageFiles = Array.from(imageInput.files);
    imageLabel.textContent = imageFiles.length === 1
        ? imageFiles[0].name
        : `${imageFiles.length} images selected`;
    uploadSubmit.disabled = false;
});

['dragenter', 'dragover'].forEach((eventName) => {
    imageDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        imageDropZone.classList.add('dragging');
    });
});
['dragleave', 'drop'].forEach((eventName) => {
    imageDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        imageDropZone.classList.remove('dragging');
    });
});
imageDropZone.addEventListener('drop', (event) => {
    if (!event.dataTransfer.files.length) return;
    imageFiles = Array.from(event.dataTransfer.files);
    imageLabel.textContent = imageFiles.length === 1
        ? imageFiles[0].name
        : `${imageFiles.length} images selected`;
    uploadSubmit.disabled = false;
});

uploadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const isDocumentUpload = documentTab.classList.contains('active');
    const isImageUpload = imageTab.classList.contains('active');
    const files = isDocumentUpload
        ? documentFiles
        : isImageUpload
            ? imageFiles
            : droppedFiles;

    if (!recordingFile && !files.length) return;

    const formData = new FormData();
    if (recordingFile) {
        formData.append('files', recordingFile);
    } else {
        files.forEach((file) => {
            formData.append(isDocumentUpload ? 'documents' : isImageUpload ? 'images' : 'files', file);
        });
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', isDocumentUpload
        ? '/upload/document'
        : isImageUpload
            ? '/upload/images'
            : '/upload');

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
            const uploads = result.documents || result.images || result.files || (result.file ? [result.file] : []);
            const existingNames = new Set(uploads.map((item) => item.filename));
            recentUploads = [...uploads, ...recentUploads.filter((item) => !existingNames.has(item.filename))];
            saveRecentUploads();
            progressLabel.textContent = 'Upload complete';
            progressBar.style.width = '100%';
            setTimeout(() => {
                uploadDialog.close();
                uploadForm.reset();
                droppedFile = null;
                recordingFile = null;
                documentFile = null;
                droppedFiles = [];
                documentFiles = [];
                imageFiles = [];
                documentInput.value = '';
                imageInput.value = '';
                fileInput.value = '';
                documentLabel.textContent = 'Choose a document';
                imageLabel.textContent = 'Choose one or more images';
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
