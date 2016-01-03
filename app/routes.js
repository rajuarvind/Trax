
var request = require('request');
var querystring = require('querystring');
var client_id; // Your client id
var client_secret; // Your client secret
var token = '';
var playlistId = '';
require('dotenv').load();
var http = require('http');
var path = require('path');
var AccessToken = require('twilio').AccessToken;
var IpMessagingGrant = AccessToken.IpMessagingGrant;
var express = require('express');
var begun = false;
var loggedIn = false;
var playlistName = '';
var userId = '';
var fullName = '';

// Opens App Routes
module.exports = function(app) {

    // GET Routes
    // --------------------------------------------------------

    //Login to Spotify
    app.get('/login', function(req, res) {
        client_id = process.env.SPOTIFY_CLIENT_ID;
        client_secret = process.env.SPOTIFY_CLIENT_SECRET; 
        var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';
        res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
          response_type: 'code',
          client_id: client_id,
          redirect_uri: 'http://localhost:3000/callback',
          scope: scope
        }));
    });

    //Request new token after current token expires
    app.get('/refresh_token', function(req, res) {
      var refresh_token = req.query.refresh_token;
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
          code: req.query.code,
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          var access_token = body.access_token;
          res.send({
            'access_token': access_token
          });
        }
      });
    });

    //Handling post-login route
    app.get('/callback', function(req, res){
        var authOptions = {
          url: 'https://accounts.spotify.com/api/token',
          form: {
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/callback'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };



        request.post(authOptions, function(error, response, body) {
          if (!error && response.statusCode === 200 || response.statusCode == 302) {

            var access_token = body.access_token,
                refresh_token = body.refresh_token;

            token = access_token;

            var options = {
              url: 'https://api.spotify.com/v1/me',
              headers: { 'Authorization': 'Bearer ' + access_token },
              json: true
            };

            // use the access token to access the Spotify Web API
            request.get(options, function(error, response, body) {
              loggedIn = true;
              begun = false;
              userId = body.id;
              fullName = body.display_name;
            });

            // we can also pass the token to the browser to make requests from there
            res.redirect('/#/choosePlaylist');
          } else {
                res.redirect('/#' +
                  querystring.stringify({
                    error: 'invalid_token'
                  }));
            }
        });
        
    });

    
    //Search for specific track on Spotify
    app.get('/search', function(req, res) {
      var url = "https://api.spotify.com/v1/search?" +
          querystring.stringify({
            q: req.query.track,
            type: "track"
          });


      var options = {
          url: url,
          headers: { 'Authorization': 'Bearer ' + token },
          json: true
        };

      request.get(options, function (error, response, body) {
        res.send(body);
      })
    })

    //Create a new playlist
    app.get('/addPlaylist', function(req, res) {
        playlistName = '' + req.query.playlistName;
        var options = {
          url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
          body: {"name": playlistName, "public": false},
          headers: { 'Authorization': 'Bearer ' + token },
          json: true
        };

        request.post(options, function (error, response, body) {
            playlistId = '' + body.id;
            var redirectUrl = '/unique/' + playlistId;
            res.send({
              redirectUrl: redirectUrl
            });

        })
    })

    //Add tracks to a playlist 
    app.get('/addTracks', function(req, res) {
        var options = {
          url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
          headers: { 'Authorization': 'Bearer ' + token },
          body: {"uris": req.query.uris},
          json: true
        };

        request.post(options, function (error, response, body) {    
            res.send(body);
        
        })
    })

    //Get tracks in a playlist
    app.get('/getTracks', function(req, res) {
        var options = {
          url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
          headers: { 'Authorization': 'Bearer ' + token },
          json: true
        };

        request.post(options, function (error, response, body) {    
            res.send(body);
        
        })
    })

    //Set up Twilio ip chat server
    app.get('/token', function(request, response) {
      var appName = 'Trax';
      var identity = request.query.username;
      var deviceId = request.query.device;

      var endpointId = appName + ':' + identity + ':' + deviceId;

      var ipmGrant = new IpMessagingGrant({
          serviceSid: process.env.TWILIO_IPM_SERVICE_SID,
          endpointId: endpointId
      });

      var token = new AccessToken(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_API_KEY,
          process.env.TWILIO_API_SECRET
      );
      token.addGrant(ipmGrant);
      token.identity = identity;

      response.send({
          identity: identity,
          token: token.toJwt(),
          begun: begun,
          loggedIn: loggedIn
      });
      if (loggedIn) {begun = true;}

    });

    
};  