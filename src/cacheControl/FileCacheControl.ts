import { CacheControl } from '../types';
import fs from 'fs';
import path from 'path';

export const fileCacheControl = (
  relativeFileName = 'cache.json'
): CacheControl => {
  let cache: any = {};
  const cacheFile = path.join(process.cwd(), relativeFileName);

  fs.exists(cacheFile, (exists: boolean) => {
    if (!exists) {
      fs.writeFile(cacheFile, JSON.stringify({}), (err: Error) => {
        if (err) throw err;
      });
    } else {
      fs.readFile(cacheFile, 'utf8', (err: Error, data: any) => {
        if (err) throw err;
        cache = JSON.parse(data);
      });
    }
  });

  const record = (key: string, value: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const requests = cache[key] || [];

      if (requests.length === 0) {
        cache[key] = [value];
      } else {
        for (let i = 0; i < requests.length; i++) {
          if (requests[i].method === value.method) {
            requests[i] = value;
          }
        }
      }

      return fs.writeFile(cacheFile, JSON.stringify(cache), (err: Error) => {
        if (err) return reject('Could not write to file');
        return resolve(value);
      });
    });
  };

  const find = (key: string, method: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const requests: any = cache[key];
      if (requests === undefined || requests.length === 0) {
        return reject('No cache for request');
      }

      for (const request of requests) {
        if (request.method === method) {
          return resolve(request);
        }
      }

      return reject('Nothing found in list');
    });
  };

  return {
    record,
    find,
  };
};
