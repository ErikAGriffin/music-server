(function() {

  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var root = __dirname + '/public/';
  var port = process.env.PORT || 3000;

  app.use(express.static(root));

  // -- Sample require section --

  var getHostObject = require('./src/getHostObject');
  var checkHostExists = require('./src/checkHostExists');

  // -- Redis --

  var Redis = require('ioredis');
  var redis = new Redis();

  // -- FileSystem --

  var fs = require('fs');

  var io = require('socket.io')(server);
  var socket = require('./src/socket')(io, redis);

  // -- Express Session --

  var session = require('express-session');
  var genuuid = require('./src/uuid');

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
  var bcrypt = require('./src/bcrypt');


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
    if (!sess.hostName) {
      // create something that allows client to check
      // that host exists.
      sess.hostName = genuuid.genServerID();
    }
    res.render('host', {hostName: sess.hostName});
  });

  // --- Track Management ---

  app.post('/gettracklist', function(req, res) {
    getHostObject(redis,req.session.hostName,function(data) {
      res.json(data);
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


  // possibly change to put?

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
    // How to check using the new structure?
    var exists = false;
    fs.readFile('./files/'+req.params.hostName+'.json','utf-8', function(err, data) {
      if (err) {
        console.log('server does not exist yet.');
      }
      else {exists = true;}
      res.json(true);
    });
  });

  // ..Temp user management..

  app.post('/getclient', function(req,res) {
    var sess = req.session;
    res.json({userid:sess.id});
  });

  app.post('/resetValidPushers/:hostName', function(req, res) {
    console.log('Resetting all valid pushers');
    var filepath = './files/'+req.params.hostName+'.json';
    fs.readFile(filepath,'utf-8',function(err,data) {
      if(err){console.log('error resetting valid pushers');}
      var serverObject = JSON.parse(data);
      for (var i=0;i<serverObject.pushers.length;i++) {
        var pusher = serverObject.pushers[i];
        pusher.played = false;
      }
      updateTracklist(filepath,JSON.stringify(serverObject));
      res.json({});
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
