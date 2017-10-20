angular.module('starter.controllers', [])

.controller("LoginCtrl", function($scope, $state, $rootScope, $ionicHistory, Logging){

    $scope.data={};

    // to disable back option when move to another state
    $ionicHistory.nextViewOptions({
      disableBack: true,
      disableAnimate: true,
      historyRoot: false
    });

    connection = new RTCMultiConnection();
    connection.socketURL = 'https://rtc-video.herokuapp.com:443/'; //http://192.168.1.3:9001/'; //https://rtc-video.herokuapp.com:443 //https://rtcmulticonnection.herokuapp.com:443/
    connection.maxParticipantsAllowed = 1;
    connection.leaveOnPageUnload = true;
    //connection.dontCaptureUserMedia = true;

    // all below lines are optional; however recommended.
     connection.session = {
        audio: true,
        video: true,
        data: true
      };

    connection.sdpConstraints.mandatory = {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    };

    connection.mediaConstraints.mandatory = {
      minWidth: 1280,
      maxWidth: 1280,
      minHeight: 720,
      maxHeight: 720,
      minFrameRate: 30
    };

   /* connection.mediaConstraints.video.optional = [{
      facingMode: 'application'
    }];

    if(DetectRTC.browser.name === 'Firefox') {
      connection.mediaConstraints = {
        audio: true,
        video: {
          facingMode: 'application'
        }
      };
    }*/

    connection.onMediaError = function(error) {
      if (window.cordova)
        Logging.saveInDebug('Media Error: ' + error.name);

      if(error.name=="TrackStartError"  || error.name=="DevicesNotFoundError")
      alert('Media Error: ' + error.name + '\nPlease ensure that camera and microphone is connected');
      else {
        alert('Media Error: ' + error.name + '\nPlease enable permisions of media and restart app to proceed.');
      }
    };

    $scope.login = function (){

      connection.extra = {
        fullName: $scope.data.username,
        joinedAt: new Date()
      };

      /*connection.mediaConstraints.video.optional = [{
        sourceId:  deviceID
      }];*/

      connection.checkPresence($scope.data.username, function(isRoomExists, roomid) {
        if(isRoomExists) {
          alert("This user is already exist. Please try some other");
        }
        else {
          connection.open($scope.data.username, function() {
            $rootScope.username = $scope.data.username;
            addedTime = new Date();
           if (window.cordova)
              Logging.saveInDebug("Login with " + $scope.data.username);
            $state.go("user-list");
          });
        }
      });
     }

      DetectRTC.load(function() {
           deviceID = [];
           DetectRTC.videoInputDevices.forEach(function (device) {
           deviceID.push(device.id);
           console.log(device.label + " " + device.kind);
           });
      });
})
.controller('UserListCtrl', function($scope, $filter, $ionicLoading, $rootScope, $stateParams, $state, $ionicPopup, $ionicHistory, Logging, $timeout) {

    $scope.data = {
      onCall : false
    };

    swipe = false;

    $scope.change = function(face){
      connection.attachStreams.forEach(function(stream) {
        stream.stop();
      });
      connection.mediaConstraints.video.optional = [{
        sourceId: deviceID[face]
      }];

      setTimeout(function() {
        connection.addStream({audio:true, video:true});
      }, 1000);

    };

    $rootScope.userList = [];
    var alreadyAllowed = {};

    checkUsers = function(){
      $rootScope.userList = [];
      connection.getAllUsers(function(owners) {
        owners.forEach(function(owner) {
          //var roomid = owner.userid; // + owner.extra
          $rootScope.userList.push({extra:{fullName: owner.userid, joinedAt:owner.extra.joinedAt}});
        });
        $rootScope.$apply();

        setTimeout(checkUsers, 5000); // recheck after every 5 seconds
        console.log($rootScope.userList);
      });
    };
    checkUsers();

    connection.onNewParticipant = function(participantId, userPreferences) {
      callAttended = false;
      if(alreadyAllowed[participantId]) {
        connection.acceptParticipationRequest(participantId, userPreferences);
        return;
      }

      /* userPreferences.dontAttachStream = false; // according to situation
       userPreferences.dontGetRemoteStream = false;  // according to situation*/

      if (window.cordova){
        Logging.saveInDebug("Incoming call from " + participantId);
      }

      $state.go("video-chat", {rec:participantId});

      audio = document.createElement("audio");
      audio.src = "ringtone/despacito.mp3";
      audio.addEventListener("ended", function () {
        // document.removeChild(audio);
        audio.play();
      }, false);
      audio.play();

      myPopup = $ionicPopup.show({
        template: '<p>'+ participantId + ' is calling you. Confirm to accept his request.</p>',
        title: '',
        subTitle: 'Calling',
        buttons: [
          {
            text: 'Reject',
            type: 'button-assertive button-outline',
            onTap: function(e) {
              connection.setCustomSocketEvent('rejected-call');
              connection.socket.emit('rejected-call', {
                callRejected: true,
                remoteUserId: connection.userid,
                receiverId: participantId
              });
              if (window.cordova){
                Logging.saveInDebug("Rejected call of " + participantId);
              }
              audio.pause();
              audio.currentTime = 0;
              $ionicHistory.goBack();
            }
          },
          {
            text: 'Attend',
            type: 'button-positive button-outline',
            onTap: function(e) {
              if (window.cordova)
                Logging.saveInDebug("You received the call");

              audio.pause();
              audio.currentTime = 0;

              connection.acceptParticipationRequest(participantId, userPreferences);
            }
          }
        ]
      });

     /* setTimeout(function(){
        if(callAttended == false) {
          myPopup.close();
          audio.pause();
          audio.currentTime = 0;
          if (window.cordova) {
            Logging.saveInDebug("Missed call from " + participantId);
          }
          $ionicHistory.goBack();
        }
      },5000);
    */
    };

    connection.socket.on('cancelled-call', function(data) {

      if(data.receiverId != connection.userid) return;
        audio.pause();
        //audio.currentTime = 0;
        alert(data.remoteUserId + " cancelled the call");
        if (myPopup != undefined) {
          myPopup.close();
      }

      connection.attachStreams.forEach(function(stream) {
        stream.stop();
      });

      localVideo=null;

      if (window.cordova)
        Logging.saveInDebug(data.remoteUserId + " cancelled the call");

        $ionicHistory.goBack();

    });

    connection.socket.on('rejected-call', function(data) {
      console.log(connection);
      if(data.receiverId != connection.userid) return;
      alert(data.remoteUserId + " has declined your call");
      if (myPopup != undefined) {
        myPopup.close();
      }
      if (window.cordova)
        Logging.saveInDebug(data.remoteUserId + " has declined your call");

      $ionicHistory.goBack();
    });

    $scope.startVideoChat = function(user){
      if(window.confirm('Aye you sure you want to start video chat with ' + user + "?")) {
        $scope.data.contact_username = user;

        connection.checkPresence($scope.data.contact_username, function(isRoomExists, roomid) {
          if(isRoomExists) {

            if (window.cordova) {
              Logging.saveInDebug("Outgoing Call to " + user);
            }

            $state.go("video-chat", {rec:user});

            connection.join($scope.data.contact_username, function(){
              callAttended = false;
              myPopup = $ionicPopup.show({
                template: '<p>Press cancel to cancel call</p>',
                title: $scope.data.contact_username,
                subTitle: 'Calling',
                buttons: [
                  {
                    text: '<b>Cancel</b>',
                    type: 'button-assertive button-outline',
                    onTap: function(e) {
                      connection.setCustomSocketEvent('cancelled-call');
                      connection.socket.emit('cancelled-call', {
                        callCancelled: true,
                        remoteUserId: connection.userid,
                        receiverId: $scope.data.contact_username
                      });
                      connection.attachStreams.forEach(function(stream) {
                        stream.stop();
                      });
                      localVideo=null;

                      if (window.cordova)
                        Logging.saveInDebug("You cancelled the call");

                      $ionicHistory.goBack();
                    }
                  }
                ]
              });

              /*setTimeout(function(){
                if(callAttended == false) {
                  myPopup.close();
                  if (window.cordova)
                    Logging.saveInDebug($scope.data.contact_username + " didn't attend the call");
                  $ionicHistory.goBack();
                }
              },5000);*/

            });
          }
          else {
            if (window.cordova)
              Logging.saveInDebug("This username is used by another user");
            alert("This username is not exist. Please enter valid username");
          }
        });
      }
    }

    connection.onstream = function (event) {
      console.log(connection);

      localVideo = event.mediaElement;
      localVideo.title = event.userid;
      localVideo.controls = false;

      if (event.type === 'local') {
        connection.attachStreams.push(event.stream);
        if (window.cordova)
          Logging.saveInDebug("Local stream attached");
        //localVideosContainer.appendChild(video);
      }
      if (event.type === 'remote') {
        //remoteVideosContainer.appendChild(video);
      }
    };

    connection.onRoomFull = function(roomid) {
      /*connection.attachStreams.forEach(function (stream) {
        stream.stop();
      });*/
      $ionicHistory.goBack();
      if(myPopup!=undefined)
      myPopup.close();
      alert("User is busy");
      connection.disconnect();
      connection.attachStreams.forEach(function(stream) {
        stream.stop();
      });
      localVideo=null;
      if (window.cordova)
        Logging.saveInDebug(roomid + " is busy");
    };

    connection.onerror = function(e) {
      console.log(e);
      if (window.cordova)
        Logging.saveInDebug(JSON.stringify(e).toString());
    };

})

