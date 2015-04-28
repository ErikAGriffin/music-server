(function() {

  var getHostObject = function(redis, hostName, callback) {

    var hostObject = {
      hostName: hostName,
      pushers: [],
      tracklist: []
    };

    redis.smembers(hostName+":pushers", function(err,data) {
      console.log(data);
      for (var i=0;i<data.length;i++) {
        console.log(data[i]);
        console.log(redis.hgetall(data[i]));
        hostObject.pushers.push(redis.hgetall(data[i]));
      }
      console.log(hostObject.pushers.length);
      console.log(hostObject.pushers.length);
      console.log(hostObject.pushers.length);

      callback(hostObject);
    });



  };


  module.exports = getHostObject;

}());
