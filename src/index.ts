import express from 'express';
import helmet from 'helmet';
import KBBI from './lib/kbbi';
import apiHandlers from './api';

const PORT = process.env.PORT || '9064';
const kbbiInstance = new KBBI();
const app = express();

app.use(helmet());
app.use('/api', apiHandlers(kbbiInstance));

app.listen(PORT, () => {
  console.log('Ready');
});