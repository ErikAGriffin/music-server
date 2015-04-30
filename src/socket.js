
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
        redis.hmset(hostName+":song:"+song.id, song);
        hostObject.tracklist.push(song);

        redis.sismember(hostName+":pushers",song.pusher, function(err, result) {
          if(!result) {
            console.log('pusher added!');
            var pusher = {id:song.pusher,played:false,penalty:0};
            redis.sadd(hostName+":pushers",song.pusher);
            redis.hmset(hostName+":pusher:"+song.pusher,pusher);
            hostObject.pushers.push(pusher);
          }

          console.log('emitting host object');
          io.emit('add song to '+hostName, [song, hostObject.pushers]);
        });
      });

      // Also.. later functionality I am not pushing every song..
      // rather getting the next legal user's top song.
    }); // end 'add song'

    socket.on('disconnect', function() {
    });

  });
};

module.exports = socket;
