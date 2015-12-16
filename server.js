var NUM_PACKAGES_TO_SHOW = 10;

var restify = require('restify');
var GitHubApi = require("github");
var mongo = require('mongodb').MongoClient;
var request = require('request');
var Registry = require('npm-registry');

var mongoUser = process.env.DECODED_MONGO_USER;
var mongoPassword = process.env.DECODED_MONGO_PASSWORD;
var mongoServer = process.env.DECODED_MONGO_SERVER;
var mongoUri = "mongodb://" + mongoUser + ":" + mongoPassword + "@" + mongoServer;
var aadClientID = process.env.DECODED_CLIENT_ID;
var aadCallbackUrl = process.env.DECODED_CALLBACK_URL;
var port = process.env.PORT;
var npmTopPackagesUrl = "https://raw.githubusercontent.com/nexdrew/all-stars/master/packages.json";
var npm = new Registry();

var numProcessed = 0;

var markRepo = function (db, req, packageName, packageRank, payload, numToShow, res) {
    var favorites = null;
    var objToFind = {
        user: req.params.user,
        repo: packageName,
        userid: null,
        tenantid: null
    };
    var userid = req.header("userid");
    var tenantid = req.header("tenantid");
    if (userid != null && tenantid != null) {
        favorites = db.collection('favorites');
        objToFind.userid = userid;
        objToFind.tenantid = tenantid;
    } else {
        favorites = db.collection('favorites_noauth');
    }
    favorites.find(objToFind).next(function (err, doc) {
        var item = { name: packageName, rank: packageRank, favorite: false };
        if (doc !== null) {
            item.favorite = true;
        }
        payload.push(item);
        numProcessed++;
        if (numProcessed === numToShow) {
            db.close();
            payload.sort(function (a, b) {
                if (a.rank < b.rank) {
                    return -1;
                }
                if (a.rank > b.rank) {
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
server.get("identitycreds", function (req, res, next) {
    res.send({
        clientID: aadClientID,
        callbackURL: aadCallbackUrl
    });
});
server.get("/contributors/:repo", function (req, res, next) {
    var github = new GitHubApi({
        version: "3.0.0"
    });
    npm.packages.get(req.params.repo, function (err, packageDetails) {
        var gitHubInfo = packageDetails[0].github;
        github.repos.getContributors({
            user: gitHubInfo.user,
            repo: gitHubInfo.repo,
            per_page: 10
        }, function (err, response) {
            res.send(response);
        });
    });

    next();
});
server.get("/repos", function (req, res, next) {
    request(npmTopPackagesUrl, function (error, response, body) {
        numProcessed = 0;
        var packages = JSON.parse(body);
        var packageNames = Object.keys(packages).slice(0, NUM_PACKAGES_TO_SHOW);
        var payload = [];
        var num_processed = 0;
        mongo.connect(mongoUri, function (err, db) {
            packageNames.forEach(function (package) {
                markRepo(db, req, package, packages[package].rank, payload, NUM_PACKAGES_TO_SHOW, res);
            });
        });
    });
});
server.post("/favorite/:repo", function (req, res, next) {
    mongo.connect(mongoUri, function (err, db) {
        var favorites = null;
        var userid = req.header("userid");
        var tenantid = req.header("tenantid");
        var favDoc = {
            repo: req.params.repo,
            userid: userid,
            tenantid: tenantid
        };

        var isFavorite = req.params.isFavorite;

        if (userid != null && tenantid != null) {
            favorites = db.collection('favorites');
        } else {
            favorites = db.collection('favorites_noauth');
        }

        if (isFavorite) {
            favorites.insertOne(favDoc);
        } else {
            favorites.findOneAndDelete(favDoc, null, function (err, result) {
                if (err != null) {
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

server.listen(port, function () {
    console.log("Listening for requests");
});
