(function() {

  SC.initialize({
    client_id: '781c72e52738eb5df96d29271eec310f'
  });

  var socket = io();

  var app = angular.module('musicServer', []);

  app.controller('ClientController', ['$scope','$http',function($scope,$http) {

    var self = this;

    // Host Connect

    self.hostName = "";
    self.isConnected = false;

    self.connect = function() {

      console.log("Connected to "+self.hostName);
      self.isConnected = true;

    };


    // Search and Add Songs

    self.searchText = "";

    self.musicSearch = function() {
      console.log('Calling SC.get');
      SC.get('/tracks',{q: self.searchText}, function(tracks) {
        console.log('SC.get returned');
        self.searchResults = tracks;
        $scope.$apply();
      });
    };

    self.addSong = function(song) {
      console.log('Song added.');
      console.log(song.title);
      socket.emit('add song', {hostID: self.hostName,song: song.title});
      return false;
    };

  }]); // end ClientController

  app.controller('ServerController', ['$scope','$http',function($scope,$http) {

    var self = this;

    $http.post('/gettracklist').success(function(data, status) {

      self.hostName = data.serverID;

      self.songList = data.tracklist;

    }).error(function(data,status) {
      console.log('error getting tracklist');
    });



    socket.on('add song', function(songTitle) {

      console.log('Hey! '+songTitle);
      self.songList.push(songTitle);
      $scope.$apply();

    });



  }]); // end ServerController














































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

