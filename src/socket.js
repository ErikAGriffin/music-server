
var fs = require('fs');

var socket = function(io, redis) {

  var checkClient = function(array, clientID, callback) {
    if(!array.length) {array.push({id:clientID,played:false,out:false});}
    else {
      var result = array.filter(function(pusher) {
        return pusher.id === clientID;
      });
      if (!result.length) {
        array.push({id:clientID,played:false,out:false});
      }
    }
  };

  io.on('connection', function(socket) {

    // --------
    // May be able to re-use getHostObject.js here somehow


    socket.on('add song', function(message) {
      var hostName = message.hostName;
      var song = message.song;
      var filepath = './files/'+hostName+'.json';
      var hostObject = {
        hostName:hostName,
        pushers: [],
        tracklist: []
      };

      // Push <song> to tracklist
      // Add pusherID to <hostName>:pushers
      // and full object to <hostName>:pusher:<pusherID>

      console.log(song.pusher);

      redis.sadd(hostName+":pushers",song.pusher);

      redis.smembers(hostName+":pushers", function(err, data) {

        console.log('some shit went down');
        console.log(data);

      });


      fs.readFile(filepath,'utf-8',function(err,data) {

        // Handle server shutdown here vvv
        if(err) {data = "{\"tracklist\":[],\"pushers\":[]}";}

        hostObject = JSON.parse(data);
        hostObject.tracklist.push(song);
        // Is this guaranteed to complete before fs.writeFile???
        // Somehow I don't think so.
        checkClient(hostObject.pushers,song.pusher);

        fs.writeFile(filepath,JSON.stringify(hostObject), function(err) {
          if(err){console.log('error adding new track to file:\n'+err);}
        });
        io.emit('add song to '+hostName, [song, hostObject.pushers]);
      });
    }); // end 'add song'

    socket.on('disconnect', function() {
    });

  });
};

module.exports = socket;