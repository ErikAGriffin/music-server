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



    self.musicSearch = function() {
      SC.get('/tracks',{q: self.searchText}, function(tracks) {
        tracks = resolveImagesOf(tracks);
        self.searchResults = tracks;
        $scope.$apply();
      });
    };

    self.addSong = function(song) {
      var newSong = {
        id: song.id,
        title: song.title,
        artist: song.user.username,
        artwork_url: song.artwork_url,
        played: false,
        position: 0
      };
      socket.emit('add song', {hostName: self.hostName,song: newSong});
      // ..necessary?
      return false;
    };

    var resolveImagesOf = function(tracks) {
      // add additional logic for the default avatar returning instead DropMusic image
      for (var i=0;i<tracks.length;i++) {
        if (!tracks[i].artwork_url) {
          tracks[i].artwork_url = tracks[i].user.avatar_url;
        }
      }
      return tracks;
    };

  }]); // end ClientController

  // --- Begin ServerController ---

  app.controller('ServerController', ['$scope','$timeout','$http',function($scope,$timeout,$http) {

    var self = this;

    self.songList = [];

    self.nowPlaying = {new:true};

    soundManager.defaultOptions = {
      onfinish: function() {
        self.setPlayed(this);
        self.playNow();
      }
    };

    self.pauseAll = function() {
      soundManager.pauseAll();
    };

    self.playNow = function() {
      for (var i=0;i<self.songList.length;i++) {
        var song = self.songList[i];
        if (!song.played) {
          song.sound.setPosition(song.position);
          song.sound.play();
          self.nowPlaying = song;
          break;
        }
        if (i===self.songList.length-1) {self.nowPlaying = {new:true};}
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
        console.log(song);
      });
    };

    var getTrackSounds = function() {
      for (var i=0;i<self.songList.length;i++) {
        var song = self.songList[i];
        if (!song.played) {
          getSound(song);
        }
      }
    };

    $http.post('/gettracklist').success(function(data, status) {

      console.log('getting tracklist');

      self.hostName = data.hostName;
      self.songList = data.tracklist;

      getTrackSounds();

      socket.on('add song to '+self.hostName, function(newSong) {
        getSound(newSong);
        self.songList.push(newSong);
        $scope.$apply();
        if (self.nowPlaying.new) {self.playNow();}
      });

      self.playNow();

    }).error(function(data,status) {
      console.log('error getting tracklist');
    });




    var postTrackProgress = function() {
      (function postProgress() {
        var time = 0;
        if (self.nowPlaying.sound) {time = self.nowPlaying.sound.position;}
        var url = '/updatetrack/'+self.hostName+'/'+self.nowPlaying.id+'/'+time;
        $http.post(url).success(function(data,status) {
          $timeout(postProgress,5000);
        }).error(function(data,status) {
          console.log('Error updating track progress');
        });
      })();
    };

    postTrackProgress();



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

