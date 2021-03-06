
var fs = require('fs');
var getHostObject = require('./getHostObject');

var socket = function(io, redis) {

  io.on('connection', function(socket) {

    socket.on('add song', function(message) {
      var hostName = message.hostName;
      var song = message.song;

      // Would there be any benefit to doing the DB
      // writes first and then getting the hostObject?

      getHostObject(redis,hostName, function(returnedObject) {
        hostObject = returnedObject;

        redis.rpush(hostName+":songs",song.id);
        redis.set(hostName+":song:"+song.id, JSON.stringify(song));
        hostObject.tracklist.push(song);

        redis.sismember(hostName+":pushers",song.pusher, function(err, result) {
          if(!result) {
            var pusher = {id:song.pusher,played:false,penalty:0};
            redis.sadd(hostName+":pushers",song.pusher);
            redis.set(hostName+":pusher:"+song.pusher,JSON.stringify(pusher));
            hostObject.pushers.push(pusher);
          }

          io.emit('add song to '+hostName, [song, hostObject.pushers]);
        });
      });

    });

    socket.on('disconnect', function() {
    });

  });
};

module.exports = socket;
