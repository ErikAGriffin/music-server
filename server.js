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
  var updateSongPosition = require('./src/updateSongPosition');
  var markSongPlayed = require('./src/markSongPlayed');
  var resetValidPushers = require('./src/resetValidPushers');

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

  app.post('/markplayed/:hostName/:songID/:pusherID', function(req,res) {
    var params = req.params;
    var update = {
      hostName: params.hostName,
      songID: params.songID,
      pusherID: params.pusherID};

    console.log('Marking song '+update.songID+' as played.');
    markSongPlayed(redis,update);

    res.json({});
    // have to change headers on post request
    // in order to use res.end();

  });

  // possibly change to put?

  app.post('/updatetrack/:hostName/:songID/:time', function(req,res) {
    var params = req.params;
    var update  = {
      hostName: params.hostName,
      songID: params.songID,
      time: params.time};

    updateSongPosition(redis,update);

    res.json({});

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
    resetValidPushers(redis,req.params.hostName);
    res.json({});
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
