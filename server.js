(function() {

  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var root = __dirname + '/public/';
  var port = process.env.PORT || 3000;

  app.use(express.static(root));

  // -- FileSystem --

  var fs = require('fs');

  // -- Socket.io --

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

  var io = require('socket.io')(server);

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

  // -- Express Session --

  var session = require('express-session');
  var genuuid = require('./controllers/uuid');

  app.use(session({
    genid: function(req) {return genuuid();},
    secret: 'lost boys'
  }));

  // -- EJS Templates --
  app.set('view engine','ejs');
  app.set('views', root+'views/');

  // -- Database --

  var mongojs = require('mongojs');
  var db = mongojs((process.env.MONGOLAB_URI || 'music-server-'+process.env.MUSIC_SERVER_ENV), ['users']);
  var bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({'extended':'true'}));

  // -- BCrypt --
  var bcrypt = require('./controllers/bcrypt');


  // --- Server Start ---
  server.listen(port, function(){
    console.log("Listening on server port " + port);
  });


  // ++++ Routes ++++

  app.get('/', function(req, res) {
    var sess = req.session;
    res.render('home');
  });

  app.get('/server', function(req, res) {
    var sess = req.session;
    sess.hostName = "london";
    if (!sess.hostName) {
      sess.hostName = genuuid.genServerID();
    }
    res.render('host', {hostName: sess.hostName});
  });

  // --- Track Management ---

  app.post('/gettracklist', function(req, res) {
    var sess = req.session;
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
      res.json(JSON.parse(data));
    });
  });

  app.post('/markplayed/:hostName/:trackID/:pusher', function(req,res) {
    console.log('Marking song '+req.params.trackID+' as played.');
    var filepath = './files/'+req.params.hostName+'.json';
    fs.readFile(filepath,'utf-8',function(err, data) {
      if(err){console.log('error marking song '+req.params.trackID);}
      var serverObject = JSON.parse(data);
      for (var i=0;i<serverObject.tracklist.length;i++) {
        var song = serverObject.tracklist[i];
        if(song.id == req.params.trackID) {
          song.played = true;
          break;
        }
      }
      for (var j=0;j<serverObject.pushers.length;j++) {
        var pusher = serverObject.pushers[j];
        if (pusher.id == req.params.pusher) {
          pusher.played = true;
          break;
        }
      }
      updateTracklist(filepath,JSON.stringify(serverObject));
      res.json({});
    });
  });

  var updateTracklist = function(filepath,data) {
    fs.writeFile(filepath,data, function(err) {
      if(err){console.log('[x] error updating tracklist\n'+err);}
    });
  };


  app.post('/updatetrack/:hostName/:trackID/:time', function(req,res) {
    var filepath = './files/'+req.params.hostName+'.json';
    fs.readFile(filepath,'utf-8',function(err,data) {
      if(err) {
        console.log('[updatetrack] Error reading '+req.params.hostName+"\n"+err);}
      else {
        var serverObject = JSON.parse(data);
        for (var i=0;i<serverObject.tracklist.length;i++) {
          if (serverObject.tracklist[i].id == req.params.trackID) {
            serverObject.tracklist[i].position = req.params.time;
            updateTracklist(filepath,JSON.stringify(serverObject));
            break;
          }
        }
      }
      res.json({});
    });
  });

  // --- Host Management ---

  app.post('/checkhost/:hostName', function(req,res) {

    var exists = false;

    fs.readFile('./files/'+req.params.hostName+'.json','utf-8', function(err, data) {
      if (err) {
        console.log('server does not exist yet.');
      }
      else {exists = true;}
      res.json(exists);
    });


  });

  // ..Temp user management..

  app.post('/getclient', function(req,res) {
    var sess = req.session;
    res.json({userid:sess.id});
  });


  // --- User Management ---

  app.get('/login', function(req, res) {
    var sess = req.session;
    res.render('login', {user:sess.user});
  });

  app.post('/createuser', function(req,res) {
    var sess = req.session;

    bcrypt.createUser(req.body.email, req.body.password, function(user) {
      db.users.insert(user, function(err,docs) {
        if (err) {return console.error(err);}
        console.log('Stored user');
      });
    });
    // What should the session store? Something more secure?
    // Can users create their own cookies?
    sess.user = req.body.email;
    res.redirect('/');
  });

  app.post('/checkunique/:email', function(req,res) {

    db.users.findOne({email: req.params.email}, function(err,doc) {
      if (err) {console.log(err);}
      else if (doc) {
        res.json({unique: false});
      }
      else {
        res.json({unique: true});
      }
    });
    console.log("Queried "+req.params.email);
  });


  // Where is this used?
  module.exports = server;
}());
