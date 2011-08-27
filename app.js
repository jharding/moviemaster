
/**
 * Module dependencies.
 */

var conf = require('./conf');
var express = require('express');
var Pusher = require('pusher');
var mongoose = require('mongoose');
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
var ObjectIdCreate = mongoose.Types.ObjectId;
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
  actors: [ String ],
  url: String
});

var GameSchema = new Schema({
  created: { type: Date, default: Date.now },
  clips: [ ClipSchema ], // should this be ids or embedded documents?
  players: [ UserSchema ],
	gamename: String,
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
	var query = Game.count({_id:req.params.id, status: 'waiting'}, function(err, count){
		if(count > 0){
			next();
		}else{
			res.send({"message":"invalid game or game has already started"});
		}
	});	
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
	var query = Game.find({status:'waiting'});
	query.exec(function (err, docs){
		//res.send(JSON.stringify(docs.length));	
		var responseJson = [];
		for(var i in docs){
			responseJson[i] = {
				gameName: docs[i].gamename,
				id: docs[i]._id,
				numPlayers: docs[i].players.length  
		    };
        }
		res.send(responseJson);
	});
});

// Game Creation and Joining

app.post('/game', verifyUser, function(req, res) {
  // TODO
	var gameInstance = new Game();
	//gameInstance.players.push(req.user._id);
             console.log("wtf");
             console.log(req.body.gameName);
	gameInstance.gamename = req.body.gameName;
	console.log(randGame());	
	var query = Clip.find({});
	query.limit(1);
	query.skip(randGame()[0]);
	query.exec(function (err, docs){
		gameInstance.clips.push(docs[0]);
		query.skip(randGame()[1]);
		query.exec(function (err, docs){
			gameInstance.clips.push(docs[0]);
			query.skip(randGame()[2]);
			query.exec(function (err, docs){
				gameInstance.clips.push(docs[0]);
					gameInstance.save(function(err){
						if(!err){
							console.log("game instance " + gameInstance._id);
							res.redirect('/game/'+gameInstance._id);
						}		
					});	
			});
		});
	}); 
});

app.get('/game/:id', [verifyUser, verifyGameOpening], function(req, res) {
	var conditions = {_id: req.params.id}
			, update = { $push: { players: req.user}}; 
	Game.update(conditions, update, function(err, docs){
		if(!err){
			Game.find(conditions, function(err, doc){
				res.render('game', doc[0]);
					if(doc[0].players.length > 3){	
						update = { $set: { status: 'inPorogress'}}; 
						Game.update(conditions, update, function(err){
							var channel = pusher.channel(conditions._id);
							var data = "startGame";
							var pusherEvent = "startGame";
							channel.trigger(pusherEvent, data, function(err, request, response){
							});
							var gameListChannel = pusher.channel("gameList");
							var gameListInactiveEvent = "markInactiveEvent";
							var gameListInactiveData = conditions;	
							gameListChannel.trigger(gameListInactiveEvent, gameListInactiveData, function(err, request, response){
							});
						});
				}else{
					var gameListChannel = pusher.channel("gameList");
					var gameListIncrementEvent = "incrementEvent";
					var gameListIncrementData = conditions;
					gameListChannel.trigger(gameListIncrementEvent, gameListIncrementData, function(err, request, reponse){
					});
				}
			});	
		}
	});
  // TODO
});

// Game API

app.post('/game/:id/answer', verifyUser, function(req, res) {
  // TODO
});

app.del('game/:id', verifyUser, function(req, res) {
  // TODO
  // var conditions = {_id: req.params.id}
  //   ,	update = {$set, {status: 'finished'}};
  //   Game.update(conditions, update, function(err){
  //   	//pusher sends game over signal
  //   }); 
});

var randGame = function(){
	var count = 3;
	gameArray = [];
	var rand1 = Math.floor(Math.random()*count);
	var rand2 = Math.floor(Math.random()*count);
	var rand3 = Math.floor(Math.random()*count);
	while(rand1 == rand2){
		rand2 = Math.floor(Math.random()*count); 
	}
	while(rand1 == rand3){
		rand3 = Math.floor(Math.random()*count);
	}
	while(rand2 == rand3){
		rand3 = Math.floor(Math.random()*count);
	}
	gameArray[0] = rand1;
	gameArray[1] = rand2;
	gameArray[2] = rand3;
	return gameArray;
}

mongooseAuth.helpExpress(app);

app.listen(conf.server.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
