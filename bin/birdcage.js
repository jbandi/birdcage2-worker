'use strict';
module.exports = function (configuration) {

    let request = require('request'),
        Twit = require('twit'),
        util = require('util'),
        https = require("https");

    let perform_loop = true;

    const FIREBASE_BASE = 'https://scorching-inferno-3523.firebaseio.com';
    const REST_AUTH = `auth=${configuration.firebase_secret}`;
    const URL_GET_USERS = `${FIREBASE_BASE}/users.json?${REST_AUTH}`;

    return {
        post: post
    };

    function post() {
        request(URL_GET_USERS, function (error, response, body) {
            console.log("Get users response: " + response.statusCode);
            let users = JSON.parse(body);
            for (let userId in users) {
                console.log("Checking tweets for user: " + userId);
                var user = users[userId];
                user.id = userId;
                tweetForUser(user);
            }
        })
    }

    function tweetForUser(user) {
        console.log(util.inspect(user));
        request(`${FIREBASE_BASE}/posts/` + user.id + '/.json?${REST_AUTH}&orderBy="$priority"&startAt=1&limitToFirst=1', function (error, response, body) {
            console.log("Get latest tweet response: " + response.statusCode);
            if (!error && response.statusCode == 200) {
                console.log("Got tweets: " + body);
                let tweets = JSON.parse(body);

                for (var tweetId in tweets) {
                    var tweet = tweets[tweetId];
                    console.log("Got tweet:" + JSON.stringify(tweet));

                    let T = new Twit({
                        consumer_key: configuration.twitter_consumer_key
                        , consumer_secret: configuration.twitter_consumer_secret
                        , access_token: user.access_token
                        , access_token_secret: user.access_token_secret
                    });

                    T.post('statuses/update', {status: tweet.content + new Date()}, function (err, data, response) {
                        console.log('Twitter post response: ' + util.inspect(response.statusCode));
                    });

                    var req = https.request({
                            hostname: 'scorching-inferno-3523.firebaseio.com',
                            method: "PATCH",
                            path: `/posts/${user.id}/${tweetId}/.json?${REST_AUTH}`
                        }, function (res) {
                            console.log("Firebase update response: " + util.inspect(res.statusCode));
                        }

                    );
                    req.end(JSON.stringify({
                        ".priority": perform_loop ? Date.now() : 1,
                        last_sent: new Date(),
                        sent_count: tweet.sent_count !== undefined ? ++tweet.sent_count : 0
                    }));
                }
            }
        });
    }
};
