(function() {

  var app = angular.module('musicServer', []);

  app.controller('LogInController', ['$http', function($http) {

    var self = this;
    var user = {};

    self.serverMessage = "";


    self.aTest = function() {};


    self.signUp = function() {


      $http.post('/checkunique/'+self.email).success(function(data,status) {
        console.log('Success: '+status);
        console.log(JSON.stringify(data));

        if (data.unique) {
          console.log('Unique email!');
        }
        else {
          console.log('Email exists. Breaking.');
          self.serverMessage = "This email is already in use.";
          return;
        }

      }).error(function(data,status) {
        console.log("error: "+status);
      });

      console.log('1. validating password...');

      validatePassword(self.password, self.confirmation);


    };



    var validatePassword = function(password, confirmation) {

      console.log('Validating Password');

      if (password != confirmation) {
        self.password = "";
        self.confirmation = "";
        self.serverMessage = "Passwords didn't match";
      }
      else {
        user.email = self.email;
        user.password = password;
        self.serverMessage = "";
        $http({
          url:'/createuser',
          method: "POST",
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          transformRequest: function(obj) {
            var str = [];
            for (var p in obj) {
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
          },
          data: {email: self.email, password: self.password}
        }).success(function(data,status) {
            console.log('Success: '+status);
        }).error(function(data,status) {
            console.log('Error: '+status);
        });
      }
    };





  }]);




}());

