(function() {

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

    var getSongs = function(cb) {
      redis.lrange(hostName+":songs",0,-1, function(err,data) {
        if (err) {console.log('Error reading songs! '+hostName+'\n'+err);}
        cb(null,data);
      });
    };

    var getPusherObject = function(err,pusher) {
      console.log('pusher got!');
      hostObject.pushers.push(pusher);
    };

    var getPushers = function(cb) {
      redis.smembers(hostName+":pushers", function(err, data) {
        if (err) {console.log('Error reading pushers! '+hostName+'\n'+err);}
        cb(null, data);
      });
    };

    async.waterfall([

      function(cb) {
        redis.smembers(hostName+":pushers", function(err, data) {
          if (err) {console.log('Error reading pushers! '+hostName+'\n'+err);}
          cb(null,data);
        });
      },
      function(pushers, cb) {
        var temp = [];
        for(var i=0;i<pushers.length;i++) {
          temp.push((function(pusher){
            return function(callback){
              redis.hgetall(hostName+":pusher:"+pusher, callback);
            };
          })(pushers[i]));
        }
        async.parallel(temp, function(err, res) {
          console.log('where am I?');
          console.log(res);
        });
      }
    ],function(err, result){
      console.log('Maybe?');
      console.log(result);
    });


  };


  module.exports = getHostObject;

}());
