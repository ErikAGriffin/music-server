(function() {

  SC.initialize({
    client_id: '781c72e52738eb5df96d29271eec310f'
  });

  var socket = io();

  var app = angular.module('musicServer', []);

  app.controller('ClientController', ['$scope','$http',function($scope,$http) {

    var self = this;

    // Host Connect

    self.hostName = "london";
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
      //window.scrollTo(input element)
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

    self.connect();


    // Search and Add Songs

    self.searchText = "";

    var resolveImagesOf = function(tracks) {
      // add additional logic for the default avatar
      for (var i=0;i<tracks.length;i++) {
        if (!tracks[i].artwork_url) {
          tracks[i].artwork_url = tracks[i].user.avatar_url;
        }
      }
      return tracks;
    };

    self.musicSearch = function() {
      console.log('Calling SC.get');
      SC.get('/tracks',{q: self.searchText}, function(tracks) {
        console.log('SC.get returned');
        console.log(tracks[0]);
        tracks = resolveImagesOf(tracks);
        self.searchResults = tracks;
        $scope.$apply();
      });
    };

    self.addSong = function(song) {
      console.log(song);
      var newSong = {
        id: song.id,
        title: song.title,
        artist: song.user.username,
        artwork_url: song.artwork_url,
        played: false
      };
      socket.emit('add song', {hostName: self.hostName,song: newSong});
      return false;
    };

  }]); // end ClientController

  // Begin ServerController

  app.controller('ServerController', ['$scope','$http',function($scope,$http) {

    var self = this;

    soundManager.defaultOptions = {
      onfinish: function() {
        self.setPlayed(this);
        self.playNow();
      }
    };

    self.songList = [];

    self.playNow = function() {
      console.log('playNow() called');
      for (var i=0;i<self.songList.length;i++) {
        if (!self.songList[i].played) {
          self.songList[i].sound.play();
          break;
        }
      }
    };

    // There is absolutely a better way of doing this.
    self.setPlayed = function(sound) {
      for(var i=0;i<self.songList.length;i++) {
        if (self.songList[i].sound === sound) {
          self.songList[i].played = true;
          socket.emit('song played', self.songList[i].id);
          break;
        }
      }
    };

    var getSound = function(song) {
      SC.stream('/tracks/'+song.id, function(sound) {
        song.sound = sound;
      });
    };


    $http.post('/gettracklist').success(function(data, status) {

      console.log('getting tracklist');

      self.hostName = data.hostName;
      self.songList = data.tracklist;

      // Get streams of unplayed tracks
      for (var i=0;i<self.songList.length;i++) {
        var song = self.songList[i];
        if (!song.played) {
          getSound(song);
        }
      }

      socket.on('add song to '+self.hostName, function(newSong) {

//         newSong.sound = getSound(newSong);
//         console.log('Check A');
//         self.songList.push(newSong);
//         console.log(newSong);
//         console.log('Check B');
//         $scope.$apply();

        SC.stream("/tracks/"+newSong.id, function(sound) {
          newSong.sound = sound;
          console.log(sound);
          self.songList.push(newSong);
          $scope.$apply();
          if (self.songList.length === 1) {
            self.songList[0].sound.play();
          }
        });
      });

      self.playNow();

    }).error(function(data,status) {
      console.log('error getting tracklist');
    });


    self.pauseAll = function() {
      soundManager.pauseAll();
    };

//     var postTrackProgress = function() {

//     };

//     var onlinePoll = function() {
//       (function checkIn() {
//         $http.post('/online/'+$window.currentUser).success(function(data,status) {
//           self.usersOnline = data.users;
//           $timeout(checkIn, 2997);
//         }).error(function(data, status) {
//           console.log('error in online poll: '+status);
//         });
//       })();
//     };

//     onlinePoll();




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

