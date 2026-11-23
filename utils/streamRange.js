function parseRangeHeader(range, fileSize) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return null;

    const start = match[1]
        ? Number(match[1])
        : Math.max(fileSize - Number(match[2]), 0);
    const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) ||
        start < 0 || requestedEnd < start || start >= fileSize) {
        return null;
    }

    return { start, end: Math.min(requestedEnd, fileSize - 1) };
}

module.exports = { parseRangeHeader };
