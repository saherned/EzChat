// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.run(function($ionicPlatform, $ionicPopup, Logging, $cordovaToast) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)

    backMode = false;

    if(window.Connection) {
      if (navigator.connection.type == Connection.NONE) {
        $ionicPopup.alert({
         title: "Internet Connection",
         content: "Internet is not connected. Please connect internet to proceed."
         })
         .then(function (result) {
         ionic.Platform.exitApp();
         });
      }
    }

    $ionicPlatform.on("resume", function (event) {
      backMode = false;
      if(connection.getAllParticipants().length>0) {
        connection.send({type: "resume", msg: " resumed the app"});
        $cordovaToast.showLongBottom("Video Chat has been resumed");
      }
      Logging.saveInDebug("App has been resumed.");
    });

    $ionicPlatform.on("pause", function (event) {
      backMode = true;
      if(connection.getAllParticipants().length>0) {
        connection.send({type: "pause", msg: " paused the app"});
        $cordovaToast.showLongBottom("Video Chat has been paused");
      }
      Logging.saveInDebug("App has been paused.");
    });

    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('login', {
      cache: false,
      url: '/login',
      templateUrl: 'templates/login.html',
      controller : 'LoginCtrl'
    })

    .state('user-list', {
      url: '/user-list',
      templateUrl: 'templates/user-list.html',
      controller: 'UserListCtrl'
    })

    .state('video-chat', {
          url: '/video-chat/:rec',
          templateUrl: 'templates/tab-dash.html',
          controller: 'NewDashCtrl',
          cache: false   // true tha
    })

    .state('chat-window', {
      url: '/chat-window/:chatId',
      templateUrl: 'templates/chat-window.html',
      controller: 'NewDashCtrl'
    })

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'NewDashCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
