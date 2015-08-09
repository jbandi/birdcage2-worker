'use strict';
module.exports = function (configuration) {

    let request = require('request'),
        Twit = require('twit'),
        util = require('util'),
        https = require("https"),
        moment = require('moment');

    const FIREBASE_BASE = 'https://scorching-inferno-3523.firebaseio.com';
    const REST_AUTH = `auth=${configuration.firebase_secret}`;
    const URL_GET_USERS = `${FIREBASE_BASE}/users.json?${REST_AUTH}`;

    return {
        post: post
    };

    function post() {
        request(URL_GET_USERS, function (error, response, body) {
            console.log("Get users response : " + response.statusCode);
            let users = JSON.parse(body);
            for (let userId in users) {
                console.log(`Processing user: ${userId}`);
                
                let user = users[userId];
                let last_post = user.last_post || new Date(0);
                let next_tweet = moment(last_post).utc().add(user.post_interval || 60, 'minutes');
                console.log(`User post interval: ${user.post_interval}`);
                console.log(`Last post: ${moment(last_post).utc().format()}`);
                console.log(`Next tweet: ${next_tweet.format()}`);
                console.log(`Current time: ${moment().utc().format()}`);
                if (!user.active) {
                    console.log(`User ${userId} is not active.`);
                }
                else if (next_tweet.isAfter(moment().utc())) {
                    console.log(`User ${userId} is not ready to tweet. Next tweet ${next_tweet.fromNow()} `);
                }
                else {
                    console.log(`Checking tweets for user:  ${userId} / ${user.username}`);
                    user.uid = userId;
                    tweetForUser(user);

                }
            }

        })
    }

    function tweetForUser(user) {
        //console.log(util.inspect(user));
        request(`${FIREBASE_BASE}/posts/${user.uid}/.json?${REST_AUTH}&orderBy="$priority"&startAt=2&limitToFirst=1`, function (error, response, body) {
            console.log("Get latest tweet response: " + response.statusCode);
            if (!error && response.statusCode == 200) {
                console.log(`Got tweets for user ${user.uid}: ${body}`);
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

                    // update post
                    var req = https.request({
                            hostname: 'scorching-inferno-3523.firebaseio.com',
                            method: "PATCH",
                            path: `/posts/${user.uid}/${tweetId}/.json?${REST_AUTH}`
                        }, function (res) {
                            console.log("Firebase post update response: " + util.inspect(res.statusCode));
                        }
                    );
                    req.end(JSON.stringify({
                        ".priority": user.reshedule ? Date.now() : 1,
                        last_sent: new Date(),
                        sent_count: tweet.sent_count !== undefined ? ++tweet.sent_count : 0
                    }));

                    // update user
                    var req = https.request({
                            hostname: 'scorching-inferno-3523.firebaseio.com',
                            method: "PUT",
                            path: `/users/${user.uid}/last_post.json?${REST_AUTH}`
                        }, function (res) {
                            console.log("Firebase user update response: " + util.inspect(res.statusCode));
                        }
                    );
                    req.end(JSON.stringify({
                        ".sv": "timestamp"
                    }));
                }
            }
        });
    }
};
