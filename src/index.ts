import {Boom, isBoom} from '@hapi/boom';
import {ErrorRequestHandler} from 'express';

export default function (): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (!(err instanceof Error)) {
      err = new Error(err);
    }
    let boom: Boom;
    if (isBoom(err)) {
      boom = err;
    } else {
      const statusCode = err.statusCode ?? err.status;
      boom = new Boom(err, {statusCode});
    }
    boom.reformat();
    res.set(boom.output.headers);
    res.status(boom.output.statusCode);
    // @ts-ignore need to save to .body
    res.body = boom.output.payload;
    // @ts-ignore need to save to .body
    res.json(res.body);
  };
}
