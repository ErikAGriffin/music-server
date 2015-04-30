(function() {

  var async = require('async');

  var updateSongPosition = function(redis, update, callback) {

    // update is object of the form
    // {hostName: , trackID: , time: }

    // Find track in question.

    // Update its position property in the database
    // using given time

    // Write to redis

  };

  module.exports = updateSongPosition;


}());