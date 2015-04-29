
var fs = require('fs');

var socket = function(io, redis) {

//   var checkClient = function(array, clientID, callback) {
//     if(!array.length) {array.push({id:clientID,played:false,out:false});}
//     else {
//       var result = array.filter(function(pusher) {
//         return pusher.id === clientID;
//       });
//       if (!result.length) {
//         array.push({id:clientID,played:false,out:false});
//       }
//     }
//   };

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

      // Store song and add to tracklist.
      // Perhaps also use ismember here if duplicates create a problem.

      redis.sadd(hostName+":songs",song.id);
      redis.hmset(hostName+":song:"+song.id, song);
      hostObject.tracklist.push(song);

      redis.sismember(hostName+":pushers",song.pusher, function(err, result) {
        if(!result) {
          console.log('pusher added!');
          var pusher = {id:song.pusher,played:false,penalty:0};
          redis.sadd(hostName+":pushers",song.pusher);
          redis.hmset(hostName+":pusher:"+song.pusher,pusher);
          hostObject.pushers.push(pusher);
        }
      });


      fs.readFile(filepath,'utf-8',function(err,data) {

        // Handle server shutdown here vvv
        if(err) {data = "{\"tracklist\":[],\"pushers\":[]}";}

        hostObject = JSON.parse(data);
        // Is this guaranteed to complete before fs.writeFile???
        // Somehow I don't think so.
//         checkClient(hostObject.pushers,song.pusher);

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
