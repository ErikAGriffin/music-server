var fs = require('fs');

function getHostTracklist(sess, callback) {

  var filepath = './files/'+sess.hostName+'.json';
    fs.readFile(filepath,'utf-8', function(err, data) {
      if (err) {
        console.log('unable to read tracklist file '+sess.hostName);
        console.log(err);
        data = "{\"hostName\":\""+sess.hostName+"\",\"tracklist\":[],\"pushers\":[]}";
        fs.writeFile(filepath,data,function(err) {
          if (err){console.log('error creating file:\n'+err);}
          console.log('created new file');
        });
      }
      callback(data);
  });
}

module.exports = {getHostTracklist: getHostTracklist};