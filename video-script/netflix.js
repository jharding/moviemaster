var httpcli = require('./node-httpclient/lib/httpclient');
var mongoose = require("mongoose");
mongoose.connect('mongodb://50.18.118.240/nodemaster-dev');
var Schema = mongoose.Schema;
var ClipSchema = new Schema({
	title: String, 
	year: Number,
	directors:[ String ],
	actors:[ String ],
	duration: Number, 
	url: String
});

var Clip = mongoose.model("Clip", ClipSchema);

var consumerKey = 'q4k2ragep8e8nd58ze8s734c';
var consumerSecret='BkDpPwRc2u';

var oAuthEscape = function(r) {
	return encodeURIComponent(r).replace("!","%21","g").replace("*","%2A","g").replace("'","%27","g").replace("(","%28","g").replace(")","%29","g");
}

var b64_hmac_sha1 = function(k,d,_p,_z){
            // heavily optimized and compressed version of http://pajhome.org.uk/crypt/md5/sha1.js 
            // _p = b64pad, _z = character size; not used here but I left them available just in case
            if(!_p){_p='=';}if(!_z){_z=8;}function _f(t,b,c,d){if(t<20){return(b&c)|((~b)&d);}if(t<40){return b^c^d;}if(t<60){return(b&c)|(b&d)|(c&d);}return b^c^d;}function _k(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}function _s(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}function _r(n,c){return(n<<c)|(n>>>(32-c));}function _c(x,l){x[l>>5]|=0x80<<(24-l%32);x[((l+64>>9)<<4)+15]=l;var w=[80],a=1732584193,b=-271733879,c=-1732584194,d=271733878,e=-1009589776;for(var i=0;i<x.length;i+=16){var o=a,p=b,q=c,r=d,s=e;for(var j=0;j<80;j++){if(j<16){w[j]=x[i+j];}else{w[j]=_r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}var t=_s(_s(_r(a,5),_f(j,b,c,d)),_s(_s(e,w[j]),_k(j)));e=d;d=c;c=_r(b,30);b=a;a=t;}a=_s(a,o);b=_s(b,p);c=_s(c,q);d=_s(d,r);e=_s(e,s);}return[a,b,c,d,e];}function _b(s){var b=[],m=(1<<_z)-1;for(var i=0;i<s.length*_z;i+=_z){b[i>>5]|=(s.charCodeAt(i/8)&m)<<(32-_z-i%32);}return b;}function _h(k,d){var b=_b(k);if(b.length>16){b=_c(b,k.length*_z);}var p=[16],o=[16];for(var i=0;i<16;i++){p[i]=b[i]^0x36363636;o[i]=b[i]^0x5C5C5C5C;}var h=_c(p.concat(_b(d)),512+d.length*_z);return _c(o.concat(h),512+160);}function _n(b){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s='';for(var i=0;i<b.length*4;i+=3){var r=(((b[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((b[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((b[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++){if(i*8+j*6>b.length*32){s+=_p;}else{s+=t.charAt((r>>6*(3-j))&0x3F);}}}return s;}function _x(k,d){return _n(_h(k,d));}return _x(k,d);
}


var oAuthRequest = function(key, secret, url) {
	var timestamp = Math.floor(new Date().getTime()/1000);
  var nonce = '';
  for (var i = 0; i < 15; i++) { 
		nonce += String.fromCharCode(Math.floor(Math.random() * 10) + 48); 
  }            
  var u = url.split('?')[0];
	var q = url.split('?')[1];
	if (q) { 
		q = q.replace(/@/g, '%40').replace(/,/g, '%2C').replace(/:/g, '%3A').replace(/\//g, '%2F');
		var a = q.split('&'); 
	} else { 
    var a = []; 
  }            
	a.push('oauth_consumer_key=' + key);
  a.push('oauth_nonce=' + nonce);
  a.push('oauth_signature_method=HMAC-SHA1');
  a.push('oauth_timestamp=' + timestamp);
	a.push('oauth_version=1.0');
  a.sort();
	var theBody = a.join('&');            
  var theHead = 'GET&' + oAuthEscape(u) + '&';
  var sigBase = theHead + oAuthEscape(theBody);
  var theSig = b64_hmac_sha1(secret + '&', sigBase);
  var signedUrl = u + '?' + theBody + '&oauth_signature=' + oAuthEscape(theSig);
  return (signedUrl);
}

var netflixSearch = function(query, youtubeUrl, duration){
	var term = (oAuthEscape(query));
	
	var netflixReq = oAuthRequest(consumerKey, consumerSecret, "http://api.netflix.com/catalog/titles?expand=cast,directors&output=json&max_results=1&term="+term);
	var client = new httpcli.httpclient();
	client.perform(netflixReq, 'GET', function(result){
		var netflixJsonResult = JSON.parse(result.response.body).catalog_titles;
		if(netflixJsonResult != undefined){
			console.log("year : " + netflixJsonResult.catalog_title.release_year); 
			console.log("long title: " + netflixJsonResult.catalog_title.title.regular);
			console.log("short title: " + netflixJsonResult.catalog_title.title.short);
			
			var clipPersist = new Clip();
			var titleLinks = netflixJsonResult.catalog_title.link;
			for (x in titleLinks){
					if(titleLinks[x].title == "directors"){
						if(titleLinks[x].people == undefined){
							console.log("undefined link::::" + query);
							return;
						}
						if(titleLinks[x].people.link.length == undefined){
							clipPersist.directors.push(titleLinks[x].people.link.title);
						}else{
							for(var i = 0; i < titleLinks[x].people.link.length; i++){
								clipPersist.directors.push(titleLinks[x].people.link[i].title);
							} 
						}
						console.log("directors: " + clipPersist.directors);
					}
					if(titleLinks[x].title == "cast"){
						if(titleLinks[x].people == undefined){
							console.log("undefined link::::" + query);
							return;
						}
						var actors = titleLinks[x].people.link;
						for(var i = 0; i < Math.min(5, actors.length); i++){
							clipPersist.actors.push(actors[i].title);
						}		
						console.log("casts : " + clipPersist.actors);
					}
			} 
			clipPersist.year = netflixJsonResult.catalog_title.release_year;
			clipPersist.title = netflixJsonResult.catalog_title.title.regular;
			clipPersist.url = youtubeUrl; 
			clipPersist.save(function(err){
				if(!err){
					console.log("success!");
				}
			});
		}
		//console.log("people: " + JSON.stringify(netflixJsonResult.catalog_title.link));
	});
}

netflixSearch("The Roommate");
module.exports = netflixSearch;
