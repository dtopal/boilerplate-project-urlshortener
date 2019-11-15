'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var url = require('url');
var valid = require('valid-url');

var cors = require('cors');

require('dotenv').config();

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI);

var Schema = mongoose.Schema;
var addressSchema = new Schema({
  original: { type: String, required: true },
  short: { type: Number, required: true }
});
var Address = mongoose.model("Address", addressSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// urlshortner API
app.post("/api/shorturl/new", function (req, res) {
  var uri = req.body.url;

  //format check
  if (valid.isWebUri(uri) === undefined) {
    res.json({ "error": "invalid URL" });
    return;
  }

  //check if hostname is valid
  var curr = url.parse(uri);
  var hostname = curr.hostname;

  var options = { all: true };
  dns.lookup(hostname, options, function(err, address, family) {
    if (err) {
      res.json({ "error": "invalid URL" });
      console.error(err);
      return;
    };
  });

  //if uri is in db then just return object
  Address.find({ original: uri }, function (err, data) {
    if (err) return console.error(err);
    //console.log('in db: ' + uri);
    //console.log(data);
    if (data.length === 0) {
      console.log('not found: ' + uri);
      Address.estimatedDocumentCount(function(err, count){
        var newAdd = new Address({
          original: uri,
          short: count + 1
        });
        console.log(newAdd);
        newAdd.save();
        res.json({ original_url: newAdd.original, short_url: newAdd.short });
        })
    }

    if (data.length > 0) {
      console.log('found in db: ' + data[0].original);
      res.json({ original_url: data[0].original, short_url: data[0].short });
    };
  });


  //res.json({ "url": req.body.url });
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
