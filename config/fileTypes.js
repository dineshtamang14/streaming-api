const mediaExtensions = new Set([
    '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac',
    '.mp4', '.webm', '.mov', '.avi', '.mkv'
]);

const imageExtensions = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'
]);

const documentTypes = new Map([
    ['.pdf', 'application/pdf'],
    ['.doc', 'application/msword'],
    ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['.txt', 'text/plain'],
    ['.csv', 'text/csv'],
    ['.xls', 'application/vnd.ms-excel'],
    ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['.ppt', 'application/vnd.ms-powerpoint'],
    ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ['.rtf', 'application/rtf']
]);

const mediaContentTypes = {
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.webm': 'video/webm',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska'
};

const imageContentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml'
};

module.exports = {
    mediaExtensions,
    imageExtensions,
    documentTypes,
    mediaContentTypes,
    imageContentTypes
};
