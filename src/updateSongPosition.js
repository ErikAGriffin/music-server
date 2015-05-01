(function() {

  var updateSongPosition = function(redis, update) {

    if (update.songID === 'undefined') {return;}

    var songKey = update.hostName+":song:"+update.songID;

    var updatePosition = function(err, songString) {
      var song = JSON.parse(songString);
      song.position = update.time;
      redis.set(songKey, JSON.stringify(song));
    };

    redis.get(songKey, updatePosition);
  };

  module.exports = updateSongPosition;

}());
