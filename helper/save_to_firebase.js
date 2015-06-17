'use strict';

var https = require("https"),
    util = require('util'),
    someData = {
        //jbandi: ""
        //content: "test " + new Date(),
        //user: "test_jb",
        //'.priority': Date.now()
        //users: {
            test_jb: {
                access_token: "",
                access_token_secret: ""
            }
        //}
    };


var req = https.request({
    hostname: "scorching-inferno-3523.firebaseio.com",
    //method: "POST",
    //path: "/posts/test_jb.json"
    method: "PUT",
    path: "/users.json?auth=XXX"
}, function (res) {
  console.log("Response: " + util.inspect(res.statusCode));
}

);
req.end(JSON.stringify(someData));

req.on('error', function(e) {
    console.error(e);
});



