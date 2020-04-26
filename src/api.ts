import {Router, Request, Response} from 'express';
import KBBI from './lib/kbbi';

export default function createApiHandlers(kbbi: KBBI) {
  const handler = Router();

  handler.get('/', (_, res: Response) => {
    res.write('Halo!');
  })

  handler.get('/search', (req: Request, res: Response) => {
    const {q = ''} = req.query;
    if (!q.length) return res.status(500).json({what: 'thefuck'});
    return kbbi.getDefinition(q.toString()).then(result => {
      return res.json(result);
    })
  });

  return handler;
}