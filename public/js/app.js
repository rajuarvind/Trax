'use strict';

/* App Module */

var traxApp = angular.module('traxApp', [
  'ngRoute',
  'traxControllers'
]);

//configure all angular routes
traxApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'partials/login.html',
        controller: ''
      }).
      when('/unique/:playlistId', {
        templateUrl: 'partials/chatServer.html',
        controller: 'pageCtrl'
      }).
      when('/choosePlaylist', {
        templateUrl: 'partials/playlistForm.html',
        controller: 'formCtrl'
      }).
      otherwise({
        redirectTo: '/unique/:playlistId'
      });
  }]);
