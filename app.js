var express = require('express');
var rem = require('rem');

// Create Github API, prompting for key/secret.
var gh = rem.load('github', 3.0).prompt();

var app = express();

app.use(express.static(__dirname + '/static'));

// Authenticate user via the console.
rem.console(gh, {
  scope: ["user", "repo"]
}, function (err, user) {

  // List user gists.
  user('user').get(function (err, profile) {
    user("users", profile.login, "repos").get(function (err, json) {
      app.get('/repos', function (req, res) {
        res.setHeader('content-type', 'text/html')
        res.send(json.map(function (gist) {
          return '<a href="/#tx1=' + gist.full_name + '">' + gist.full_name + '</a><br>';
        }).join(''));
      });
    });
  });
});

app.listen(5000);
console.log('Listening on port http://localhost:5000');