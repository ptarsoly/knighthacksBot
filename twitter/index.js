var Twitter = require('twitter');
var fs = require('fs');
var util = require('util');

var express = require('express');
var cors = require('cors');
var app = express();

app.use(cors())
var sys = require('util')
var exec = require('child_process').exec;


var secret = {
    consumer_key: 'FAp3i1AgjUj2Xs4Y0sxd2xNaq',
    consumer_secret: '8wqoL2j3eKf6hC3TPff9PUiAksjaWNTClOfxnpHL13fGmxq9L8',
    access_token_key: '917056593098878976-bEYRGCifjPkTGLPabpKP31r3kfRjb1D',
    access_token_secret: 'u7Le9J74GqZpCDgP1aQv1bFan8daWm2ZJmtOw4ygTsFGY'
};

var client = new Twitter(secret);

var twitterHandle = 'peeplaces';

var tweets;

app.listen(3001);

app.get('/data', (req, res) => {
    res.send(JSON.stringify(tweets));
});



var incidents = 0;

var filename = './twitter/peeData.json';

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
    }
    else {
        tweets = JSON.parse(data);
        tweets.table = tweets.table || [];
	incidents = tweets.table.length;
    }
});



client.stream('statuses/filter', { track: twitterHandle }, streamData);

function streamData(stream) {
    console.log("here");
    stream.on('data', function (event) {
        console.log(util.inspect(event, { depth: 7 }));
        parseTweetData(event, fs);
    });

    stream.on('error', function (error) {
        console.log(error);
    });
}




function parseTweetData(tweet, fs) {
    if (((tweet.coordinates || tweet.place) && (tweet.entities.media[0].media_url && tweet.entities.media[0].type === 'photo'))) {
        var coords = [0, 0];
        console.log(coords);
        if (tweet.coordinates === null) {
            if (tweet.place.bounding_box.type !== 'Polygon') {
                coords[0] = tweet.place.bounding_box.coordinates[0];
                coords[1] = tweet.place.bounding_box.coordinates[1];
            }
            else {
                tweet.place.bounding_box.coordinates[0].forEach(function (element) {
                    coords[0] += element[0] / 4;
                    coords[1] += element[1] / 4;
                    
                });
            
            }

        }
        else {
            coords = tweet.coordinates;
        }
        
        var singleTweetObj = {
            'classification':null,
            'date':tweet.created_at,
            'user': tweet.user.screen_name,
            'rating': null,
            'tweet': tweet.text,
            'img': tweet.entities.media[0].media_url,
            'coordinates': coords,
            
        };
        
        if(tweet.text.search('1|2|3|4|5')>-1) {
            singleTweetObj.rating = parseInt(tweet.text[tweet.text.search('1|2|3|4|5')]);
        }
         // clean toilet, dirty toilet, urinal
        if(tweet.text.toLowerCase().search("urinal")>-1) {
            singleTweetObj.classification = "Urinal";
        }
        else if((tweet.text.toLowerCase().search("clean")>-1)&&(tweet.text.toLowerCase().search("toilet")>-1)) {
            singleTweetObj.classification = "Clean Toilet";
        }
        else if((tweet.text.toLowerCase().search("dirty")>-1)&&(tweet.text.toLowerCase().search("toilet")>-1)) {
            singleTweetObj.classification = "Dirty Toilet";
        }
        else if((tweet.text.toLowerCase().search("no")>-1)&&(tweet.text.toLowerCase().search("toilet")>-1)) {
            singleTweetObj.classification = "No Toilet";
        }

        if(false) {
            exec('./damagerec.py '+singleTweetObj.img+' '+singleTweetObj.coordinates[0]+' '+singleTweetObj.coordinates[0], function(error,stdout,stderr) {
                if(error) {
                    console.log(stderr);
                }
                else {
                    singleTweetObj = stdout;
                }
                
            });
        }

        tweets.table.push(singleTweetObj);

        var tweetFinal = "@" + tweet.user.screen_name + " thank you for the tip. Incident number " + incidents;
        client.post('statuses/update', { status: tweetFinal }, function (error, tweet, response) { //posts the response
            if (error) {
                console.log(error);
            }
            else {
                incidents++;
            }
        });
    }
    else {
        var tweetFinal = "@" + tweet.user.screen_name + " enable location services and tweet a pic of the sanitary plumbing fixture, with sharing your precise location";
        client.post('statuses/update', { status: tweetFinal }, function (error, tweet, response) { //posts the response
            if (error) {
                console.log(error);
            }
        });
    }
}

setInterval(writeToJSON, 1000 * 10);

function writeToJSON() {
    var json = JSON.stringify(tweets,null,"\t"); //convert it back to json
    fs.writeFile(filename, json, 'utf8', (err) => {
        (err) ? console.log(err) : console.log("Data successfully written to file");
    });
}
