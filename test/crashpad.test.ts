import {Server} from 'http';
import express, {
  Application,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import requestjs, {
  Request as RequestRequest,
  RequestAPI,
  CoreOptions,
  RequiredUriUrl,
  Response,
} from 'request';
import Boom from '@hapi/boom';
import {expect} from 'chai';
import {beforeEach, afterEach, describe, it} from 'mocha';

import crashpad from '../src';

// a requestjs object which hits our express app
type RequestjsRequest = RequestAPI<RequestRequest, CoreOptions, RequiredUriUrl>;

// a func which takes an express app, adds routes/middleware, and returns it
type CreateServerFunc = (app: Application) => Application;

// express middleware next func
type NextFunc = (err: Error | undefined) => void;

let app: Application;
let request: RequestjsRequest;
let response: Response;
let server: Server;

const port = process.env.PORT ?? 29108;

class BoomableError extends Error {
  statusCode = 500;
}

const withServer = function (createServer: CreateServerFunc) {
  // eslint-disable-next-line mocha/no-top-level-hooks
  beforeEach(function (done) {
    app = createServer(express());
    app.use(crashpad());
    server = app.listen(port, () => {
      done(undefined);
    });
    request = requestjs.defaults({
      baseUrl: `http://localhost:${port}`,
      json: true,
    });
  });

  // eslint-disable-next-line mocha/no-top-level-hooks
  afterEach(function (done) {
    server.close(done);
  });
};

describe('crashpad', function () {
  describe('generic (non-boom) errors', function () {
    withServer(function (innerApp: Application) {
      innerApp.get(
        '/error',
        function (_req: ExpressRequest, _res: ExpressResponse, next: NextFunc) {
          next(new Error('what happened!?'));
        },
      );
      return innerApp;
    });

    beforeEach(function (done) {
      request.get('/error', function (err: Error, _response: Response) {
        response = _response;
        done(err);
      });
    });

    it('returns with a 500 status code', function () {
      expect(response.statusCode).to.equal(500);
    });

    it('returns with a json-formatted body', function () {
      expect(response.body).to.deep.equal({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
      });
    });
  });

  describe('generic (non-boom) error with a statusCode property', function () {
    withServer(function (innerApp: Application) {
      innerApp.get(
        '/error',
        function (_req: ExpressRequest, _res: ExpressResponse, next: NextFunc) {
          const error = new BoomableError();
          error.name = 'CustomError';
          error.message = 'you messed up, yo';
          error.statusCode = 400;
          next(error);
        },
      );
      return innerApp;
    });

    beforeEach(function (done) {
      request.get('/error', function (err: Error, _response: Response) {
        response = _response;
        done(err);
      });
    });

    it('returns with the supplied status', function () {
      expect(response.statusCode).to.equal(400);
    });

    it('returns with a json-formatted body', function () {
      expect(response.body).to.deep.equal({
        statusCode: 400,
        error: 'Bad Request',
        message: 'you messed up, yo',
      });
    });
  });

  describe('unauthorized requests', function () {
    withServer(function (innerApp: Application) {
      innerApp.get(
        '/error',
        function (_req: ExpressRequest, _res: ExpressResponse, next: NextFunc) {
          next(
            Boom.unauthorized('get off my lawn!', 'sample', {
              ttl: 0,
              cache: null,
              foo: 'bar',
            }),
          );
        },
      );
      return innerApp;
    });

    beforeEach(function (done) {
      request.get('/error', function (err: Error, _response: Response) {
        response = _response;
        done(err);
      });
    });

    it('returns with the status code', function () {
      expect(response.statusCode).to.equal(401);
    });

    it('returns with a json-formatted body', function () {
      expect(response.body).to.deep.contain({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'get off my lawn!',
      });
    });

    it('returns with the correct headers', function () {
      expect(response.headers).to.have.property(
        'www-authenticate',
        'sample ttl="0", cache="", foo="bar", error="get off my lawn!"',
      );
    });
  });

  describe('non-Error string errors', function () {
    withServer(function (innerApp: Application) {
      innerApp.get(
        '/error',
        function (_req: ExpressRequest, _res: ExpressResponse, next: (invalidErr: string) => void) {
          next('poorly implemented error');
        },
      );
      return innerApp;
    });

    beforeEach(function (done) {
      request.get('/error', function (err: Error, _response: Response) {
        response = _response;
        done(err);
      });
    });

    it('returns with a 500 status code', function () {
      expect(response.statusCode).to.equal(500);
    });

    it('returns with a json-formatted body', function () {
      expect(response.body).to.deep.equal({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred',
      });
    });
  });

  describe('Boom errors with custom payload', function () {
    withServer(function (innerApp: Application) {
      innerApp.get(
        '/error',
        function (_req: ExpressRequest, _res: ExpressResponse, next: NextFunc) {
          const err = Boom.badRequest('invalid cucumber', {
            skinToughness: 'high',
          });
          err.output.payload.data = err.data;
          next(err);
        },
      );
      return innerApp;
    });

    beforeEach(function (done) {
      request.get('/error', function (err: Error, _response: Response) {
        response = _response;
        done(err);
      });
    });

    it('returns status code', function () {
      expect(response.statusCode).to.equal(400);
    });

    it('returns with custom payload intact', function () {
      expect(response.body).to.deep.equal({
        statusCode: 400,
        error: 'Bad Request',
        message: 'invalid cucumber',
        data: {
          skinToughness: 'high',
        },
      });
    });
  });
});
