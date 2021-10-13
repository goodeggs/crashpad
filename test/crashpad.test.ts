import crashpad, {BoomableError} from '..';
import {Server} from 'http';
import express, {Request as ExpressRequest, Response as ExpressResponse} from 'express';
import {Response} from 'request';
import Boom from '@hapi/boom';
import requestjs from 'request';
import {expect} from 'chai';
import {beforeEach, afterEach, describe, it} from 'mocha';

let app, request: any, response: Response, server: Server;

const withServer = function(createServer: Function) {
  beforeEach(function(done: any) {
    app = createServer(express());
    app.use(crashpad());
    server = app.listen(port, done);
    request = requestjs.defaults({
      baseUrl: `http://localhost:${port}`,
      json:true,
    });
  });
  afterEach(function(done: any){
    server.close(done);
  });
};

const port = process.env['PORT'] || 29108;

describe('crashpad', function() {
  describe('generic (non-boom) errors', function() {
    withServer(function(app: any) {
      app.get('/error', function(req: ExpressRequest, res: ExpressResponse, next?: any) {
        next(new Error('what happened!?'));
      });
      return app;
    });
    beforeEach(function(done: any) {
      request.get('/error', function(err: any, _response: Response){
        response = _response;
        done(err);
      });
    });
    it('returns with a 500 status code', function() {
      expect(response.statusCode).to.equal(500);
    });
    it("returns with a json-formatted body", function() {
      expect(response.body).to.deep.equal({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
      });
    });
  });
  describe('generic (non-boom) error with a statusCode property', function() {
    withServer(function(app: any) {
      app.get('/error', function(req: ExpressRequest, res: ExpressResponse, next: any) {
        const error = new BoomableError();
        error.name = 'CustomError';
        error.message = 'you messed up, yo';
        error.statusCode = 400;
        next(error);
      });
      return app;
    });
    beforeEach(function(done: any) {
      request.get('/error', function(err: Error, _response: Response){
        response = _response;
        done(err);
      });
    });
    it("returns with the supplied status", function() {
      expect(response.statusCode).to.equal(400);
    });
    it("returns with a json-formatted body", function() {
      expect(response.body).to.deep.equal({
        statusCode: 400,
        error: 'Bad Request',
        message: 'you messed up, yo'
      });
    });
  });
  describe('unauthorized requests', function() {
    withServer(function(app: any) {
      app.get('/error', function(req: ExpressRequest, res: ExpressResponse, next: any) {
        next(Boom.unauthorized('get off my lawn!', 'sample', {
          ttl: 0,
          cache: null,
          foo: 'bar'
        }));
      });
      return app;
    });
    beforeEach(function(done: any) {
      request.get('/error', function(err: Error, _response: Response){
        response = _response;
        done(err);
      });
    });
    it("returns with the status code", function() {
      expect(response.statusCode).to.equal(401);
    });
    it("returns with a json-formatted body", function() {
      expect(response.body).to.deep.contain({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'get off my lawn!'
      });
    });
    it("returns with the correct headers", function() {
      expect(response.headers).to.have.property('www-authenticate', 'sample ttl="0", cache="", foo="bar", error="get off my lawn!"');
    });
  });
  describe('non-Error string errors', function() {
    withServer(function(app: any) {
      app.get('/error', function(req: ExpressRequest, res: ExpressResponse, next: any) {
        next('poorly implemented error');
      });
      return app;
    });
    beforeEach(function(done: any) {
      request.get('/error', function(err: Error, _response: Response){
        response = _response;
        done(err);
      });
    });
    it('returns with a 500 status code', function() {
      expect(response.statusCode).to.equal(500);
    });
    it("returns with a json-formatted body", function() {
      expect(response.body).to.deep.equal({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An internal server error occurred'
      });
    });
  });
  describe('Boom errors with custom payload', function() {
    withServer(function(app: any) {
      app.get('/error', function(req: ExpressRequest, res: ExpressResponse, next: any) {
        const err = Boom.badRequest('invalid cucumber', {
          skinToughness: 'high'
        });
        err.output.payload.data = err.data;
        next(err);
      });
      return app;
    });
    beforeEach(function(done: any){
      request.get('/error', function(err: Error, _response: Response){
        response = _response;
        done(err);
      });
    });
    it("returns status code", function(){
      expect(response.statusCode).to.equal(400);
    });
    it("returns with custom payload intact", function() {
      expect(response.body).to.deep.equal({
        statusCode: 400,
        error: 'Bad Request',
        message: 'invalid cucumber',
        data: {
          skinToughness: 'high'
        }
      });
    });
  });
});
