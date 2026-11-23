# Streaming API

A Node.js and Express API for uploading, searching, and streaming audio and
video files.

## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally on `mongodb://localhost:27017/streamingAPI`

The application creates the `uploads/` directory automatically when it starts.

## Installation

```bash
git clone https://github.com/dineshtamang14/streaming-api.git
cd streaming-api
npm install
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks
`npm.ps1`:

```powershell
npm.cmd install
```

## Running the API

Create a `.env` file in the project root. Set `MONGODB_URI` to your MongoDB
connection string and optionally set `PORT`:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database>
PORT=3000
```

The included `.env.example` shows the required format. Never commit `.env`;
it is ignored by Git.

## Authentication

The API uses a simple bearer-token authentication system backed by MongoDB.
Passwords are stored using PBKDF2 with SHA-512 and random salts. Tokens are
random 32-byte values stored only as SHA-256 hashes and expire after 7 days.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create a user and return a bearer token |
| `POST` | `/auth/signin` | Sign in and return a bearer token |
| `GET` | `/auth/me` | Return the authenticated user |

Send protected requests with:

```http
Authorization: Bearer <token>
```

Protected operations include all upload endpoints. Browsing, streaming,
downloading, search, and library viewing remain public.

```bash
npm start
```

The server listens on port `3000` by default. Set `PORT` to use another port:

```powershell
$env:PORT=4000
npm.cmd start
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/search?q=<text>` | Search the MongoDB `videos` collection by title |
| `POST` | `/upload` | Upload multiple songs or video files |
| `POST` | `/upload/audio` | Upload multiple audio files or recordings |
| `POST` | `/upload/document` | Upload multiple PDF, Office, text, or CSV documents |
| `POST` | `/upload/images` | Upload multiple images |
| `GET` | `/library` | Load persisted media metadata |
| `GET` | `/library?category=audio` | Load persisted audio items |
| `GET` | `/audio` | List persisted browser recordings |
| `GET` | `/documents/:filename` | Download or view an uploaded document |
| `GET` | `/images/:filename` | View an uploaded image |
| `GET` | `/stream/:filename` | Stream an uploaded file |
| `GET` | `/:filename` | Serve an uploaded file directly |
| `GET` | `/frontend/*` | Serve the responsive web frontend assets |
| `GET` | `/` | Open the responsive web frontend |

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for request examples,
responses, status codes, and range streaming details.

## Testing

```bash
npm test -- --runInBand
```

On Windows PowerShell:

```powershell
npm.cmd test -- --runInBand
```

## Project Structure

```text
server.js                 Express application and streaming endpoints
controllers/              Controller implementations
middleware/               Multer and upload error middleware
routes/                   Express route definitions
config/                   Paths, MongoDB, and file-type configuration
utils/                    Range and regular-expression helpers
frontend/                 Responsive browser interface
tests/                    Jest and SuperTest tests
API_DOCUMENTATION.md      Detailed endpoint reference
```

## Upload Folder Structure

```text
uploads/
  audio/
    recordings/
  video/
  documents/
  images/
```

- Audio files without recording metadata go to `uploads/audio/`.
- Browser microphone recordings go to `uploads/audio/recordings/`.
- Video files go to `uploads/video/`.
- PDF and Office files go to `uploads/documents/`.
- Images go to `uploads/images/`.

## Code Organization

### Application entry

- `server.js` creates the Express app, applies shared middleware, mounts routes,
  serves the frontend, connects to MongoDB, and starts the server.

### Configuration

- `config/paths.js` centralizes upload and frontend directories.
- `config/database.js` owns the MongoDB URI and connection lifecycle.
- `config/fileTypes.js` defines supported extensions and MIME types.

### MongoDB models

- `models/Media.js` stores the unified media library.
- `models/AudioRecording.js` stores metadata for browser microphone recordings.
 - `models/User.js` stores hashed user credentials and bearer session tokens.

The `Media` schema includes title, original name, filename, category, MIME type,
size, optional duration, recording flag, stream/download URLs, and upload time.

### Routing

- `routes/index.js` mounts the application router.
- `routes/api.js` maps public HTTP endpoints to middleware and controllers.

### Controllers

- `controllers/searchController.js` searches MongoDB video titles.
- `controllers/mediaController.js` handles range-based media streaming.
- `controllers/uploadController.js` validates upload results and responses.
- `controllers/documentController.js` serves or downloads documents.
- `controllers/imageController.js` serves images.

### Middleware and utilities

- `middleware/uploads.js` defines media, document, and image Multer storage.
- `middleware/uploadErrors.js` standardizes Multer error responses.
- `utils/streamRange.js` parses HTTP byte ranges.
- `utils/regex.js` escapes search input for MongoDB regular expressions.

## License

ISC
