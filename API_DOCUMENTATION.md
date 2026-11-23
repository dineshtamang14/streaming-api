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

## Authentication

### Sign up

```http
POST /auth/signup
Content-Type: application/json
```

```json
{
  "name": "Dinesh Tamang",
  "email": "dinesh@example.com",
  "password": "strong-password"
}
```

The response contains a bearer token valid for seven days.

### Sign in

```http
POST /auth/signin
Content-Type: application/json
```

```json
{
  "email": "dinesh@example.com",
  "password": "strong-password"
}
```

Use the returned token for protected upload requests:

```http
Authorization: Bearer <token>
```

Protected endpoints:

- `POST /upload`
- `POST /upload/audio`
- `POST /upload/document`
- `POST /upload/images`

## Movie upload and playback

### Upload movies

```http
POST /upload/movie
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Send one or more files in the `movies` field. Optional multipart fields are
`title` and `description`. Supported formats are MP4, WebM, MOV, AVI, MKV, and
M4V. The limit is 4 GB per movie and 10 movies per request.

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "title=Example Movie" \
  -F "description=A sample movie" \
  -F "movies=@./movie.mp4" \
  http://localhost:3000/upload/movie
```

### List movies

```http
GET /movies
```

### Watch a movie

```http
GET /watch/:filename
GET /movie/file/:filename
GET /movie/file/:filename?download=1
```

The watch page provides native range streaming, playback speed, 10-second seek,
volume controls, theater mode, fullscreen, picture-in-picture, keyboard
shortcuts, and download.

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

Send one or more files in a multipart field named `files`.

Supported formats include MP3, M4A, WAV, OGG, AAC, FLAC, MP4, and WebM.
Media files are limited to 500 MB. Browser recordings are uploaded as WebM,
OGG, or M4A depending on browser support.

### Upload a document

```http
POST /upload/document
Content-Type: multipart/form-data
```

Send the file in a multipart field named `document`. Supported formats are PDF,
DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, RTF, JPG, JPEG, and PNG. Document
uploads are limited to 100 MB.

```bash
curl -X POST \
  -F "document=@./report.pdf" \
  http://localhost:3000/upload/document
```

Successful response (`200 OK`):

```json
{
  "message": "Document uploaded successfully",
  "document": {
    "filename": "1715600000000-report.pdf",
    "originalname": "report.pdf",
    "size": 1048576
  }
}
```

### Download a document

```http
GET /documents/:filename
```

```bash
curl http://localhost:3000/documents/1715600000000-report.pdf --output report.pdf
```

Responses:

- `200 OK` for an existing document
- `400 Bad Request` for an invalid filename
- `404 Not Found` for a missing document
- `413 Payload Too Large` for a document over 100 MB

### Get the persisted media library

```http
GET /library
GET /library?category=audio
```

Returns MongoDB `Media` records sorted newest first. Valid categories are
`audio`, `video`, `image`, and `document`.

### Upload audio files

```http
POST /upload/audio
Content-Type: multipart/form-data
```

Send one or more files in the `audio` multipart field. Supported formats include
MP3, M4A, WAV, OGG, AAC, FLAC, OPUS, WEBA, and WebM. Audio uploads are limited
to 250 MB per file.

For microphone recordings, add multipart fields `isRecording=true` and
`title=<recording name>`.

### Stream or download audio

```http
GET /audio/file/:filename
GET /audio/file/:filename?download=1
```

### List browser recordings

```http
GET /audio
```

Returns records from the MongoDB `audio_recordings` collection.

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
