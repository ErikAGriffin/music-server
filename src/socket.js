
var fs = require('fs');

var socket = function(io, redis) {

  io.on('connection', function(socket) {

    // --------
    // May be able to re-use getHostObject.js here somehow


    socket.on('add song', function(message) {
      var hostName = message.hostName;
      var song = message.song;
      var hostObject = {
        hostName:hostName,
        pushers: [],
        tracklist: []
      };

      // --- READ from DB and create current hostObject ---
      // - or perhaps do the DBwrites first, then instead
      // - of explicitly adding te objects to hostObject
      // - just create it after the DB writes.

      // Store song and add to tracklist.
      // - Opted for list to preserve order, but perhaps
      // - a sorted set would be more appropriate
      // - if I don't want to allow duplicates.

      // Also.. later functionality I am not pushing every song..
      // rather getting the next legal user's top song.

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
      });

      // Perhaps asynchronicity is hurting me here..
      // may need to pipeline the above commands and somehow use this
      // in a callback.
      io.emit('add song to '+hostName, [song, hostObject.pushers]);

    }); // end 'add song'

    socket.on('disconnect', function() {
    });

  });
};

module.exports = socket;
