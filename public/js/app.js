(function() {

  var app = angular.module('musicServer', []);

  app.controller('LogInController', function() {

    var self = this;
    var user = {};

    self.serverMessage = "";

    self.signUp = function() {
      if (self.password != self.confirmation) {
        self.password = "";
        self.confirmation = "";
        self.serverMessage = "Passwords don't match.";
      }
      else {
        user.email = self.email;
        user.password = self.password;
        self.serverMessage = "";
      }
    };

  });


}());

