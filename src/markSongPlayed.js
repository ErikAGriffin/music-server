(function() {

  var markSongPlayed = function(redis, update) {

    var hostName = update.hostName;
    var songID = update.songID;
    var pusherID = update.pusherID;

    redis.hset(hostName+":song:"+songID,'played',true);
    redis.hset(hostName+":pusher:"+pusherID,'played',true);

  };

  module.exports = markSongPlayed;

}());
