var restify = require('restify');
var mockContributors = [
	{
		login: "jill",
		avatar_url: "https://avatars0.githubusercontent.com/u/1116907?v=3&s=400",
		contributions: 9001
	},
	{
		login: "billg",
		avatar_url: "https://avatars0.githubusercontent.com/u/1116907?v=3&s=400",
		contributions: 8999
	},
	{
		login: "sally",
		avatar_url: "https://avatars0.githubusercontent.com/u/1116907?v=3&s=400",
		contributions: 5325
	},
	{
		login: "fred",
		avatar_url: "https://avatars0.githubusercontent.com/u/1116907?v=3&s=400",
		contributions: 5
	}
];

var server = restify.createServer();
server.get("/contributors", function(req, res, next) {
	res.send(mockContributors);
	next();
});
server.get(/.*/, restify.serveStatic({
	directory: __dirname,
	default: 'decoded.html'
}));

server.listen(3000, function() {
	console.log("Listening for requests");
});