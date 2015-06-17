'use strict';
module.exports = function (configuration) {

    let request = require('request'),
        Twit = require('twit'),
        util = require('util');

    return {
        post: post
    };

    function post() {
        request('https://scorching-inferno-3523.firebaseio.com/users.json?auth=v0rJhuNr79II1naM09CyJwVkI5qO62ll3ANnkrHN', function (error, response, body) {
            let users = JSON.parse(body);
            for (let user in users) {
                console.log("Checking tweets for user: " + user);
                tweetForUser(users[user]);
            }
        })
    }

    function tweetForUser(user) {
        console.log(util.inspect(user));
        request('https://scorching-inferno-3523.firebaseio.com/posts/' + user.id + '/.json?auth=v0rJhuNr79II1naM09CyJwVkI5qO62ll3ANnkrHN', function (error, response, body) {
            console.log("Response: " + response.statusCode);
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
                        console.log(util.inspect(response.statusCode));
                    })
                }
            }
        });
    }

};