.controller('NewDashCtrl', function($scope, $filter, $ionicLoading, $rootScope, $stateParams, $state, $ionicPopup, $ionicHistory, Logging, $cordovaToast){


    $scope.data = {
      onCall : false
    };

    var localVideosContainer = document.getElementById("local-videos-container");
    var remoteVideosContainer = document.getElementById("remote-videos-container");
    var alreadyAllowed = {};
    $scope.data.receiver = $stateParams.rec;

    if(localVideo!=null)
    localVideosContainer.appendChild(localVideo);
    else {
      connection.captureUserMedia(function (stream) {
        console.log("before " + connection.attachStreams.length);
      })
    }

    $scope.change = function(face){

      swipe = !swipe;

      connection.mediaConstraints.video.optional = [{
        sourceId: swipe ? deviceID[1] : deviceID[0]
      }];

      connection.attachStreams.forEach(function(stream) {
        stream.stop();
      });

      connection.captureUserMedia(function(stream) {
        console.log("before " + connection.attachStreams.length);
      })

      setTimeout(function() {
        connection.send({type:"facingMode", msg:" changed the facing mode"});
        if (window.cordova) {
          Logging.saveInDebug("You changed the facing mode");
        }
        connection.getAllParticipants().forEach(function(p) {
          var user = connection.peers[p];
          user.peer.getLocalStreams().forEach(function(localStream) {
            user.peer.removeStream(localStream);
          });
        });
        connection.renegotiate();
      }, 2000);

    };

     /* connection.onstreamended = function(e) {
        if (e.mediaElement.parentNode) e.mediaElement.parentNode.removeChild(e.mediaElement);
      };*/

    connection.onstream = function (event) {
        console.log(connection);

        var video = event.mediaElement;
        video.title = event.userid;
        video.controls = false;

        if (event.type === 'local') {
          localVideo = video;
          localVideosContainer.appendChild(video);
          console.log("local");
        }
        if (event.type === 'remote') {
          console.log("remote");
            if(document.getElementById(event.streamid)) return;
            remoteVideosContainer.appendChild(video);
          if (window.cordova)
            Logging.saveInDebug("Remote stream has been attached");
        }

      };

    connection.onopen = function(event) {
      callAttended = true;
      console.log(event);

      if(myPopup!=undefined) {
        myPopup.close();
      }
      $scope.data.log = 'Started call with: ' + connection.getAllParticipants().join(', ')
        + ", " + ($filter('date')(new Date(), "dd-MM-yyyy hh:mm:ss")).toString();
      if (window.cordova)
        Logging.saveInDebug('Started call with: ' + event.userid);
      $scope.data.onCall = true;
      $scope.$apply();
      console.log('You are connected with: ' + connection.getAllParticipants().join(', ') + ", " + new Date() + ' ' + connection.dontCaptureUserMedia);
    };

    connection.onmessage = function(event) {

      if (window.cordova) {
        Logging.saveInDebug(event.userid + ' : ' + event.data.msg);
      }

        switch (event.data.type) {
          case "resume":case "facingMode":
            $scope.pause = false;
            if(window.cordova)
            $cordovaToast.showLongBottom(event.userid + ' : ' + event.data.msg);
            break;
          case "pause":
            $scope.pause = true;
            break;
        }

      //alert(event.userid + ' said: ' + event.data);
    };

    connection.onclose = function(event) {
      /*connection.attachStreams.forEach(function (stream) {
        stream.stop();
      });*/
      console.log('Data connection closed between you and ' + event.userid);
      $scope.data.log = 'End call with: ' + event.userid
        + ", " + ($filter('date')(new Date(), "dd-MM-yyyy hh:mm:ss")).toString();
      alert('End call with: ' + event.userid
        + ", " + ($filter('date')(new Date(), "dd-MM-yyyy hh:mm:ss")).toString());
      if (window.cordova)
        Logging.saveInDebug('End call with: ' + event.userid);

      $scope.data.onCall = false;
      $scope.$apply();
    };


    connection.onleave = function(e) {
      connection.attachStreams.forEach(function (stream) {
       stream.stop();
       });
      localVideo=null;
      console.log(e.userid + ' has leaved the room.');
      $scope.data.log = 'End call with: ' + e.userid
        + ", " + ($filter('date')(new Date(), "dd-MM-yyyy hh:mm:ss")).toString();
      if (window.cordova)
        Logging.saveInDebug('End call with: ' + e.userid);

      $scope.data.onCall = false;
      //$scope.$apply();
      $ionicHistory.goBack();
    };


    connection.onMediaError = function(error) {
      if(error.name=="TrackStartError" || error.name=="DevicesNotFoundError")
        alert('Media Error: ' + error.name + '\nPlease ensure that camera and microphone is connected');
      else
        alert('Media Error: ' + error.name + '\nPlease enable permisions of media to proceed.');
    };

    connection.onPeerStateChanged = function (state) {
      // state.userid == 'target-userid' || 'browser'
      // state.extra  == 'target-user-extra-data' || {}
      // state.name  == 'short name'
      // state.reason == 'longer description'
      console.log(state);
      if(state.name == 'stop-request-denied') {
        alert(state.reason);
      }
    };

    $scope.sendMsg = function(){
      //var msg = prompt('Please enter message');
      connection.send($scope.data.message);
    }

    $scope.leave = function(){
      connection.getAllParticipants().forEach(function(participantId) {
        connection.disconnectWith(participantId);
      });
    }

    $scope.openOrJoinRoom = function() {
      predefinedRoomId = prompt('Please enter room-id', 'xyz');
      connection.openOrJoin(predefinedRoomId,  function(isRoomExists, roomid) {
        $scope.data.log = (isRoomExists ? 'You joined room ' + roomid : 'You created room ' + roomid);
        $scope.$apply();
      });
    }

})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
