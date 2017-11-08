angular.module('starter.services', [])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'img/ben.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'img/max.png'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'img/adam.jpg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'img/perry.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'img/mike.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
})
.factory('Logging', function($filter, $cordovaFile){
  /*-------------------------------File writing into external storage------------------------*/
  self.saveInDebug = function(debugText){
    var folder; var file;
    today = new Date();
    fileNameDate = $filter('date')(today, 'yyyyMMdd');
    timestamp = $filter('date')(today, 'yyyy-MM-dd HH:mm:ss');

    //Create Directory
    $cordovaFile.createDir(cordova.file.externalRootDirectory,'EzChat Debug', true)
      .then(function (success) {

        //Create File in particular Directory
        folder = cordova.file.externalRootDirectory + "EzChat Debug";
        file = fileNameDate +".txt";

        $cordovaFile.createFile(folder, file, true).then(function (success) {
          $cordovaFile.writeExistingFile(folder, file, "\n" + timestamp + " - "+debugText)
            .then(function (success) {
              //alert("File Updated");
            },function (error) {
              alert("Failed to update file");
            });

        }, function (error) {
          alert("Error in creating File")
        });

      }, function (error) {
        alert("Error in creating Directory");
      });

  }
  return self;
})
.factory('ConnectivityMonitor', function($rootScope, $cordovaNetwork){

    return {
      isOnline: function(){
        if(ionic.Platform.isWebView()){
          return $cordovaNetwork.isOnline();
        } else {
          return navigator.onLine;
        }
      },
      isOffline: function(){
        if(ionic.Platform.isWebView()){
          return !$cordovaNetwork.isOnline();
        } else {
          return !navigator.onLine;
        }
      },
      startWatching: function(){
        if(ionic.Platform.isWebView()){

          $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
            console.log("went online");
          });

          $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
            console.log("went offline");
          });

        }
        else {

          window.addEventListener("online", function(e) {
            console.log("went online");
          }, false);

          window.addEventListener("offline", function(e) {
            console.log("went offline");
          }, false);
        }
      }
    }
  });
