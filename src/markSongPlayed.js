(function() {


  var async = require('async');

  var markSongPlayed = function(redis, update, callback) {

    // update is object of form
    // {hostname: , songID: , pusherID: }

    // Get tracklist of hostName

    // Find track matching ID. (&& pusher?)

    // Mark track as played

    // Mark pusher as played?

    // Update these in redis.


  };

  module.exports = markSongPlayed;

}());
