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
  i18n = require('i18next');

app.use(bodyParser.json());

//i18n settings
require('./config/i18n')(app);

// Bootstrap application settings
require('./config/express')(app);


const personality_insights = new PersonalityInsightsV3({
  username: process.env.PERSONALITY_INSIGHTS_USERNAME,
  password: process.env.PERSONALITY_INSIGHTS_PASSWORD,
  version_date: '2017-10-13'
});

app.get('/', function (req, res) {
  res.render('index', {
    ct: req._csrfToken
  });
});

app.post('/api/profile', function (req, res, next) {
  var parameters = extend(req.body, {
    acceptLanguage: i18n.lng()
  });

  personalityInsights.profile(parameters, function (err, profile) {
    if (err)
      return next(err);
    else
      return res.json(profile);
  });
});


app.post('/slack/commands', urlencodedParser, (req, res) => {
  res.status(200).end(); // best practice to respond with empty 200 status code
  var reqBody = req.body;
  var responseURL = reqBody.response_url;
  if (reqBody.token != process.env.SLACK_VERIFICATION_TOKEN){
      res.status(403).end("Access forbidden");
  }
  else {
    var message = {text: "I am kinda working"};
    sendMessageToSlackResponseURL(responseURL, message);
  }
  // var responseURL = reqBody.response_url;

});


function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  var postOptions = {
      uri: responseURL,
      method: 'POST',
      headers: {
          'Content-type': 'application/json'
      },
      json: JSONmessage
  };
  request(postOptions, (error, response, body) => {
      if (error){
          // handle errors as you see fit
      }
  });
}




// error-handler settings
require('./config/error-handler')(app);

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);