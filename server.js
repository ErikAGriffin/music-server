(function() {

  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var root = __dirname + '/public/';
  var port = process.env.PORT || 3000;

  app.use(express.static(root));

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

  // -- Sample require section --

  var getHostObject = require('./src/getHostObject');
  var checkHostExists = require('./src/checkHostExists');
  var updateSongPosition = require('./src/updateSongPosition');
  var markSongPlayed = require('./src/markSongPlayed');
  var resetValidPushers = require('./src/resetValidPushers');

  var redis = require('./src/redis');

  var io = require('socket.io')(server);
  var socket = require('./src/socket')(io, redis);


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

  app.get('/', function(req, res) {
    res.render('home');
  });

  app.get('/server', function(req, res) {
    var sess = req.session;
    if (!sess.hostName) {
      var hostName = genuuid.genServerID();
      redis.set(hostName,true);
      sess.hostName = hostName;
    }
    res.render('host', {hostName: sess.hostName});
  });

  app.get('/about', function(req,res) {
    res.render('about');
  });

  app.post('/gettracklist', function(req, res) {
    getHostObject(redis,req.session.hostName,function(data) {
      res.json(data);
    });
  });

  app.post('/markplayed/:hostName/:songID/:pusherID', function(req,res) {
    var params = req.params;
    markSongPlayed(redis,{hostName: params.hostName,songID: params.songID,pusherID: params.pusherID});
    res.json({});
  });

  // possibly change to put?

  app.post('/updatetrack/:hostName/:songID/:time', function(req,res) {
    var params = req.params;
    updateSongPosition(redis,{hostName: params.hostName,songID: params.songID,time: params.time});
    res.json({});
  });

  // --- Host Management ---

  app.post('/checkhost/:hostName', function(req,res) {
    redis.get(req.params.hostName,function(err,data) {
      res.json(data);
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


  // Where is this used?
  module.exports = server;
}());
