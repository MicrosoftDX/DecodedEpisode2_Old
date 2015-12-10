var restify = require('restify');
var GitHubApi = require("github");

var server = restify.createServer();
server.get("/contributors", function(req, res, next) {
	var github = new GitHubApi({
		version: "3.0.0",
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
	//res.send(mockContributors);
	next();
});
server.get(/.*/, restify.serveStatic({
	directory: __dirname,
	default: 'decoded.html'
}));

server.listen(3000, function() {
	console.log("Listening for requests");
});