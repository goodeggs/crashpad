import { Boom } from "@hapi/boom";
import { Request, Response } from "express";

export class BoomableError extends Error {
  public statusCode = 500;
}

export default function () {
  return (
    err: Boom | BoomableError | Error,
    _req: Request,
    res: Response,
    _next: (err: Error) => any
  ) => {
    if (!(err instanceof Error)) {
      err = new Error(err);
    }
    let boom: Boom;
    if (err instanceof Boom) {
      boom = err;
    } else {
      let statusCode = 500;
      if (err instanceof BoomableError) {
        statusCode = err.statusCode || 500;
      }
      boom = new Boom(err, { statusCode });
    }
    boom.reformat();
    res.set(boom.output.headers);
    res.status(boom.output.statusCode);
    const body = boom.output.payload;
    res.json(body);
  };
}
