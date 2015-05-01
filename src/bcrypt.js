(function() {
var bcrypt = require('bcrypt');

  var createUser = function(email, password, callback) {
    var user = {};
    user.email = email;
    bcrypt.hash(password, 10, function(err, hash) {
      user.password = hash;
      callback(user);
    });
  };



  var checkPassword = function(entered, stored, callback) {

    bcrypt.compare(entered, stored, function(err, res) {
      callback(res);
    });
  };

  module.exports.createUser = createUser;
  module.exports.checkPassword = checkPassword;


}());
