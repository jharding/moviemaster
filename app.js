
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
  directors: [ String ], // could be an array
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
	Game.find(conditions, function(err, docs){
		var userArray = [];
		var playersArray = docs[0].players;
		for(var i=0; i< playersArray.length; i++){
			userArray.push(playersArray[i]._id+"");
			console.log("user array id element is : " + typeof playersArray[i]._id);
		}	
		console.log("user Array " + userArray);
		console.log("request params: " + req.user._id);
		console.log("request params type: " + typeof req.user._id);
		if(userArray.indexOf(req.user._id) == -1){
				Game.update(conditions, update, function(err, docs){
					if(!err){
						Game.find(conditions, function(err, doc){
							res.render('game', doc[0]);
								if(doc[0].players.length > 3){	
									var gameListChannel = pusher.channel("gameList");
									var gameListInactiveEvent = "markInactiveEvent";
									var gameListInactiveData = conditions;	
									gameListChannel.trigger(gameListInactiveEvent, gameListInactiveData, function(err, request, response){
								});
							}else{
								var gameListChannel = pusher.channel("gameList");
								var gameListIncrementEvent = "incrementEvent";
								var gameListIncrementData = conditions;
								gameListChannel.trigger(gameListIncrementEvent, gameListIncrementData, function(err, request, reponse){
								});
								var updateUserChannel = pusher.channel(req.params.id);
								var updateUserEvent = "newUsers";
								var updateUserData = doc[0].players;
								updateUserChannel.trigger(updateUserEvent, updateUserData, function(err, request, response){
							});	
							}
						});	
					}
			});
		}else{
			res.render('game', docs[0]);
		}
	});
	  // TODO
});

// Game API


function levenshtein(str1, str2) {
    var l1 = str1.length, l2 = str2.length;
    if (Math.min(l1, l2) === 0) {
        return Math.max(l1, l2);
    }
    var i = 0, j = 0, d = [];
    for (i = 0 ; i <= l1 ; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (j = 0 ; j <= l2 ; j++) {
        d[0][j] = j;
    }
    for (i = 1 ; i <= l1 ; i++) {
        for (j = 1 ; j <= l2 ; j++) {
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1, 
                d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
            );
        }
    }
    return d[l1][l2];
}
app.post('/game/:id/start', verifyUser, function(req, res){
	var conditions = {_id: req.params.id};
	var update = { $set: { status: 'inPorogress'}}; 
	Game.update(conditions, update, function(err){
		var channel = pusher.channel(req.params.id);
		var data = "startGame";
		var pusherEvent = "startGame";
		channel.trigger(pusherEvent, data, function(err, request, response){
		});
	});
});
app.get('/game/:id/:clipId/:question/:answer', verifyUser, function(req, res) {
	
	
	Clip.findOne({_id: req.params.clipId}, function(err, doc) {
		
		if (!err) {
			var result;
			switch(req.body.question) {
				case "title": 
					
					var userTitle = 
						req.body.answer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					var answerTitle = 
						doc.title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					console.log(userTitle);
					console.log(answerTitle);
					
					if (levenshtein(userTitle, answerTitle) < (answerTitle.length * 0.20)) {
						result = 'right';
					}
					else {
						result = 'wrong';
					}
					req.send({userId: req.user._id, question: req.body.question, result: result});
					break;
				case "year": 
					
					if (req.body.answer == doc.year) {
						result = 'right';
					}
					else {
						result = 'wrong';
					}
					
					break;
				case "director": 
					var userDirector = 
						req.body.answer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					for (var i = 0; i < doc.directors.length; i++) {
						var answerDirector = 
							doc.directors[i].replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
						//console.log(userDirector);
						//console.log(answerDirector);
						if (levenshtein(userDirector, answerDirector) < (answerDirector.length * 0.20)) {
							result = 'right';
						}
						else {
							result = 'wrong';
						}
						
					}
					break;
				case "actor": 
					var userActor = 
						req.body.answer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					for (var i = 0; i < doc.actors.length; i++) {
						var answerActor = 
							doc.actors[i].replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
						//console.log(userDirector);
						//console.log(answerDirector);
						if (levenshtein(userActor, answerActor) < (answerActor.length * 0.20)) {
							result = 'right';
						}
						else {
							result = 'wrong';
						}
						
					}
					break;
				default: 
					//TODO
					break;
				
			}
			var gameListChannel = pusher.channel("gameList");
			var gameListIncrementEvent = "answerEvent";
			//var gameListIncrementData = conditions;
			gameListChannel.trigger(gameListIncrementEvent, {userId: req.user._id, question: req.body.question, result: result});
			if (result == 'right') {
				User.update({_id: req.user._id}, {$inc: {points: 1}}, {multi: false}, function(err, doc){});
			}
			res.send();
		}
		else {
			//TODO
		}
	});
	
	
	
});

app.del('game/:id', verifyUser, function(req, res) {
  // TODO
  var conditions = {_id: req.params.id},	update = {$set : {status: 'finished'}};
  Game.update(conditions, update, function(err){
				  	//pusher sends game over signal
			var userConditions = {_id: req.user._id},
					userUpdate={$inc: {victories: 1}};
			User.update(userConditions, update, function(err){
				var channel = pusher.channel(conditions._id);
				var endGameData = "endGame";
				var pusherEndGameEvent = "endGame";
				channel.trigger(pusherEndGameEvent, endGameData, function(err, request, response){
				});
			});	
  }); 
});

var randGame = function(){
	var count = 4;
	gameArray = [];
	while(gameArray.length < 3){
		rand = Math.floor(Math.random()*count);
		if(gameArray.indexOf(rand) == -1){
			gameArray.push(rand);
		} 
	}
	return gameArray;
}

mongooseAuth.helpExpress(app);

app.listen(conf.server.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
