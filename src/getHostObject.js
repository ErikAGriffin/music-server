(function() {

  var async = require('async');

  var getHostObject = function(redis, hostName, callback) {

    var hostObject = {
      hostName: hostName,
      pushers: [],
      tracklist: []
    };

    var getSongObject = function(songID) {
      return function(callback) {
        redis.hgetall(hostName+":song:"+songID, callback);
      };
    };

    var getSongs = function(cb) {
      redis.lrange(hostName+":songs",0,-1, function(err,data) {
        var asyncArray = [];
        if (err) {console.log('Error reading songs! '+hostName+'\n'+err);}
        for(var i=0;i<data.length;i++) {
          asyncArray.push(getSongObject(data[i]));
        }
        async.parallel(asyncArray, function(err, result) {
          cb(null, result);
        });
      });
    };

    var getPusherObject = function(pusherID) {
      return function(callback) {
        redis.hgetall(hostName+":pusher:"+pusherID,callback);
      };
    };

    var getPushers = function(cb) {
      redis.smembers(hostName+":pushers", function(err, data) {
        var asyncArray = [];
        if (err) {console.log('Error reading pushers! '+hostName+'\n'+err);}
        for(var i=0;i<data.length;i++) {
          asyncArray.push(getPusherObject(data[i]));
        }
        async.parallel(asyncArray, function(err, result) {
          cb(null, result);
        });
      });
    };

    async.parallel([
      getPushers,
      getSongs
    ],function(err, results){
      hostObject.pushers = results[0];
      hostObject.tracklist = results[1];
      callback(hostObject);
    });
  };

  module.exports = getHostObject;

}());
