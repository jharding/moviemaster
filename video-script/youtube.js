var netflixQuery = require("./netflix");
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nodemaster-dev');
var num = 0;
var fetchMore = true;
var httpcli = require('./node-httpclient/lib/httpclient');
var client = new httpcli.httpclient(); 
function youtubeRequest(req, start, max, format, version){
	return req +'?alt='+format+'&start-index='+start+'&max-results='+max+'&v='+version;
}
function retrieveFromYoutube(start, max, format, version){
		req = 'http://gdata.youtube.com/feeds/api/users/moviaknockout/favorites';
		var youtubeReq =	youtubeRequest(req, start, max, format, version); 
		
		client.perform(youtubeReq, 'GET', function(result){ 
			var feed = JSON.parse(result.response.body).feed;
			totalResult = feed.openSearch$totalResults.$t;
			for(var e in feed.entry){
				var title = feed.entry[e].title.$t;
				var netflixTitle = title.split("-")[1].trim().replace("Movie", "").trim().replace(/\([0-9]+\)/,"").trim();	
				console.log("title   :: " + title);
				console.log("netflix :: " + netflixTitle);
				netflixQuery(netflixTitle, feed.entry[e].media$group.yt$videoid.$t);
				console.log("videoid :: " + feed.entry[e].media$group.yt$videoid.$t);
				console.log("duration:: " + feed.entry[e].media$group.yt$duration.seconds);
			}
			cb(feed.entry.length);
			if(totalResult > (start + max - 1)){
				//retrieveFromYoutube(start+max, max, format, version);
			}else{
				console.log("total is :::::: " + num);
			}
	});
}

retrieveFromYoutube(5, 4, 'json', 2);


function cb(result){
	num += result;
}
