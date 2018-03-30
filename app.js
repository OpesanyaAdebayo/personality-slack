/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require('dotenv').config();
var express = require('express'),
  app = express(),
  PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3'),
  extend = require('util')._extend,
  bodyParser = require('body-parser'),
  request = require('request'),
  urlencodedParser = bodyParser.urlencoded({
    extended: false
  }),
  i18n = require('i18next'),
  fetchTweets = require('./fetchTweets'),
  personality = require('./personality'),
  GphApiClient = require('giphy-js-sdk-core')(process.env.GIPHY_API_KEY);

app.use(bodyParser.json());

//i18n settings
require('./config/i18n')(app);

// Bootstrap application settings
require('./config/express')(app);

app.get('/', function (req, res) {
  res.render('index', {
    ct: req._csrfToken
  });
});

app.get('/slack', function (req, res) {
  let data = {
    form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code
    }
  };
  request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (JSON.parse(body).error == 'missing scope') {
        res.send('Watson Bot has been added to your team!');
      }
      let token = JSON.parse(body).access_token;

      request.post('https://slack.com/api/team.info', {
        form: {
          token: token
        }
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if (JSON.parse(body).error == 'missing_scope') {
            res.send('Watson Bot has been added to your team!');
          } else {
            let team = JSON.parse(body).team.domain;
            res.redirect('http://' + team + '.slack.com');
          }
        }
      });
    }
  });

});


app.post('/slack/commands', urlencodedParser, (req, res) => {
  res.status(200).end(); // best practice to respond with empty 200 status code
  var reqBody = req.body;
  var responseURL = reqBody.response_url;
  if (reqBody.token != process.env.SLACK_VERIFICATION_TOKEN) {
    res.status(403).end("Access forbidden");
  } else {
    fetchTweets(reqBody.text)
      .catch((err) => {
        let message = "There was a problem fetching tweets.\nPlease check the handle and make sure it's correct.";
        sendResponse(responseURL, {
          text: message
        }, true);
      })
      .then((tweets) => personality(tweets))
      .catch((err) => {
        let message = "Ouch! You either do not have sufficient tweets, or your language is not supported. Sorry.";

        sendResponse(responseURL, {
          text: message
        }, true);
      })
      .then((personalitySummary) => sendResponse(responseURL, {
        text: personalitySummary
      }, false))
      .catch(err => console.error(err));
  }

});

function sendResponse(responseURL, message, isErrorMessage) {
  let imageUrl;
  if (isErrorMessage == true) {
    GphApiClient.translate('gifs', {
        "s": 'sorry',
        "lang": 'en'
      })
      .then((response) => {
        imageUrl = response.data[0].source;
      });
  }
  var postOptions = {
    uri: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    json: message,
    attachments: [{
      image_url: imageUrl
    }]
  };

  request(
    postOptions, (err, HTTPresponse, body) => {
      if (err) {
        console.error(err);
      } else {
        console.log(body);
      }
    });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


// error-handler settings
require('./config/error-handler')(app);

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);