(function() {

  var markSongPlayed = function(redis, update) {

    var songKey = update.hostName+":song:"+update.songID;
    var pusherKey = update.hostName+":pusher:"+update.pusherID;

    redis.get(songKey, function(err,data) {
      var song = JSON.parse(data);
      song.played = true;
      redis.set(songKey,JSON.stringify(song));
    });

    redis.get(pusherKey, function(err,data) {
      var pusher = JSON.parse(data);
      pusher.played = true;
      redis.set(pusherKey,JSON.stringify(pusher));
    });

    //redis.hset(songKey,'played',true);
    //redis.hset(pusherKey,'played',true);

  };

  module.exports = markSongPlayed;

}());
