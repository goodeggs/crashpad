Boom = require 'boom'

module.exports = ->
  (err, req, res, next) ->
    unless err instanceof Error then err = new Error err
    status = err.statusCode or err.status
    Boom.wrap(err, status)
    err.reformat()
    res.set err.output.headers
    res.status err.output.statusCode
    res.body = err.output.payload
    res.json res.body
