crashpad = require '..'
express = require 'express'
Boom = require 'boom'
namespacedRequest = require 'namespaced-request'
{expect} = require 'chai'

port = process.env['PORT'] or 291084

describe 'crashpad', ->

  beforeEach (done) ->
    app = express()
    app.get '/error', (req, res, next) ->
      next Boom.unauthorized 'get off my lawn!', 'sample',
        ttl: 0
        cache: null
        foo: 'bar'
    app.use crashpad()
    @server = app.listen port, done
    @request = namespacedRequest "http://localhost:#{port}"

  afterEach (done) ->
    @server.close done

  describe 'unauthorized request', ->

    beforeEach (done) ->
      @request.get 'error', (err, @response) =>
        done()

    it "returns with the status code", ->
      expect(@response.statusCode).to.equal 401

    it "returns with a json-formatted body", ->
      expect(@response.body).to.deep.equal
        statusCode: 401
        error: 'Unauthorized'
        message: 'get off my lawn!'

    it "returns with the correct headers", ->
      expect(@response.headers).to.have.property 'www-authenticate', 'sample ttl="0", cache="", foo="bar", error="get off my lawn!"'
