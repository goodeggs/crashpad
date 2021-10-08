const crashpad = require('..');
const express = require('express');
const Boom = require('boom');
const namespacedRequest = require('namespaced-request');
const {expect} = require('chai');

let app, request, response, server;

const withServer = function(createServer) {
  beforeEach(function(done) {
    app = createServer(express());
    app.use(crashpad());
    server = app.listen(port, done);
    request = namespacedRequest(`http://localhost:${port}`);
  });
  afterEach(function(done) {
    server.close(done);
  });
};

const port = process.env['PORT'] || 29108;

describe('crashpad', function() {
  describe('generic (non-boom) errors', function() {
    withServer(function(app) {
      app.get('/error', function(req, res, next) {
        next(new Error('what happened!?'));
      });
      return app;
    });
    beforeEach(function(done) {
      request.get('/error', function(err, _response){
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
  describe('generic (non-boom) error with a status property', function() {
    withServer(function(app) {
      app.get('/error', function(req, res, next) {
        const error = new Error();
        error.name = 'CustomError';
        error.message = 'you messed up, yo';
        error.status = 400;
        next(error);
      });
      return app;
    });
    beforeEach(function(done) {
      request.get('/error', function(err, _response){
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
    withServer(function(app) {
      app.get('/error', function(req, res, next) {
        next(Boom.unauthorized('get off my lawn!', 'sample', {
          ttl: 0,
          cache: null,
          foo: 'bar'
        }));
      });
      return app;
    });
    beforeEach(function(done) {
      request.get('/error', function(err, _response){
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
    withServer(function(app) {
      app.get('/error', function(req, res, next) {
        next('poorly implemented error');
      });
      return app;
    });
    beforeEach(function(done) {
      request.get('/error', function(err, _response){
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
    withServer(function(app) {
      app.get('/error', function(req, res, next) {
        const err = Boom.badRequest('invalid cucumber', {
          skinToughness: 'high'
        });
        err.output.payload.data = err.data;
        next(err);
      });
      return app;
    });
    beforeEach(function(done){
      request.get('/error', function(err, _response){
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
