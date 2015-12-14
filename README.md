# DecodedEpisode2

In decoded episode 2, we aim to show you a recipe that allows you to quickly get started with server side code. We'll take you on the journey from a simple purely client-side application to a server-driven application that collates information from multiple data sources. Let's get started!

# How this repo works:#

This repo is set up using git tags to allow you to see each stage of development as we go along. Just check out the commit associated with each tag and you can see the app evolve as we go!

# Prerequisites:

You will need [node](http://www.nodejs.org "node") and an editor of your choice to view and edit code. I personally like [Visual Studio Code](https://code.visualstudio.com/), but use what's most comfortable for you.

## Part 1 - Good old HTML:  ##

Our solution starts with the "part1" tag on the repo. In this commit, we have some static HTML with some bootstrap to help us out with styling, but apart from that, it's pretty barebones. It's not really an application - yet. That's where we pull in some JavaScript and node.

**Key technologies:**

- HTML

## Part 2 - Adding in the server: ##

Moving on the "part2" tag, we now have a simple node backend that serves up dummy data for the JavaScript to render on the page. All of our copy-pasted HTML has been deleted and replaced with JavaScript. This is starting to look like a real application!

**Key technologies:**

- Node
- npm
- Restify
- JavaScript
- jQuery

## Part 3 - Getting some real data: ##

In the "part3" tag, we are now pulling in some real data on the back end. While we could have just used native capabilities in node to fetch data from the GitHub API, why go through all that work when we have the huge library of code that NPM has to offer us? Fortunately for us, there is a github package on npm that allows us to call and handle data from the GitHub API with just a few lines of code. Lucky us! Now we have real data in our app!

**Key technologies:**

- npm
- github package on npm

## Part 4 - Persistence

In the "part4" tag, we've now added MongoDB to the mix, courtesy of [MongoLabs](https://mongolab.com/) and [Microsoft Azure](https://azure.microsoft.com/). Now you can favorite a repo and have that preference persist across sessions! To do that, we pulled in another package from npm ("mongodb") and used that to do some simple persistence to our free Mongo server.

**Key technologies:**

- npm
- mongodb package on npm
- MongoLabs
- Microsoft Azure

## Part 5 - Authentication and Identity

In "part5", we want to add in authentication to our application and ensure that your favorites are visible to you and you alone. To do that, we utilize the Open Source [KurveJS](https://github.com/MicrosoftDX/kurvejs) library to connect to Azure Active Directory. We also incorporate the user ID and client ID into the MongoDB documents to ensure that when we pull in a user, we only pull in favorites associated with that user.

**Key technologies:**

- KurveJS
- Azure Active Directory