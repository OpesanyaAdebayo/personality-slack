const express = require('express'),
    app = express(),
    request = require('request'),
    bodyParser = require('body-parser'),
    urlencodedParser = bodyParser.urlencoded({
        extended: false
    }),
    fetchTweets = require('../helpers/fetchTweets'),
    personality = require('../helpers/personality'),
    sendResponse = require('../helpers/sendResponse'),
    router = express.Router();

router.use('/commands', urlencodedParser);

// Oauth Route
router.get('/', function (req, res) {
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

// /personality <twitter handle> route
router.post('/commands', urlencodedParser, (req, res) => {
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


module.exports = router;