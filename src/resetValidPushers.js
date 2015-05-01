(function() {

  var resetValidPushers = function(redis, hostName) {

    // currently just resetting for ALL pushers.

    var updatePlayed = function(err, data) {
      var pusher = JSON.parse(data);
      pusher.played = false;
      redis.set(hostName+":pusher:"+pusher.id,JSON.stringify(pusher));
    };

    redis.smembers(hostName+":pushers", function(err, data) {
      for(var i=0;i<data.length;i++) {
        redis.get(hostName+":pusher:"+data[i], updatePlayed);
      }
      //for(var i=0;i<data.length;i++) {
        //redis.hset(hostName+":pusher:"+data[i],'played',false);
      //}
    });

  };

  module.exports = resetValidPushers;


})();
