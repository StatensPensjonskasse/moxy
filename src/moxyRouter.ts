import * as Express from 'express';
import { getMode, MoxyMode, setMode } from './types';

export const moxyRouter = (): Express.Router => {
  const router = Express.Router();

  router.post('/moxy/mode', (req: any, res: any): any => {
    const status: MoxyMode = req.query.status?.toUpperCase();
    if (MoxyMode[status] !== undefined) {
      setMode(status);
      return res.send(status);
    }

    return res.status(400).send(`Moxy: mode ${status} is not recognized`);
  });

  router.get('/moxy/mode', (req: any, res: any): any => {
    return res.send(getMode());
  });

  return router;
};
