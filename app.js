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
    user("users", profile.login, "repos").get({per_page: 100}, function (err, json) {
      var data = {};
      json.forEach(function (repo) {
        data[repo.full_name] = 'tx1=' + repo.full_name;
        rem.url('https://raw.github.com/' + repo.full_name + '/master/.gitshirt').get(function (req, res) {
          if (res.statusCode == 200) {
            rem.consume(res, function (bin) {
              if (String(bin).indexOf('<html') == -1) {
                console.log('Loaded .gitshirt from ' + repo.full_name);
                data[repo.full_name] = bin;
              }
            })
          }
        });
      });

      app.get('/repos', function (req, res) {
        res.setHeader('content-type', 'text/html')
        res.send(Object.keys(data).map(function (key) {
          return '<b>' + key + '</b>: <a href="/#' + data[key] + '">' + key + '</a><br>';
        }).join(''));
      });
    });
  });
});

app.listen(5000);
console.log('Listening on port http://localhost:5000');