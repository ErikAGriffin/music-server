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
    self.searchPlaceholder = "Search Soundcloud...";
    self.hostPlaceholder = "#####";

    self.togglePlaceholder = function() {
      if (self.searchPlaceholder === "" || self.hostPlaceholder === "") {
        self.searchPlaceholder = "Search Soundcloud...";
        self.hostPlaceholder = "#####";
      }
      else {
        self.searchPlaceholder = "";
        self.hostPlaceholder = "";
      }
    };

    self.connect = function() {
      $http.post('/checkhost/'+self.hostName).success(function(data, status) {
        console.log(data);
        if (data) {
          console.log("Connected to "+self.hostName);
          self.connectMessage = "";
          self.isConnected = true;
        }
        else {
          self.hostName = "";
          self.connectMessage = "There is no server by that name!";
        }
      }).error(function(data, status) {
        console.log('error checking hostname: '+status);
      });
    };


    // Search and Add Songs

    self.searchText = "";

    self.musicSearch = function() {
      console.log('Calling SC.get');
      SC.get('/tracks',{q: self.searchText}, function(tracks) {
        console.log('SC.get returned');
        console.log(tracks[0]);
        self.searchResults = tracks;
        $scope.$apply();
      });
    };

    self.addSong = function(song) {
      console.log(song);
      var newSong = {};
      newSong.id = song.id;
      newSong.title = song.title;
      socket.emit('add song', {hostName: self.hostName,song: newSong});
      return false;
    };

  }]); // end ClientController

  app.controller('ServerController', ['$scope','$http',function($scope,$http) {

    var self = this;

    $http.post('/gettracklist').success(function(data, status) {
      self.hostName = data.hostName;
      self.songList = data.tracklist;

      socket.on('add song to '+self.hostName, function(newSong) {
        SC.stream("/tracks/"+newSong.id, function(sound) {
          sound.play();
        });
        self.songList.push(newSong.title);
        $scope.$apply();
      });
    }).error(function(data,status) {
      console.log('error getting tracklist');
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

