const Boom = require('boom');

module.exports = ()=>{
  return (err, req, res, next)=>{
    if(!(err instanceof Error)){
      err = new Error(err);
    }
    const status = err.statusCode || err.status;
    Boom.wrap(err, status)
    err.reformat()
    res.set(err.output.headers);
    res.status(err.output.statusCode);
    res.body = err.output.payload;
    res.json(res.body);
  }
}
