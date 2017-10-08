var Twitter = require('twitter');
var fs = require('fs');
var util = require('util');

var express = require('express');
var app = express();

var sys = require('util')
var exec = require('child_process').exec;


var secret = {
    consumer_key: 'PGgGQwyimyvzLdAjDlnzzkt80',
    consumer_secret: 'MYGn32buEn2GS4IK5hrI3BHlAMx4erVxF7GjpKLCzKL1c74h5s',
    access_token_key: '916748173611323397-AiPaBEw6t3WLSmUEMsJJVHTlLc0IcOh',
    access_token_secret: 'xO0IgQULH6fNFtV8eU7CpgbX7vsPM6J0W4H6lpnya4JnV'
};

var client = new Twitter(secret);

var twitterHandle = 'damage_portal';

var tweets;

app.listen(3000);

app.get('/data', (req, res) => {
    res.send(JSON.stringify(tweets));
});



var incidents = 0;

var filename = '/Users/petertarsoly/Desktop/knightHacks2k17/twitter/tweetData.json';

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
    }
    else {
        tweets = JSON.parse(data);
        tweets.table = tweets.table || [];
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
            'name':null,
            'date':tweet.created_at,
            'user': tweet.user.screen_name,
            'message': tweet.text,
            'img': tweet.entities.media[0].media_url,
            'coordinates': coords,
        };
        

        if(tweet.text.toLowerCase().search("flood")>-1) {
            singleTweetObj.name = "Flooding";
        }
        else if((tweet.text.toLowerCase().search("fallen")>-1)&&(tweet.text.toLowerCase().search("tree")>-1)) {
            singleTweetObj.name = "Fallen Tree";
        }
        else if((tweet.text.toLowerCase().search("down")>-1)&&((tweet.text.toLowerCase().search("power")>-1)||(tweet.text.toLowerCase().search("line")>-1))) {
            singleTweetObj.name = "Downed Powerline";
        }
        else if(tweet.text.toLowerCase().search("debris")>-1) {
            singleTweetObj.name = "Debris";
        }

        if(!singleTweetObj) {
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
        var tweetFinal = "@" + tweet.user.screen_name + " enable location services and tweet a pic of damage, with sharing your precise location";
        client.post('statuses/update', { status: tweetFinal }, function (error, tweet, response) { //posts the response
            if (error) {
                console.log(error);
            }
        });
    }
}

setInterval(writeToJSON, 1000 * 30);

function writeToJSON() {
    var json = JSON.stringify(tweets,null,"\t"); //convert it back to json
    fs.writeFile(filename, json, 'utf8', (err) => {
        (err) ? console.log(err) : console.log("Data successfully written to file");
    });
}