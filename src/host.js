(function() {

  var getHostObject = function(redis, hostName, callback) {
    console.log('Tis working');
    console.log(hostName);
    redis.get(hostName, function(err, data) {
      console.log('Callback from redis get.');
      console.log(err);
      console.log(data);
    });
  };


  module.exports = getHostObject;

}());