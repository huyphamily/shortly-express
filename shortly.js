var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'secret code'}));

app.get('/', util.loggedIn, function(req, res, next){
  res.render('index');
});

app.get('/create', util.loggedIn, function(req, res){
  res.render('index');
});

app.get('/links', util.loggedIn, function(req, res) {

  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });

});

app.get('/logout',
function(req, res) {
  delete req.session.user;
  res.redirect('/login');
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

//--------------------------------should modulize
app.post('/login', function(req, res){
  //grab username and password
  var username = req.body.username;
  var password = req.body.password;
  console.log('post was call in login');
  //search for user
  new User({username: username})
    .fetch()
    .then(function(model){
      //if user exist
      console.log('model', model);
      if(model){
        //check if password matches
        model.checkPass(password, function(result){
          //if it is a match
          if(result){
            //create session
            req.session.regenerate(function(){
              req.session.user = true;
              res.redirect('/');
            });
          }
        });
      //if user doesn't exist
      } else {
        // alert('Username does not exist');
        res.redirect('/login');
      }
    });
});

//-------------------------------
app.post('/signup', function(req, res){
  var username = req.body.username;
  var password = req.body.username;
  console.log('post was call in signup');

  //check for username
  new User({username: username})
    .fetch()
    .then(function(model){

      console.log('model', model);
      //if user doesn't exist
      if(!model){
        new User({username: username})
          .save()
          .then(function(model){
            model.hashPass(password);
          })
          .then(function(){
            //create session
            req.session.regenerate(function(){
              req.session.user = true;
              res.redirect('/');
            });

          });
      //if username already exist
      } else {
        //need to refactor later
          //check if password matches
          model.checkPass(password, function(result){
            //if it is a match
            if(result){
              //create session
              req.session.regenerate(function(){
                req.session.user = true;
                res.redirect('/');
              });
            }

          });
      }
      
    });

});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
