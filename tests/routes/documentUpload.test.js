const fs = require('fs');
const path = require('path');
const request = require('supertest');

jest.mock('../../middleware/authMiddleware', () => (req, res, next) => next());

const app = require('../../server');

describe('document uploads', () => {
  const documentDirectory = path.join(__dirname, '..', '..', 'uploads', 'documents');
  let uploadedFileName;

  afterAll(() => {
    if (uploadedFileName) {
      const filePath = path.join(documentDirectory, uploadedFileName);
      if (fs.existsSync(filePath)) fs.rmSync(filePath);
    }
  });

  it('uploads and serves a supported PDF document', async () => {
    const upload = await request(app)
      .post('/upload/document')
      .attach('documents', Buffer.from('%PDF-1.4 test'), {
        filename: 'test-document.pdf',
        contentType: 'application/pdf'
      });

    expect(upload.status).toBe(200);
    expect(upload.body.message).toBe('Documents uploaded successfully');
    uploadedFileName = upload.body.documents[0].filename;

    const download = await request(app).get(`/documents/${uploadedFileName}`);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('rejects unsupported document extensions', async () => {
    const upload = await request(app)
      .post('/upload/document')
      .attach('documents', Buffer.from('not executable'), {
        filename: 'script.exe',
        contentType: 'application/octet-stream'
      });

    expect(upload.status).toBe(400);
    expect(upload.body.error).toMatch(/supported document files are allowed/i);
  });

  it('returns 404 for a missing document', async () => {
    const download = await request(app).get('/documents/missing-document.pdf');
    expect(download.status).toBe(404);
  });
});
