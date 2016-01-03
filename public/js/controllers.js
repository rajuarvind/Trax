'use strict';

/* Controllers */

var traxControllers = angular.module('traxControllers', []);

//controller for handling actions on the chat server page
traxControllers.controller('pageCtrl', ['$scope', '$http',
  function($scope, $http) {
  	$("#showCode").html("<h3>Send the following link to collaborators: <span id='unique-url'>" + window.location.href + "</span></h3>");

  	$scope.joinChannel = function() {
  		$("#messages").removeClass("hidden");
  		$("#chat-input").removeClass("hidden");

	    var $chatWindow = $('#messages');
	    var accessManager;
	    var messagingClient;
	    var generalChannel;

	    var username = $scope.link;
	    var begun; 
	    var loggedIn = false;

	    // Helper function to print info messages in the chat
	    function print(infoMessage, asHtml) {
	        var $msg = $('<div class="info">');
	        if (asHtml) {
	            $msg.html(infoMessage);
	        } else {
	            $msg.text(infoMessage);
	        }
	        $chatWindow.append($msg);
	    }


	    // Helper function to print user messages in the chat
	    function printMessage(fromUser, message) {
	        var $user = $('<span class="username">').text(fromUser + ':');
	        if (fromUser === username) {
	            $user.addClass('me');
	        }
	        var $message = $('<span class="message">').text(message);
	        var $container = $('<div class="message-container">');
	        $container.append($user).append($message);
	        $chatWindow.append($container);
	        $chatWindow.scrollTop($chatWindow[0].scrollHeight);
	    }

	    username = username.replace(/\s/g, '')
	    print('Logging in...');
	    $("#usernameForm").remove()

    	$.getJSON('/token', {
	        device: 'browser',
	        username: username
	    }, function(data) {
	        begun = data.begun;
	        loggedIn = data.loggedIn;
	        
	        accessManager = new Twilio.AccessManager(data.token);
	        messagingClient = new Twilio.IPMessaging.Client(accessManager);

	        var promise = messagingClient.getChannelByUniqueName('general');
	        promise.then(function(channel) {
	            generalChannel = channel;
	            if (!generalChannel) {
	                // If it doesn't exist, let's create it
	                messagingClient.createChannel({
	                    uniqueName: 'general',
	                    friendlyName: 'General Chat Channel'
	                }).then(function(channel) {
	                    console.log('Created general channel:');
	                    console.log(channel);
	                    generalChannel = channel;
	                    setupChannel();
	                    
	                
	                });
	            } else {
	                console.log('Found general channel:');
	                console.log(generalChannel);
	                setupChannel();
	                console.log("begun is " + begun);
	                
	            }
	        });
	    });

	    function setupChannel() {
	        generalChannel.join().then(function(channel) {
	            print('Joined channel as ' 
	                + '<span class="me">' + username + '</span>.', true);
	        });
	        generalChannel.on('messageAdded', function(message) {
	                printMessage(message.author, message.body);
	        });

	        if (!begun && loggedIn) {
	        	console.log("username " + username);
	    
	            generalChannel.on('messageAdded', function(message) {
	                $.ajax({
	                    url: '/search',
	                    data: {"track": message.body}
	                  }).done(function (data) {
	                    console.log("retrieved search hits");
	                    var track = data.tracks.items[0].id;
	                    console.log("track id " + track);

	                    $.ajax({
	                        url: '/addTracks',
	                        data: {"uris": ["spotify:track:" + track]}
	                    }).done(function (data) {
	                        console.log(data);
	                    })
	                })
	             	var innerHeight = $("#messages-container").css("height");
	             	$("#chat-server-container").css("height", innerHeight);

	            });
	        }
	        print('To add a song to your playlist, type the song title into the field below and press enter.')

	    }

	    // Send a new message to the channel
	    var $input = $('#chat-input');
	    $input.on('keydown', function(e) {
	        if (e.keyCode == 13) {
	            generalChannel.sendMessage($input.val())
	            $input.val('');
	        }
	    });
	}
}]);

//controller for handling actions on the playlist title selection page
traxControllers.controller('formCtrl', ['$scope', '$http',
	function($scope, $http) {
     	$scope.submit = function() {
	      $.ajax({
	            url: '/addPlaylist',
	            data: {"playlistName": $scope.title}
	        }).done(function (data) {
	        	console.log("my data " + data.redirectUrl);
	            window.location.href = '/#' + data.redirectUrl;

	        })
      };

}]);









































