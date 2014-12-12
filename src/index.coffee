Boom = require 'boom'

module.exports = ->
  (err, req, res, next) ->
    Boom.wrap(err)
    res.set err.output.headers
    res.status err.output.statusCode
    res.json err.output.payload
