if (process.env.NODE_ENV === 'production') {
  require('./dist');
} else {
  require('ts-node/register');
  require('./src');
}