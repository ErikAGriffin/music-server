(function() {

  var app = angular.module('musicServer', []);

  app.controller('LogInController', ['$http', function($http) {

    var self = this;
    var user = {};

    var validatePassword = function(password, confirmation) {
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

    // Start

    self.serverMessage = "";

    self.signUp = function() {


      $http.post('/checkunique/'+self.email).success(function(data,status) {
        console.log('Success: '+status);
        console.log(JSON.stringify(data));
      }).error(function(data,status) {
        console.log("error: "+status);
        console.log(JSON.stringify(data));
      });

      validatePassword(self.password, self.confirmation);


    };





  }]);




}());

