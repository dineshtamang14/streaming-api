// tests/controllers/exampleController.test.js

const exampleController = require('../../controllers/exampleController');

describe('exampleController', () => {
  describe('exampleMethod', () => {
    let req, res;

    beforeEach(() => {
      req = {};
      res = {
        send: jest.fn(),
      };
    });

    it('sends the correct response message', () => {
      exampleController.exampleMethod(req, res);
      expect(res.send).toHaveBeenCalledWith('This is an example method!');
    });

    it('calls res.send exactly once', () => {
      exampleController.exampleMethod(req, res);
      expect(res.send).toHaveBeenCalledTimes(1);
    });
  });
});
