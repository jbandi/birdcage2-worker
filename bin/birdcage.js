'use strict';
module.exports = {
  post: post
};

let Twit = require('twit');

let T = new Twit({
    consumer_key:         process.env.TWITTER_CONSUMER_KEY
  , consumer_secret:      process.env.TWITTER_CONSUMER_SECRET
  , access_token:         process.env.TWITTER_ACCESS_TOKEN
  , access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET
})

function post(message){
  T.post('statuses/update', { status: message }, function(err, data, response) {
    console.log(data)
  })
}
