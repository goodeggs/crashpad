Boom = require 'boom'

module.exports = ->
  (err, req, res, next) ->
    unless err instanceof Error then err = new Error err
    status = err.statusCode or err.status
    message = if status then err.message else null
    Boom.wrap(err, status, message)
    err.reformat()
    res.set err.output.headers
    res.status err.output.statusCode
    res.json err.output.payload
