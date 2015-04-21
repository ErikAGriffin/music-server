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

    console.log('A user has connected');

    socket.on('add song', function(songTitle) {
      console.log(songTitle);
      io.emit('add song', songTitle);
    });


    socket.on('disconnect', function() {
      console.log('A user has disconnected');
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
    if (!sess.serverID) {
      sess.serverID = genuuid.genServerID();
    }
    res.render('serve', {serverID: sess.serverID});
  });

  // --- Track Management ---

  app.post('/gettracklist', function(req, res) {
    var sess = req.session;

    var obj = {};
    obj.serverID = sess.serverID;
    fs.readFile('./'+sess.serverID+'.json','utf-8', function(err, data) {
      if (err) {
        console.log('error reading tracklist file '+sess.serverID);
        console.log(err);
        data = [{}];
      }
      obj.tracklist = JSON.parse(data);
      res.json(obj);
    });

  });

  app.post('/addtrack', function(req, res) {

    var file = [{"test":"new data"}];

    fs.writeFile('./test_file.json', JSON.stringify(file), function(err) {
      if(err){return console.log("error saving file! :"+err);}
      console.log('File was saved!');
    });

    fs.readFile('./test_file.json','utf-8', function(err, data) {
      if (err) {
        console.log('error retrieving file!');
        data = {};
      }
      res.json(JSON.parse(data));
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
