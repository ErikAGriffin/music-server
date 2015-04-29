// (function() {

  var async = require('async');

  var getHostObject = function(redis, hostName, callback) {

    var hostObject = {
      hostName: hostName,
      pushers: [],
      tracklist: []
    };

    var getSongObject = function(err,song) {
      console.log('song got!');
      hostObject.tracklist.push(song);
    };

    var getSongs = function() {
      redis.lrange(hostName+":songs",0,-1, function(err,data) {
        if (err) {console.log('Error reading songs! '+hostName+'\n'+err);}
        for(var i=0;i<data.length;i++) {
          redis.hgetall(hostName+":song:"+data[i], getSongObject);
        }
      });
    };

    var getPusherObject = function(err,pusher) {
      console.log('pusher got!');
      hostObject.pushers.push(pusher);
    };

    var getPushers = function() {
      redis.smembers(hostName+":pushers", function(err, data) {
        if (err) {console.log('Error reading pushers! '+hostName+'\n'+err);}
        for(var i=0;i<data.length;i++) {
          redis.hgetall(hostName+":pusher:"+data[i], getPusherObject);
        }
      });
    };

    async.parallel([
      function(callback) {
        redis.smembers(hostName+":pushers", function(err,data) {
          if (err) {console.log('Erroar.');}
          for (var i=0;i<data.length;i++) {
            console.log('I dont get it');
          }
        });
      },
      function(callback) {
        getSongs();
      }
    ],callback(hostObject));

  };


  module.exports = getHostObject;

// }());
