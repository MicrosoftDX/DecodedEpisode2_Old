declare var require:any;
declare var process:any;
declare var __dirname:any;

var restify = require('restify');
var GitHubApi = require("github");
var mongo = require('mongodb').MongoClient;

var mongoUser = process.env.DECODED_MONGO_USER;
var mongoPassword = process.env.DECODED_MONGO_PASSWORD;
var mongoServer = process.env.DECODED_MONGO_SERVER;
var mongoUri = "mongodb://" + mongoUser + ":" + mongoPassword + "@" + mongoServer;
var aadClientID = process.env.DECODED_CLIENT_ID;
var aadCallbackUrl = process.env.DECODED_CALLBACK_URL;
var port = process.env.PORT | process.env.DECODED_PORT;

var numProcessed = 0;

var markRepo = function(db, req, repo, payload, originalPayload, res) {
	var favorites = null;
	var objToFind = {
		user: req.params.user, 
		repo: repo.name,
		userid: null,
		tenantid: null
	};
	var userid = req.header("userid");
	var tenantid = req.header("tenantid");
	if(userid != null && tenantid != null) {
		favorites = db.collection('favorites');
		objToFind.userid = userid;
		objToFind.tenantid = tenantid;
	} else {
		favorites = db.collection('favorites_noauth');
	}
	favorites.find(objToFind).next(function(err, doc) {
		var item = {name: repo.name, favorite: false};
		if(doc !== null) {
			item.favorite = true;
		}
		payload.push(item);
		numProcessed++;
		if(numProcessed === originalPayload.length) {
			db.close();
			payload.sort(function(a, b) {
				if(a.name < b.name) {
					return -1;
				}
				if(a.name > b.name) {
					return 1;
				}
				return 0;
			});
			res.send(payload);
		}
	});
};

var server = restify.createServer();
server.use(restify.bodyParser());
server.get("identitycreds", function(req, res, next) {
	res.send({
		clientID: aadClientID,
		callbackURL: aadCallbackUrl
	});
});
server.get("/contributors", function(req, res, next) {
	var github = new GitHubApi({
		version: "3.0.0"
	});
	github.repos.getContributors(
		{
			user: "nodejs",
			repo: "node",
			per_page: 10
		}, function(err, response) {
			res.send(response);
		}
	);
	next();
});
server.get("/repos/:user", function(req, res, next) {
	var github = new GitHubApi({
		version: "3.0.0"
	});
	github.repos.getFromUser(
		{
			user: req.params.user
		}, function(err, response) {
			numProcessed = 0;
			var payload = [];
			delete response.meta;
			mongo.connect(mongoUri, function(err, db) {
				for(var idx in response) {
					var repo = response[idx];
					markRepo(db, req, repo, payload, response, res);
				}
			});
		}
	)
});
server.post("/favorite/:user/:repo", function(req, res, next) {
	mongo.connect(mongoUri, function(err, db) {
		var favorites = null;
		var userid = req.header("userid");
		var tenantid = req.header("tenantid");
		var favDoc = {
			user: req.params.user, 
			repo: req.params.repo,
			userid: userid,
			tenantid: tenantid
		};
		
		var isFavorite = req.params.isFavorite;
		
		if(userid != null && tenantid != null) {
			favorites = db.collection('favorites');
		} else {
			favorites = db.collection('favorites_noauth');
		}
		
		if(isFavorite) {
			favorites.insertOne(favDoc);
		} else {
			favorites.findOneAndDelete(favDoc, null, function(err, result) {
				if(err != null) {
					console.log(err);
				}
			});
		}
		db.close();
		res.send("OK");
		//We attempt to remove the favorite
	});
});
server.get(/.*/, restify.serveStatic({
	directory: __dirname,
	default: 'decoded.html'
}));

server.listen(port, function() {
	console.log("Listening for requests");
});