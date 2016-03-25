crashpad = require '..'
express = require 'express'
Boom = require 'boom'
namespacedRequest = require 'namespaced-request'
{expect} = require 'chai'

withServer = (createServer) ->
  beforeEach (done) ->
    app = createServer(express())
    app.use crashpad()
    @server = app.listen port, done
    @request = namespacedRequest "http://localhost:#{port}"

  afterEach (done) ->
    @server.close (done)

port = process.env['PORT'] or 291084

describe 'crashpad', ->

  describe 'generic (non-boom) errors', ->

    withServer (app) ->
      app.get '/error', (req, res, next) ->
        next new Error('what happened!?')

    beforeEach (done) ->
      @request.get '/error', (err, @response) =>
        done()

    it 'returns with a 500 status code', ->
      expect(@response.statusCode).to.equal 500

    it "returns with a json-formatted body", ->
      expect(@response.body).to.deep.equal
        statusCode: 500
        error: 'Internal Server Error'
        message: 'An internal server error occurred'

  describe 'generic (non-boom) error with a status property', ->

    withServer (app) ->
      app.get '/error', (req, res, next) ->
        error = new Error()
        error.name = 'CustomError'
        error.message = 'you messed up, yo'
        error.status = 400
        next error

    beforeEach (done) ->
      @request.get '/error', (err, @response) =>
        done()

    it "returns with the supplied status", ->
      expect(@response.statusCode).to.equal 400

    it "returns with a json-formatted body", ->
      expect(@response.body).to.deep.equal
        statusCode: 400
        error: 'Bad Request'
        message: 'you messed up, yo'

  describe 'unauthorized requests', ->

    withServer (app) ->
      app.get '/error', (req, res, next) ->
        next Boom.unauthorized 'get off my lawn!', 'sample',
          ttl: 0
          cache: null
          foo: 'bar'

    beforeEach (done) ->
      @request.get '/error', (err, @response) =>
        done()

    it "returns with the status code", ->
      expect(@response.statusCode).to.equal 401

    it "returns with a json-formatted body", ->
      expect(@response.body).to.deep.contain
        statusCode: 401
        error: 'Unauthorized'
        message: 'get off my lawn!'

    it "returns with the correct headers", ->
      expect(@response.headers).to.have.property 'www-authenticate', 'sample ttl="0", cache="", foo="bar", error="get off my lawn!"'


  describe 'non-Error string errors', ->
    withServer (app) ->
      app.get '/error', (req, res, next) ->
        next 'poorly implemented error'

    beforeEach (done) ->
      @request.get '/error', (err, @response) =>
        done()

    it 'returns with a 500 status code', ->
      expect(@response.statusCode).to.equal 500

    it "returns with a json-formatted body", ->
      expect(@response.body).to.deep.equal
        statusCode: 500
        error: 'Internal Server Error'
        message: 'An internal server error occurred'
