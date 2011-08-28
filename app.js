require('nko')('Rjtuc6pfUq+RSg+b');
/**
 * Module dependencies.
 */

var conf = require('./conf');
var express = require('express');
var Pusher = require('pusher');
var mongoose = require('mongoose');
var und = require('underscore')._;
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
var RedisStore = require('connect-redis')(express);
// Configuration

app.configure(function(){
  app.use(express.logger());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat", store: new RedisStore}));
  app.use(mongooseAuth.middleware());
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){

  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
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
	var query = Game.find({_id:req.params.id, status: 'waiting'}, function(err, doc){
		if(doc.length > 0 && doc[0].players.length < 4){
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
	var count = 10;
	console.log("called for score board");
	if(req.params.count){
		count = req.params.count;
	}
	var leaderQuery = User.find({});
	leaderQuery.sort('victories', -1);
	leaderQuery.limit(count);
	leaderQuery.exec(function(err, docs){
    if (!err) {
      res.render('lobby', {
        title: 'Lobby',
        leaders: docs
      });
    }

    else {
      res.render('lobby', {
        title: 'Lobby',
        leaders: {}
      });
    }
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
				numPlayers: docs[i].players.length,
                fbIds: und.map(docs[i].players, function(player){
                                   return player.fb.id;
                               })
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
	var query = Clip.find({});
	var myRandGame = randGame();
	query.limit(1);
	query.skip(myRandGame[0]);
	query.exec(function (err, docs){
		gameInstance.clips.push(docs[0]);
		query.skip(myRandGame[1]);
		query.exec(function (err, docs){
			gameInstance.clips.push(docs[0]);
			query.skip(myRandGame[2]);
			query.exec(function (err, docs){
				gameInstance.clips.push(docs[0]);
					gameInstance.save(function(err){
						if(!err){
							console.log("game instance " + gameInstance._id);
							res.redirect('/game/'+gameInstance._id+'/');
						// 	var gameListChannel = pusher.channel("gameList");
						// 	var gameListNewGameEvent = "newGameEvent";
						// 	var gameListNewGameData = {gameName:req.body.gameName, id:gameInstance._id, numPlayers:0};	
						// 	gameListChannel.trigger(gameListNewGameEvent, gameListNewGameData, function(err, request, response){
						// });

						}else{
							console.log("game instance is fucked up !");
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
			userArray.push(playersArray[i]._id);
			console.log("user array id element is : " + typeof playersArray[i]._id);
		}	
		console.log("user Array " + userArray);
		console.log("request params: " + req.user._id);
		console.log("request params type: " + typeof req.user._id);
		if(userArray.indexOf(req.user._id) == -1){
				Game.update(conditions, update, function(err){
					if(!err){
						Game.find(conditions, function(err, doc){
								var responseDoc = doc[0];
								for(var j = 0; j < responseDoc.players.length; j++){
									responseDoc.players[j].userPosition = j; 			
								}
                res.render('game', responseDoc);
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
                  gameListIncrementData.id = conditions._id;
                  gameListIncrementData.gameName = doc[0].gamename;
									gameListIncrementData.fbIds = und.map(doc[0].players, function(player){
                    return player.fb.id;
                  });
								gameListChannel.trigger(gameListIncrementEvent, gameListIncrementData, function(err, request, reponse){
								});
							}
              var updateUserChannel = pusher.channel(req.params.id);
              var updateUserEvent = "newUsers";
              //var updateUserData = doc[0].players;
							//for(var j = 0; j < responseDoc.players.length; j++){
							//		updateUserData[j].userPosition = j; 			
							//}
              updateUserChannel.trigger(updateUserEvent, responseDoc.players, function(err, request, response){
							});	
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
	var update = { $set: { status: 'inProgress'}}; 
	Game.update(conditions, update, function(err){
		Game.find(conditions, function(err, docs){
			var channel = pusher.channel(req.params.id);
			var pusherEvent = "startGame";
			var data = docs[0].players;
			for(var j = 0; j < data.length; j++){
					data[j].userPosition = j; 			
			}
			res.send();
			channel.trigger(pusherEvent, data, function(err, request, response){
			});
		});
	});
});


app.post('/game/:id/answer', verifyUser, function(req, res) {
	
	var clipId = req.body.clipId;
	var result = '';
	var answer;
	/* special case for question actor */
	if (req.body.question == "actor") {
		Game.findById(req.params.id, function(err, game) {
			/* find clip index */
			var clipIndex;
			for (clipIndex = 0; clipIndex < game.clips.length; clipIndex++) {
				if (game.clips[clipIndex]._id == req.body.clipId) {
					console.log(clipIndex + "!!!!!!!!!!!!");
					break;
				}
			}
			
			var userActor = 
				req.body.answer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
			for (var actorIndex = 0; actorIndex < game.clips[clipIndex].actors.length; actorIndex++) {
				var answerActor = 
					game.clips[clipIndex].actors[actorIndex].replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
				//console.log(userActor);
				//console.log(answerActor);
				if (levenshtein(userActor, answerActor) < (answerActor.length * 0.20)) {
					result = 'right';
					answer = game.clips[clipIndex].actors[actorIndex];
					console.log(game.clips[clipIndex]);
					game.clips[clipIndex].actors.splice(actorIndex, 1);
					//game.clips[1].remove();
					console.log(game.clips[clipIndex]);
					game.save(function (err) {if(err) console.log(err)});
					break;
				}
				else {
					result = 'wrong';
					answer = '';
				}
				//console.log(levenshtein(userActor, answerActor));
				//console.log(answerActor.length * 0.20);
			}
			console.log(result);
			var gameAnswerChannel = pusher.channel(req.params.id);
			gameAnswerChannel.trigger("answerEvent", {userId: req.user._id, question: req.body.question, answer: answer, result: result});
			if (result == 'right') {
				User.update({_id: req.user._id}, {$inc: {points: 1}}, {multi: false}, function(err, doc){});
				res.send({ match: true });
			}
			else {
			    res.send({ match: false });
			}
		});
		
	}
	else {
	
	Clip.findOne({_id: clipId}, function(err, doc) {
		
		if (!err) {
			
			switch(req.body.question) {
				case "title": 
					
					var userTitle = 
						req.body.answer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					var answerTitle = 
						doc.title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					//console.log(userTitle);
					//console.log(answerTitle);
					
					if (levenshtein(userTitle, answerTitle) < (answerTitle.length * 0.20)) {
						result = 'right';
						answer = doc.title;
						break;
					}
					else {
						result = 'wrong';
					}
					break;
				case "year": 
					
					if (req.body.answer == doc.year) {
						result = 'right';
						answer = doc.year;
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
							answer = doc.directors[i];
							break;
						}
						else {
							result = 'wrong';
							answer = '';
						}
						
					}
					break;
				case "actor": //not using it for now
					var userActor = 
						req.body.answer.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
					for (var i = 0; i < doc.actors.length; i++) {
						var answerActor = 
							doc.actors[i].replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").toLowerCase();
						//console.log(userActor);
						//console.log(answerActor);
						if (levenshtein(userActor, answerActor) < (answerActor.length * 0.20)) {
							result = 'right';
							answer = doc.actors[i];
							
							
							Game.findById(req.params.id, function(err, game) {
								//console.log(doc.clips[i]);
								var j;
								for (j = 0; j < game.clips.length; j++) {
									if (game.clips[j]._id == req.body.clipId) {
										console.log(j + "!!!!!!!!!!!!");
										break;
									}
								}
								console.log(game.clips[j]);
								game.clips[j].actors.splice(i, 1);
								//game.clips[1].remove();
								console.log(game.clips[j]);
								game.save(function (err) {if(err) console.log(err)});
							});
							break;
						}
						else {
							result = 'wrong';
							answer = '';
						}
						//console.log(levenshtein(userActor, answerActor));
						//console.log(answerActor.length * 0.20);
					}
					break;
				default: 
					//TODO
					break;
				
			}
			var gameAnswerChannel = pusher.channel(req.params.id);
			gameAnswerChannel.trigger("answerEvent", {userId: req.user._id, question: req.body.question, answer: answer, result: result});
			if (result == 'right') {
				User.update({_id: req.user._id}, {$inc: {points: 1}}, {multi: false}, function(err, doc){});
        res.send({ match: true });
			}

      else {
        res.send({ match: false });
			}

		}
		else {
			console.log(err);
		}
		
		
	});
	}
	
	
	
	
	
});

app.post('/game/:id/end', verifyUser, function(req, res) {
  // TODO
  var conditions = {_id: req.params.id},	update = {$set : {status: 'finished'}};
  Game.update(conditions, update, function(err){
				  	//pusher sends game over signal
			var userConditions = {_id: req.user._id},
					userUpdate={$inc: {victories: 1}};
			User.update(userConditions, userUpdate, function(err){
				var channel = pusher.channel(conditions._id);
				var endGameData = "endGame";
				var pusherEndGameEvent = "endGame";
				channel.trigger(pusherEndGameEvent, endGameData, function(err, request, response){
				});
			});	
  });

  res.send();
});

var randGame = function(){
	var count = conf.random.num;
	gameArray = [];
	while(gameArray.length < 3){
		rand = Math.floor(Math.random()*count);
		if(gameArray.indexOf(rand) == -1){
			gameArray.push(rand);
		} 
	}
	return gameArray;
}

app.get('/leaders', verifyUser, function(req, res){
	var count = 10;
	console.log("called for score board");
	if(req.params.count){
		count = req.params.count;
	}
	var leaderQuery = User.find({});
	leaderQuery.sort('victories', -1);
	leaderQuery.limit(count);
	leaderQuery.exec(function(err, docs){
		console.log("an error happened" + err);
		res.send(JSON.stringify(docs));
	
	});
});
mongooseAuth.helpExpress(app);

app.listen(conf.server.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
