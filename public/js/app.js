(function() {

  SC.initialize({
    client_id: '781c72e52738eb5df96d29271eec310f'
  });

  var socket = io();

  var app = angular.module('musicServer', []);

  app.controller('ClientController', ['$scope','$http',function($scope,$http) {

    var self = this;

    // Host Connect

    self.hostName = "Oslo";
    self.isConnected = false;
    self.searchPlaceholder = "Search Soundcloud...";
    self.hostPlaceholder = "#####";
    self.searchText = "";
    self.myName = "";


    $http.post('/getclient').success(function(data,status) {
      self.myName = data.userid;
    }).error(function(data, status) {
      console.log('error getting client id');
    });


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
      self.hostName = self.hostName.toUpperCase();
      $http.post('/checkhost/'+self.hostName).success(function(data, status) {
        if (data) {
          self.connectMessage = "";
          self.isConnected = true;
        }
        else {
          self.hostName = "";
          self.connectMessage = "There is no server by that name!";
        }
      }).error(function(data, status) {
        console.log('error checking hostName: '+status);
      });
    };

    self.connect();

    var getStreamable = function(tracks) {
      return tracks.filter(function(song) {
        return song.streamable === true;
      });
    };

    // Search and Add Songs

    self.musicSearch = function() {
      SC.get('/tracks',{q: self.searchText}, function(tracks) {
        tracks = getStreamable(tracks);
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
        position: 0,
        pusher: self.myName
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
    self.pusherList = [];

    self.nowPlaying = {new:true};

    soundManager.defaultOptions = {
      onfinish: function() {
        self.setPlayed(this);
        self.playNow();
      }
    };

    self.togglePlay = function() {
      if (self.nowPlaying.new) {return;}
      if (self.nowPlaying.sound.paused) {self.nowPlaying.sound.play();}
      else {soundManager.pauseAll();}

    };

    var resetValidPushers = function() {
      for (var i=0;i<self.pusherList.length;i++) {
        self.pusherList[i].played = false;
      }
      $http.post('/resetValidPushers/'+self.hostName);
      self.playNow();
    };

    self.playNow = function() {
      var readySongs = self.songList.filter(function(song) {
        return !song.played;
      });

      for (var i=0;i<self.pusherList.length;i++) {
        var pusher = self.pusherList[i];
        if (!pusher.played) {
          for (var j=0;j<readySongs.length;j++) {
            var song = readySongs[j];
            if (pusher.id === song.pusher) {
              song.sound.setPosition(song.position);
              song.sound.play();
              self.nowPlaying = song;
              break;
            }
          } // end for j
          if (!(self.nowPlaying.new || self.nowPlaying.played)) {
            break;
          }
        } // end if !played
      } // end for i
      if (readySongs.length && self.nowPlaying.played) {
        resetValidPushers();
      }
      else if (!readySongs.length && !self.nowPlaying.new) {
        self.nowPlaying = {new:true};
        resetValidPushers();
      }
    };

    // There is absolutely a better way of doing this.
    self.setPlayed = function(sound) {
      for(var i=0;i<self.songList.length;i++) {
        var song = self.songList[i];
        if (song.sound === sound) {
          song.played = true;
          for (var j=0;j<self.pusherList.length;j++) {
            var pusher = self.pusherList[j];
            if (pusher.id == song.pusher) {
              pusher.played = true;
            }
          }
          $http.post('/markplayed/'+self.hostName+'/'+song.id+'/'+song.pusher);
          break;
        }
      }
    };

    var getSound = function(song) {
      SC.stream('/tracks/'+song.id, function(sound) {
        song.sound = sound;
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

    var validPushers = function(pushers) {
      return pushers.filter(function(pusher) {

      });

    };

    $http.post('/gettracklist').success(function(data, status) {

      console.log('getting tracklist');

      self.hostName = data.hostName;
      self.songList = data.tracklist;
      self.pusherList = data.pushers;

      getTrackSounds();

      // - Socket : add song -
      socket.on('add song to '+self.hostName, function(newSongPusher) {
        var newSong = newSongPusher[0];
        self.pusherList = newSongPusher[1];
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
          $timeout(postProgress,1000);
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

