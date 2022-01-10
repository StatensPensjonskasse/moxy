import { memoryCacheControl } from './cacheControl/MemoryCacheControl';
import { getMode, MoxyMode, setMode } from './types';

export interface ErrorType {
  status: number;
  message: string;
}

export default ({
  cacheControl = memoryCacheControl(),
  transformer = (data: any): any => data,
  mode = MoxyMode.PASSTHROUGH,
} = {}): any => {
  setMode(mode);
  if (cacheControl.record === undefined) {
    throw Error(
      'cacheControl has to have a function defining how to record responses'
    );
  }
  if (cacheControl.find === undefined) {
    throw Error(
      'cacheControl has to have a function defining how to find records'
    );
  }

  const record = (req: any, res: any): void => {
    const oldWrite = res.write;
    const oldEnd = res.end;

    const chunks: any = [];
    res.write = function (chunk: any): void {
      chunks.push(chunk);
      // eslint-disable-next-line prefer-rest-params
      oldWrite.apply(res, arguments);
    };

    res.end = function (chunk: any): Promise<any> {
      if (chunk) {
        chunks.push(chunk);
      }

      let data: any;
      try {
        data = Buffer.concat(chunks).toString('utf8');
      } catch {
        data = chunks.toString();
      }

      const headers: any = {};
      for (const header of Object.keys(res.getHeaders())) {
        headers[header] = res.getHeaders()[header];
      }
      // eslint-disable-next-line prefer-rest-params
      oldEnd.apply(res, arguments);
      return cacheControl.record(req.originalUrl, {
        uri: req.originalUrl,
        host: req.hostname,
        method: req.method,
        body: transformer(data),
        headers,
      });
    };
  };

  return (req: any, res: any, next: any): any => {
    const mode = getMode();
    if (mode === MoxyMode.PASSTHROUGH) {
      return next();
    }

    if (mode === MoxyMode.RECORD_PLAYBACK) {
      return cacheControl
        .find(req.originalUrl, req.method)
        .catch(() => {
          return record(req, res);
        })
        .then((data: any) => {
          if (data === undefined) {
            return next();
          }

          const headers = data.headers;
          for (const header in headers) {
            res.set(header, headers[header]);
          }

          if (
            headers['content-type'] !== undefined &&
            headers['content-type'].indexOf('json') > -1 &&
            isNaN(Number(data.body))
          ) {
            return res.send(JSON.parse(data.body));
          }
          return res.send(data.body);
        });
    }

    if (mode === MoxyMode.PLAYBACK) {
      return cacheControl
        .find(req.originalUrl, req.method)
        .then((data: any) => {
          if (data === undefined) {
            return next();
          }

          const headers = data.headers;
          for (const header in headers) {
            res.set(header, headers[header]);
          }

          if (
            headers['content-type'] !== undefined &&
            headers['content-type'].indexOf('json') > -1 &&
            isNaN(Number(data.body))
          ) {
            return res.send(JSON.parse(data.body));
          }
          return res.send(data.body);
        })
        .catch((error: ErrorType) => {
          if (req.method === 'GET') {
            return res.status(error.status).send(error.message);
          } else {
            return res.sendStatus(405);
          }
        });
    }

    if (mode === MoxyMode.RECORD) {
      record(req, res);
      return next();
    }
  };
};
