require('dotenv').config();
const express = require('express'),
  app = express(),
  extend = require('util')._extend,
  bodyParser = require('body-parser'),
  request = require('request'),
  urlencodedParser = bodyParser.urlencoded({
    extended: false
  }),
  i18n = require('i18next'),
  fetchTweets = require('./helpers/fetchTweets'),
  personality = require('./helpers/personality');
sendResponse = require('./helpers/sendResponse');

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
  res.json({
    text: "Please hold on for a bit while I compute results..."
  }); // best practice to respond with empty 200 status code or message
  let reqBody = req.body;
  let responseURL = reqBody.response_url;
  if (reqBody.token != process.env.SLACK_VERIFICATION_TOKEN) {
    res.status(403).end("Access forbidden");
  } else {
    fetchTweets(reqBody.text)
      .catch((err) => {
        let message = "There was a problem fetching tweets.\nPlease check the handle and make sure it's correct.";
        sendResponse(responseURL, {
          text: message
        });
      })
      .then((tweets) => personality(tweets))
      .catch((err) => {
        let message = "Ouch! You either do not have sufficient tweets, or your language is not supported. Sorry.";
        sendResponse(responseURL, {
          text: message
        });
      })
      .then((personalitySummary) => sendResponse(responseURL, {
        text: personalitySummary
      }))
      .catch(err => console.error(err));
  }

});

app.post('/slack/commands/team', urlencodedParser, (req, res) => {

  res.json({
    name: bayo
  });
});



process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});


// error-handler settings
require('./config/error-handler')(app);

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);