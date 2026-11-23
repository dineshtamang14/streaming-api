const player = document.querySelector('#movie-player');
const cinema = document.querySelector('#cinema-player');
const centerPlay = document.querySelector('#center-play');
const playToggle = document.querySelector('#play-toggle');
const rewind = document.querySelector('#rewind');
const forward = document.querySelector('#forward');
const volume = document.querySelector('#volume');
const volumeIcon = document.querySelector('#volume-icon');
const currentTime = document.querySelector('#current-time');
const duration = document.querySelector('#duration');
const progressArea = document.querySelector('#progress-area');
const progressPlayed = document.querySelector('#progress-played');
const progressBuffer = document.querySelector('#progress-buffer');
const speedSelect = document.querySelector('#speed-select');
const fullscreenButton = document.querySelector('#fullscreen');
const pictureInPicture = document.querySelector('#picture-in-picture');
const theaterButton = document.querySelector('#theater-mode');
const watchTitle = document.querySelector('#watch-title');
const watchDescription = document.querySelector('#watch-description');
const downloadButton = document.querySelector('#watch-download');
const copyButton = document.querySelector('#watch-copy');

const filename = decodeURIComponent(location.pathname.split('/').pop());
const streamUrl = `/movie/file/${encodeURIComponent(filename)}`;
const downloadUrl = `${streamUrl}?download=1`;

player.src = streamUrl;
downloadButton.addEventListener('click', () => {
    window.location.assign(downloadUrl);
});

copyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(location.href);
        copyButton.textContent = 'Link copied';
        setTimeout(() => { copyButton.textContent = 'Copy link'; }, 1600);
    } catch {
        copyButton.textContent = 'Copy unavailable';
    }
});

fetch('/movies')
    .then((response) => response.ok ? response.json() : [])
    .then((movies) => {
        const movie = movies.find((item) => item.filename === filename);
        if (!movie) return;
        watchTitle.textContent = movie.title || filename;
        watchDescription.textContent = movie.description || 'Uploaded movie';
        document.title = `${watchTitle.textContent} - StreamFlix`;
    })
    .catch(() => {
        watchTitle.textContent = filename;
    });

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const whole = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = String(whole % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
}

async function togglePlayback() {
    if (player.paused) {
        await player.play();
    } else {
        player.pause();
    }
}

centerPlay.addEventListener('click', togglePlayback);
playToggle.addEventListener('click', togglePlayback);
rewind.addEventListener('click', () => { player.currentTime = Math.max(0, player.currentTime - 10); });
forward.addEventListener('click', () => { player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10); });

player.addEventListener('play', () => {
    centerPlay.classList.add('hidden');
    playToggle.textContent = '\u2016';
});
player.addEventListener('pause', () => {
    centerPlay.classList.remove('hidden');
    playToggle.textContent = '\u25b6';
});
player.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(player.duration);
});
player.addEventListener('timeupdate', () => {
    currentTime.textContent = formatTime(player.currentTime);
    if (player.duration) {
        progressPlayed.style.width = `${(player.currentTime / player.duration) * 100}%`;
    }
});
player.addEventListener('progress', () => {
    if (player.buffered.length && player.duration) {
        progressBuffer.style.width = `${(player.buffered.end(player.buffered.length - 1) / player.duration) * 100}%`;
    }
});

progressArea.addEventListener('pointerdown', (event) => {
    if (!player.duration) return;
    const bounds = progressArea.getBoundingClientRect();
    player.currentTime = ((event.clientX - bounds.left) / bounds.width) * player.duration;
});

volume.addEventListener('input', () => {
    player.volume = Number(volume.value);
    player.muted = player.volume === 0;
    volumeIcon.textContent = player.volume === 0 ? '\u{1F507}' : player.volume < 0.5 ? '\u{1F508}' : '\u{1F50A}';
});

speedSelect.addEventListener('change', () => {
    player.playbackRate = Number(speedSelect.value);
});

fullscreenButton.addEventListener('click', async () => {
    if (document.fullscreenElement) {
        await document.exitFullscreen();
    } else {
        await cinema.requestFullscreen();
    }
});

pictureInPicture.addEventListener('click', async () => {
    if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
        await player.requestPictureInPicture();
    }
});

theaterButton.addEventListener('click', () => {
    cinema.classList.toggle('theater');
});

cinema.addEventListener('mousemove', () => {
    cinema.classList.add('controls-visible');
    clearTimeout(cinema.hideControlsTimer);
    cinema.hideControlsTimer = setTimeout(() => cinema.classList.remove('controls-visible'), 1800);
});

document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.code === 'Space' || event.code === 'KeyK') {
        event.prevent.preventDefault();
        togglePlayback();
    } else if (event.code === 'ArrowLeft') {
        player.currentTime = Math.max(0, player.currentTime - 10);
    } else if (event.code === 'ArrowRight') {
        player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10);
    } else if (event.code === 'KeyF') {
        fullscreenButton.click();
    } else if (event.code === 'KeyM') {
        player.muted = !player.muted;
        volume.value = player.muted ? '0' : String(player.volume || 1);
    }
});
