var restify = require('restify');
var GitHubApi = require("github");
var mongo = require('mongodb').MongoClient;

var mongoUser = "USER";
var mongoPassword = "PASS";
var mongoServer = "YOURSERVER";
var mongoUri = "mongodb://" + mongoUser + ":" + mongoPassword + "@" + mongoServer;

var numProcessed = 0;

var markRepo = function(db, user, repo, payload, originalPayload, res) {
	var favorites = db.collection('favorites_noauth');
	favorites.find({user: user, repo: repo.name}).next(function(err, doc) {
		var item = {name: repo.name};
		if(doc !== null) {
			item.favorite = true;
		} else {
			item.favorite = false;
		}
		payload.push(item);
		numProcessed++;
		console.log(numProcessed);
		if(numProcessed === originalPayload.length) {
			db.close();
			res.send(payload);
		}
	});
};

var server = restify.createServer();
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
					markRepo(db, req.params.user, repo, payload, response, res);
				}
			});
		}
	)
});
server.post("/favorite/:user/:repo", function(req, res, next) {
	mongo.connect(mongoUri, function(err, db) {
		var favorites = db.collection('favorites_noauth');
		var favDoc = {user: req.params.user, repo: req.params.repo};
		//We attempt to remove the favorite
		favorites.findOneAndDelete(favDoc, null, function(err, result) {
			if(result.value == null) {
				//The favorite doesn't exist. Create it.
				favorites.insertOne(favDoc);
			}
			db.close();
			res.send("OK");
		});
	});
});
server.get(/.*/, restify.serveStatic({
	directory: __dirname,
	default: 'decoded.html'
}));

server.listen(3000, function() {
	console.log("Listening for requests");
});