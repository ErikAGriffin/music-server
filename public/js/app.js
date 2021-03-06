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
    self.searchPlaceholder = "Search Music...";
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
        self.searchPlaceholder = "Search Music...";
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

    var getStreamable = function(tracks) {
      return tracks.filter(function(song) {
        return song.streamable === true;
      });
    };

    // Search

    self.musicSearch = function() {
      SC.get('/tracks',{q: self.searchText}, function(tracks) {
        tracks = getStreamable(tracks);
        tracks = resolveImagesOf(tracks);
        self.searchResults = tracks;
        $scope.$apply();
      });
    };

    // Add Song

    self.addSong = function(song) {
      song.sendThumbnail = "/images/sent.png";
      song.sent = true;
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
        tracks[i].sendThumbnail = "/images/send.png";
        tracks[i].sent = false;
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



  app.controller('AboutController', function() {

    var self = this;

    self.showIphoneInfo = false;

    self.toggleIphoneInfo = function() {
      self.showIphoneInfo = !self.showIphoneInfo;
    };

  });


}());
