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
| `POST` | `/upload` | Upload one song, recording, or media file |
| `POST` | `/upload/document` | Upload a PDF, Office, text, CSV, RTF, or image document |
| `GET` | `/documents/:filename` | Download an uploaded document |
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
middleware/               Request middleware
routes/                   Express routers
tests/                    Jest and SuperTest tests
API_DOCUMENTATION.md      Detailed endpoint reference
```

## License

ISC
