(function() {

//   var async = require('async');

  var resetValidPushers = function(redis, hostName) {

    // takes hostName

    // currently just resetting for ALL pushers.

    redis.smembers(hostName+":pushers", function(err, data) {
      for(var i=0;i<pushers.length;i++) {
        redis.hset(hostName+":pusher:"+pusher[i],'played',false);
      }
    });


//     var getPushers = function(cb) {
//       redis.smembers(hostName+":pushers", cb);
//     };

//     async.waterfall([
//       getPushers,
//       function(pushers, cb) {
//         for(var i=0;i<pushers.length;i++) {
//           redis.hset(hostName+":pusher:"+pusher[i],'played',false);
//         }
//       }
//     ]);

  };

  module.exports = resetValidPushers;


})();
