const Redis =  require('ioredis');

const Client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  });
  
module.exports = Client;