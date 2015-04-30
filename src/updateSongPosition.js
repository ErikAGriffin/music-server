(function() {

  var updateSongPosition = function(redis, update) {

    var hostName = update.hostName;
    var songID = update.songID;
    var time = update.time;

    redis.hset(hostName+":song:"+songID,'position',time);

  };

  module.exports = updateSongPosition;

}());
