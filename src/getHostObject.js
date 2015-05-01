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
        redis.get(hostName+":song:"+songID, function(err,data){
          callback(err,JSON.parse(data));
        });
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
        redis.get(hostName+":pusher:"+pusherID,function(err,data){
          callback(err,JSON.parse(data));
        });
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
