var restify = require('restify');
var GitHubApi = require("github");
var mongo = require('mongodb').MongoClient;

var mongoUser = "USER";
var mongoPassword = "PASS";
var mongoServer = "YOURSERVER";
var mongoUri = "mongodb://" + mongoUser + ":" + mongoPassword + "@" + mongoServer;

var numProcessed = 0;

var markRepo = function(db, req, repo, payload, originalPayload, res) {
	var favorites = null;
	var objToFind = {user: req.params.user, repo: repo.name};
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
		var item = {name: repo.name};
		if(doc !== null) {
			item.favorite = true;
		} else {
			item.favorite = false;
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
		var favDoc = {user: req.params.user, repo: req.params.repo};
		var userid = req.header("userid");
		var tenantid = req.header("tenantid");
		if(userid != null && tenantid != null) {
			favorites = db.collection('favorites');
			favDoc.userid = userid;
			favDoc.tenantid = tenantid;
		} else {
			favorites = db.collection('favorites_noauth');
		}
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

server.listen(2346, function() {
	console.log("Listening for requests");
});