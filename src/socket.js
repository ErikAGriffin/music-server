
var fs = require('fs');

var socket = function(io) {

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

    socket.on('add song', function(newSong) {
      var hostName = newSong.hostName;
      var filepath = './files/'+hostName+'.json';
      var serverObject = {};
      fs.readFile(filepath,'utf-8',function(err,data) {

        // Handle server shutdown here vvv
        if(err) {console.log('error reading file '+hostName+' while adding song');
          data = "{\"tracklist\":[],\"pushers\":[]}";}

        serverObject = JSON.parse(data);
        serverObject.tracklist.push(newSong.song);
        // Is this guaranteed to complete before fs.writeFile???
        // Somehow I don't think so.
        checkClient(serverObject.pushers,newSong.song.pusher);

        fs.writeFile(filepath,JSON.stringify(serverObject), function(err) {
          if(err){console.log('error adding new track to file:\n'+err);}
        });
        io.emit('add song to '+hostName, [newSong.song, serverObject.pushers]);
      });
    }); // end 'add song'

    socket.on('disconnect', function() {
    });

  });
};

module.exports = socket;