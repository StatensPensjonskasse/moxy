import { CacheControl } from '../types';

const cache: any = {};

const record = (key: string, value: any): Promise<any> => {
  return new Promise((resolve) => {
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
    return resolve(value);
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

export const memoryCacheControl = (): CacheControl => ({
  record,
  find,
});
