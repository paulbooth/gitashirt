// npm install rem read express
var fs = require('fs');
var gm = require('gm');
var rem = require('rem');
var read = require('read');
var express = require('express');

// Create the application. Authentication relies on having session capability.
var app = express();
app.use(express.static(__dirname + '/static'));
app.use(express.cookieParser());
app.use(express.session({
  secret: "some arbitrary secret"
}));
app.listen(3000);

// Create the Dropbox OAuth API.
var github = rem.load('github', 3.0).prompt()
var oauth = rem.oauth(github, "http://localhost:3000/oauth/callback/");

// The oauth middleware intercepts the callback url that we set when we
// created the oauth middleware.
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");

  // Get the list of repos.
  req.user('user').get(function (err, profile) {
    req.user("users", profile.login, "repos").get({per_page: 100}, function (err, json) {
      json.forEach(function (repo) {
        console.log(repo);
        shirt_configs[repo.name] = 'tx1=' + repo.name;
        var directoryName = "./static/images/" + repo.owner.login;
        var fileName = directoryName + "/" + repo.name + ".png";
        // fs.writeFile(fileName, "", function(err) {
        //     if(err) {
        //         console.log(err);
        //     } else {
        //         console.log("The file was saved!");
        //     }
        // }); 
        if (!fs.existsSync(directoryName)) {
          fs.mkdirSync(directoryName);
        }
        gm(200, 400, "#ddff99f3")
          .font("Helvetica.ttf", 50)
          .drawText(10, 50, repo.name)
          .write(fileName, function (err) {
            // ...
            console.log("ERROR MAKING IMAGE " + repo.name);
            console.log(err);
          });
        // Try to fetch .gitshirt.
        rem.url('https://raw.github.com/' + repo.full_name + '/master/.gitshirt').get(function (req, res) {
          if (res.statusCode == 200) {
            rem.consume(res, function (bin) {
              // Github had a terrible thing that sent 404 pages as error code 200
              if (String(bin).indexOf('<html') == -1) {
                console.log('Loaded .gitshirt from ' + repo.full_name);
                shirt_configs[repo.name] = bin;
              }
            })
          }
        });
      });
      res.redirect('/');
    });
  });
}));

var shirt_configs = {};

// Login URL calls oauth.startSession, which redirects to an oauth URL.
app.get('/login/', function (req, res) {
  oauth.startSession(req, function (url) {
    res.redirect(url);
  });
});

// When the user is logged in, the "req.user" variable is set. This is
// an authenticated api you can use to make REST calls.
app.get('/', function(req, res) {
  if (!req.user) {
    res.write("<h1>Unauthenticated.</h1>");
    res.end("<a href='/login/'>Log in with OAuth</a>");
  } else {
    res.write('<h1>Authenticated.</h1>');
    res.end(Object.keys(shirt_configs).map(function (key) {
      return '<b>' + key + '</b>: <a href="/designshirt.html#' + shirt_configs[key] + '">' + key + '</a><br>';
    }).join(''));
  }
});

console.log('Visit:', "http://localhost:3000/");
