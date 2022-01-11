import { CacheControl } from '../types';
import { ErrorType } from '../moxy';

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
  lastFetched: Date;
}

export const mongoDbCacheControl = (mongoose: MongooseType): CacheControl => {
  let model: any;
  const getModel = (): any => {
    if (model !== undefined) {
      return model;
    }

    const schema = mongoose.Schema({
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
      lastFetched: {
        type: mongoose.Schema.Types.Date,
        default: new Date(),
      },
    });

    model = mongoose.model('record', schema);
    return model;
  };

  const mapResult = (databaseRow: any): Entry => {
    return {
      uri: databaseRow.uri,
      host: databaseRow.host,
      method: databaseRow.method,
      headers: databaseRow.headers,
      body: databaseRow.body,
      lastFetched: databaseRow.lastFetched,
    };
  };

  const findRow = (uri: string, method: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      let row: Entry = undefined;
      getModel()
        .find({
          uri,
          method,
        })
        .then((rows: Entry[]) => {
          if (rows.length === 0) {
            return reject({
              status: 404,
              message: 'Moxy did not find anything',
            });
          }
          if (rows.length > 1) {
            return reject({
              status: 500,
              message:
                'Corrupted state, Moxy found more than one record for uri',
            });
          }
          row = rows[0];
          row.lastFetched = new Date();

          return getModel().updateOne({ uri, method }, row);
        })
        .then(() => {
          return resolve(row);
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
          return getModel().updateOne({ _id: row._id }, newObject);
        })
        .catch(() => {
          const m = getModel();
          return new m(newObject).save();
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
        .catch((error: ErrorType) => {
          return reject(error);
        });
    });
  };

  return {
    record,
    find,
  };
};
