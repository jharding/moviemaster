
/**
 * Module dependencies.
 */

var conf = require('./conf');
var express = require('express');
var Pusher = require('pusher');
var mongoose = require('mongoose');
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
var mongooseAuth = require('mongoose-auth');

// Initializing Pusher

var pusher = new Pusher({
  appId: conf.pusher.appId,
  appKey: conf.pusher.appKey,
  secret: conf.pusher.secret
});

// Defining Mongoose Schemas

var ClipSchema = new Schema({
  title: String,
  year: Number,
  director: String, // could be an array
  acotrs: [ String ],
  url: String
});

var GameSchema = new Schema({
  created: { type: Date, default: Date.now },
  clips: [ ObjectId ], // should this be ids or embedded documents?
  players: [ ObjectId ],
  status: {
    type: String,
    enum: [ 'waiting', 'inProgress', 'finished' ],
    default: 'waiting'
  }
});

var UserSchema = new Schema({
  points: { type: Number, min: 0, default: 0 },
  victories: { type: Number, min: 0, default: 0 }
});

UserSchema.plugin(mongooseAuth, {
  everymodule: {
    everyauth: {
      User: function() {
        return User;
      }
    }
  },

  facebook: {
    everyauth: {
      myHostname: conf.server.hostname,
      appId: conf.facebook.appId,
      appSecret: conf.facebook.appSecret,
      redirectPath: conf.facebook.redirect
    }
  }
});

// Initializing Mongoose Models

var Clip = mongoose.model('Clip', ClipSchema);
var Game = mongoose.model('Game', GameSchema);
var User = mongoose.model('User', UserSchema);

mongoose.connect(conf.mongo.uri);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.logger());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(mongooseAuth.middleware());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Route Middleware

function verifyUser(req, res, next) {
  if (req.loggedIn) {
    next();
  }

  else {
    if (req.xhr) {
    var response = { success: false };
    res.send(response);
    }

    else {
      res.redirect('/login');
    }
  }
}

function verifyGameOpening(req, res, next) {
  // TODO
}

// User Management Routes

app.get('/login', function(req, res) {
  res.render('login', {
    title: 'Log In'
  });
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/login');
});

// Lobby

app.get('/', verifyUser, function(req, res) {
  res.render('lobby', {
    title: 'Lobby'
  });
});

// Lobby API

app.get('/games', verifyUser, function(req, res) {
  // TODO
});

// Game Creation and Joining

app.post('/game', verifyUser, function(req, res) {
  // TODO
});

app.get('/game/:id', [verifyUser, verifyGameOpening], function(req, res) {
  // TODO
});

// Game API

app.post('/game/:id/answer', verifyUser, function(req, res) {
  // TODO
});

app.del('game/:id', verifyUser, function(req, res) {
  // TODO
});

mongooseAuth.helpExpress(app);

app.listen(conf.server.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
