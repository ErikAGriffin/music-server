(function() {

  SC.initialize({
    client_id: '781c72e52738eb5df96d29271eec310f'
  });

  var app = angular.module('musicServer', ['ngSanitize']);


  app.controller('ClientController', ['$http','$sce',function($http,$sce) {

    var self = this;

    self.embed = "";

    self.searchText = "";

    self.test = function() {
    };

    self.renderSoundcloud = function(soundHtml) {

      self.embed = $sce.trustAsHtml(soundHtml);

    };

    self.musicSearch = function() {

      SC.get('/tracks',{q: self.searchText}, function(tracks) {

      SC.oEmbed(tracks.shift().permalink_url, {auto_play: true}, function(oembed){

        console.log(oembed.html);

        self.renderSoundcloud(oembed.html);

      });




      });


    };




  }]);



















































  app.filter('showKeys', function(){
    return function(input){
      if(!angular.isObject(input)){
        throw Error("Usage of non-object with showKeys filter!");
      }
      return Object.keys(input);
    };
  });

  app.controller('LogInController', ['$http', function($http) {

    var self = this;
    var user = {};

    self.serverMessage = "";


    self.signUp = function() {
      $http.post('/checkunique/'+self.email).success(function(data,status) {
        if (data.unique) {
          console.log('Unique email!');
          validatePassword(self.password, self.confirmation);
        }
        else {
          console.log('Email exists. Breaking.');
          self.serverMessage = "This email is already in use.";
        }
      }).error(function(data,status) {
        console.log("error in checkunique post: "+status);
      });

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
          data: user
        }).success(function(data,status) {
            console.log('Success: '+status+"\nUser Created");
        }).error(function(data,status) {
            console.log('Error in createuser post: '+status);
        });
      }
    };

  }]); // End LogInController




}());

