// tests/middleware/authMiddleware.test.js

const authMiddleware = require('../../middleware/authMiddleware');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it('calls next() when a valid authorization header is present', () => {
    req.headers['authorization'] = 'Bearer valid-token';
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('returns 403 Forbidden when authorization header is missing', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 Forbidden when authorization header is an empty string', () => {
    req.headers['authorization'] = '';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for any non-empty token value', () => {
    req.headers['authorization'] = 'some-token';
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
