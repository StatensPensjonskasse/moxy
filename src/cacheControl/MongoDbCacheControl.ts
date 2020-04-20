import { CacheControl } from '../types';

interface MongooseType {
  Schema: any;
  model: any;
}

interface Entry {
  uri: string;
  host: string;
  method: string;
  headers: string;
  body: any;
}

export const mongoDbCacheControl = (mongoose: MongooseType): CacheControl => {
  const model = mongoose.Schema({
    uri: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    host: String,
    method: String,
    headers: {
      type: mongoose.Schema.Types.Mixed,
    },
    body: {
      type: mongoose.Schema.Types.Mixed,
    },
  });

  const Record = mongoose.model('record', model);

  const mapResult = (databaseRow: any): Entry => {
    return {
      uri: databaseRow.uri,
      host: databaseRow.host,
      method: databaseRow.method,
      headers: databaseRow.headers,
      body: databaseRow.body,
    };
  };

  const findRow = (uri: string, method: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      Record.find({
        uri,
      }).then((e: any) => {
        if (e.length === 0) {
          return reject();
        }

        for (let i = 0; i < e.length; e++) {
          if (e[i].method === method) {
            return resolve(e[i]);
          }
        }

        return reject();
      });
    });
  };

  const record = (uri: string, value: any): Promise<any> => {
    return new Promise((resolve) => {
      const newObject = {
        uri,
        ...value,
      };
      findRow(uri, value.method)
        .then((row: any) => {
          return Record.updateOne({ _id: row._id }, newObject);
        })
        .catch(() => {
          return new Record(newObject).save();
        })
        .then(() => {
          return resolve(newObject);
        });
    });
  };

  const find = (uri: string, method: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      findRow(uri, method)
        .then((row: any) => {
          return resolve(mapResult(row));
        })
        .catch(() => {
          return reject();
        });
    });
  };

  return {
    record,
    find,
  };
};
