

var knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : 'localhost',
    user     : 'root',
    password : '1234',
    database : 'dupe',
    charset  : 'utf8'
  }
});

var fuzzy = require('fuzzy');
var Q = require("Q");
var Levenshtein = require("levenshtein");
var natural = require("natural");
var stringSimilarity = require('string-similarity');

// When the app starts
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var bookshelf = require('bookshelf')(knex);
var static = require("express-static");
var path    = require('path');      // Also loading the path module

var PythonShell = require('python-shell');

// parse application/json
app.use(bodyParser());

app.set('view engine', 'jade');
app.set('bookshelf', bookshelf);

// The static middleware must come after the sass middleware
app.use(express.static( path.join( __dirname, 'public' ) ) );

// elsewhere, to use the bookshelf client:
var bookshelf = app.get('bookshelf');

var Document = bookshelf.Model.extend({
  tableName: 'documents'
});

app.get("/", function(req, res) {
	Document.fetchAll()
		.then(function(collection) {
			res.render('index', { title: 'Hey', message: 'Hello there!', documents: collection});
		});
});

//select id, `match` from documents where `match` > ((select `match` from documents where id = 26) - 10) and `match` < ((select `match` from documents where id = 26) + 10);

//select id, ratio, partialRatio, tokenSortRatio, tokenSetRatio from documents where   ratio between (select ratio from documents where id=50)-2 and (select ratio from documents where id=50)+2 and partialRatio between (select partialRatio from documents where id=50)-2 and (select partialRatio from documents where id=50)+2 and tokenSortRatio between (select tokenSortRatio from documents where id=50)-2 and (select tokenSortRatio from documents where id=50)+2 and tokenSetRatio between (select tokenSetRatio from documents where id=50)-2 and (select tokenSetRatio from documents where id=50)+2;

app.get("/form", function(req, res) {
  Document.fetchAll()
    .then(function(collection) {
      res.render('form');
    });
});

app.post("/documents", function(req, res) {
  var title = req.body.title;
  var body = req.body.body;
  var options = {
    args: [body]
  };
  var pyshell = new PythonShell('fuzzy.py', options);
  pyshell.on('message', function(message) {
    message = message.split(",");
    var ratio = message[0];
    var partialRatio = message[1];
    var tokenSortRatio = message[2];
    var tokenSetRatio = message[3];
    var control = "If there is such a thing as being too conservative to be elected president of the United States, Ted Cruz is having none of it. Announcing his candidacy for the Republican nomination Monday at Liberty University, the first-term senator from Texas offered himself as the pure essence of conservatism and challenged the tea party and evangelical wings of the Republican Party to rise up behind one of their own and take control of the party and the country. His candidacy is a test of a proposition, one that he has carried across the country for many months. He has argued that the party failed to win the White House not because it has become too conservative but because Republicans have nominated politicians who were not conservative enough, who could not carry the message of today’s conservatism with energy, optimism and authenticity. [Your online guide to Ted Cruz] Frustrated by the campaigns of Mitt Romney in 2012 and John McCain in 2008, many conservatives agree. Whether Cruz can become the vehicle to prove the merits of his argument is the challenge he now faces, both in the preliminary contest to become the favorite of the insurgent conservative wing of his party and then to show that he is capable of defeating a skeptical establishment for the nomination. Cruz, Obama have more in common than you think(1:47) Ted Cruz doesn't get compared to President Obama very often, but the senator's speech announcing his 2016 presidential bid reminds The Post's Chris Cillizza of the rhetoric and positioning that the current occupant of the White House used in the early days of his own national ambitions. (The Washington Post) In his short time on the national stage, no politician has captivated grass-roots conservatives quite like Cruz. Elected to the Senate in 2012 over a weak establishment Republican, Cruz has become a star on the right, a politician who has shown almost perfect pitch before conservative audiences, with a message of smaller government, less regulation, a return to the Constitution, and the central role of faith and Christian values in governing. Nor has any politician so irritated fellow Republican elected officials or the party establishment, challenging his leaders in the Senate, urging on conservative rebels in the House and helping to engineer the partial shutdown of the government in 2013. If there is a senator who has had chillier relations with his colleagues, it would be hard to name that person. The two go hand in hand — appealing to grass-roots conservatives and taking on the establishment — and Cruz has skillfully cultivated his standing as both a conservative firebrand and a Washington outsider, as much a critic of what he sees as his own party’s unprincipled leadership as of the policies of President Obama and the Democrats. Cruz’s announcement of candidacy officially launched the 2016 campaign, though it has obviously been underway for months, with cattle calls for candidates and multiple visits to Iowa, New Hampshire and South Carolina by GOP contenders. Other candidates will soon follow him into the ring, Republicans as well as the Democrats’ leading contender, Hillary Rodham Clinton. But as the field of Republicans quickly fills out, Cruz will find the competition bracing. On the right, he will be elbowed most directly by people like Mike Huckabee, the former governor of Arkansas; Rick Santorum, the former senator from Pennsylvania; Bobby Jindal, the governor of Louisiana; and Ben Carson, the renowned neurosurgeon, among others.";
    var jaro = natural.JaroWinklerDistance(body, control);
    var distance = new Levenshtein(body, control).distance;
    var similarity = stringSimilarity.compareTwoStrings(body, control);
    new Document({title:title, body:body, ratio:ratio, partialRatio:partialRatio, tokenSortRatio: tokenSortRatio, tokenSetRatio:tokenSetRatio,distance:distance,match:ratio*partialRatio*tokenSortRatio*tokenSetRatio, jaro:jaro, similarity: similarity}).save()
      .then(function(model) {
        res.redirect("/");
      });
  });
});

app.get("/documents/:id/delete", function(req, res) {
  new Document({"id":req.params.id}).fetch()
    .then(function(model) {
      model.destroy();
      res.redirect("/");
    });
});

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})
