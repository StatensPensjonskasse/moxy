export enum MoxyMode {
  PASSTHROUGH = 'PASSTHROUGH',
  PLAYBACK = 'PLAYBACK',
  RECORD = 'RECORD',
  RECORD_PLAYBACK = 'RECORD_PLAYBACK',
}

let mode = MoxyMode.PASSTHROUGH;

export const setMode = (newMode: MoxyMode): void => {
  mode = newMode;
};

export const getMode = (): MoxyMode => {
  return mode;
};

export interface CacheControl {
  record: (key: string, value: any) => Promise<any>;
  find: (key: string, method: string) => Promise<any>;
}
