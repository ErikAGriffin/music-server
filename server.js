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
  var io = require('socket.io')(server);

  io.on('connection', function(socket) {

    socket.on('add song', function(newSong) {
      console.log(newSong);
      var hostName = newSong.hostName;
      fs.readFile('./files/'+hostName+'.json','utf-8',function(err,data) {
        // Handle server shutdown here.
        if(err) {console.log('error reading file '+hostName+' while adding song');
          data = "[]";}
        var tracklist = JSON.parse(data);
        tracklist.push(newSong.song);
        fs.writeFile('./files/'+hostName+'.json',JSON.stringify(tracklist), function(err) {
          if(err){console.log('error adding new track to file:\n'+err);}
        });
      });
      io.emit('add song to '+hostName, newSong.song);
    }); // end 'add song'

    socket.on('song played', function(songID) {
      console.log('Marking song '+songID+' as played.');
      fs.readFile('./files/london.json','utf-8',function(err,data) {
        if(err) {console.log('error marking song '+songID);}
        var tracklist = JSON.parse(data);
        for (var i=0;i<tracklist.length;i++) {
          if (tracklist[i].id === songID) {
            tracklist[i].played = true;
            break;
          }
        }
        fs.writeFile('./files/london.json',JSON.stringify(tracklist), function(err) {
          if(err){console.log('error writing track played '+songID);}
        });
      });

    }); // end song played


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

    var obj = {};
    obj.hostName = sess.hostName;
    fs.readFile('./files/'+sess.hostName+'.json','utf-8', function(err, data) {
      if (err) {
        console.log('unable to read tracklist file '+sess.hostName);
        console.log(err);
        data = "[]";
        fs.writeFile('./files/'+sess.hostName+'.json',"[]",function(err) {
          if (err){console.log('error creating file:\n'+err);}
          console.log('created new file');
        });
      }
      obj.tracklist = JSON.parse(data);
      res.json(obj);
    });
  });

  var updateTracklist = function(filepath,data) {
    fs.writeFile(filepath,data, function(err) {
      if(err){console.log('error updating track position\n'+err);}
    });
  };

  app.post('/updatetrack/:hostName/:trackID/:time', function(req,res) {
    var filepath = './files/'+req.params.hostName+'.json';
    fs.readFile(filepath,'utf-8',function(err,data) {
      if(err) {
        console.log('[updatetrack] Error reading '+req.params.hostName);}
      else {
        var tracklist = JSON.parse(data);
        for (var i=0;i<tracklist.length;i++) {
          if (tracklist[i].id == req.params.trackID) {
            tracklist[i].position = req.params.time;
            updateTracklist(filepath,JSON.stringify(tracklist));
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
