# Streaming API Reference

## Overview

This API uses Express to provide file uploads, file streaming, and title
search. Uploaded files are stored in the local `uploads/` directory. Search
results are read from the MongoDB `videos` collection.

## Base URL

```text
http://localhost:3000
```

The port can be changed with the `PORT` environment variable.

## Prerequisites

Start MongoDB locally with the database URL:

```text
mongodb://localhost:27017/streamingAPI
```

The database and `videos` collection may be created by MongoDB when data is
first inserted. The API expects video documents to contain a `title` field.

## Endpoints

### Search videos

```http
GET /search?q=<query>
```

Searches video titles case-insensitively. The query is treated as literal text,
not as a regular expression.

Example:

```bash
curl "http://localhost:3000/search?q=matrix"
```

Successful response (`200 OK`):

```json
[
  {
    "_id": "665000000000000000000001",
    "title": "The Matrix",
    "filename": "1715600000000-the-matrix.mp4"
  }
]
```

Errors:

- `400 Bad Request` when `q` is missing or empty
- `500 Internal Server Error` when the database search fails

### Upload a file

```http
POST /upload
Content-Type: multipart/form-data
```

Send the file in a multipart field named `file`.

Supported formats include MP3, M4A, WAV, OGG, AAC, FLAC, MP4, and WebM.
Media files are limited to 500 MB. Browser recordings are uploaded as WebM,
OGG, or M4A depending on browser support.

Example:

```bash
curl -X POST \
  -F "file=@./movie.mp4" \
  http://localhost:3000/upload
```

Successful response (`200 OK`):

```json
{
  "message": "File uploaded successfully",
  "file": {
    "fieldname": "file",
    "originalname": "movie.mp4",
    "filename": "1715600000000-movie.mp4",
    "destination": "E:\\path\\to\\streaming-api\\uploads",
    "path": "E:\\path\\to\\streaming-api\\uploads\\1715600000000-movie.mp4",
    "size": 1048576
  }
}
```

The generated filename should be used with `/stream/:filename`.

Errors:

- `400 Bad Request` when no `file` field is supplied

### Stream a file

```http
GET /stream/:filename
```

Streams a file previously saved in `uploads/`. The endpoint supports HTTP byte
ranges for media seeking.

Full-file request:

```bash
curl http://localhost:3000/stream/1715600000000-movie.mp4 --output movie.mp4
```

Partial request:

```bash
curl -H "Range: bytes=0-999999" \
  http://localhost:3000/stream/1715600000000-movie.mp4 \
  --output movie-part.mp4
```

Responses:

- `200 OK` for a complete file
- `206 Partial Content` for a valid byte range
- `400 Bad Request` for an invalid filename
- `404 Not Found` when the file does not exist
- `416 Range Not Satisfiable` for an invalid byte range

Supported content types include MP4, MP3, M4A, WAV, and WebM. Unknown file
extensions are served as `application/octet-stream`.

### Serve an uploaded file

```http
GET /:filename
```

Uploaded files are also available through Express static-file serving:

```bash
curl http://localhost:3000/1715600000000-movie.mp4 --output movie.mp4
```

For media playback and byte-range support, prefer `/stream/:filename`.

## Error Response Format

Endpoint validation and operational errors use JSON:

```json
{
  "error": "File not found"
}
```

## Development

Install dependencies and run the test suite:

```bash
npm install
npm test -- --runInBand
```

On Windows PowerShell, use `npm.cmd` when script execution policy blocks
`npm.ps1`:

```powershell
npm.cmd install
npm.cmd test -- --runInBand
```
