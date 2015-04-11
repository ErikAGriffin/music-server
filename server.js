(function() {

  var express = require('express');
  var app = express();
  var server = require('http').createServer(app);
  var root = __dirname + '/public/';
  var port = process.env.PORT || 3000;

  app.use(express.static(root));


  // -- Express Session --

  var session = require('express-session');
  var genuuid = require('./controllers/uuid');

  app.use(session({
    genid: function(req) {return genuuid();},
    secret: 'lost boys'
  }));

  // -- EJS Templates --
  app.set('view engine','ejs');
  app.set('views', root);

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
    console.log('--- '+sess.user);
    if (sess.user) {res.sendFile(root+'home.html');}
    else {res.redirect('/login');}
  });


  // --- User Management ---

  app.get('/login', function(req, res) {
    var sess = req.session;
    res.render('login', {user:sess.user});
  });

  app.post('/createuser', function(req,res) {
    var sess = req.session;

    console.log("------ session --------");
    console.log(JSON.stringify(sess));
    console.log(JSON.stringify(req.body));
    console.log(JSON.stringify(req.params));

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
     console.log("!!!!!!!!!!!");

      db.users.findOne({email:req.params.email});
//     console.log(JSON.stringify(my_cursor));
//     console.log("Queried "+req.params.email);



  });


  // Where is this used?
  module.exports = server;
}());
