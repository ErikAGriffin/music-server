(function() {

  var Redis = require('ioredis');

  var redis;

  if (process.env.REDISCLOUD_URL) {
    redis = new Redis(process.env.REDISCLOUD_URL);
  }
  else {
    redis = new Redis();
  }

  module.exports = redis;

}());