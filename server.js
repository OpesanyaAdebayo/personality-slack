require('dotenv').config();
const http = require('http');
const express = require('express');
const request = require('request');
var bodyParser = require('body-parser');
const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json());

const port = process.env.PORT || 3200;

// Initialize using verification token from environment variables
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Mount the event handler on a route
// NOTE: you must mount to a path that matches the Request URL that was configured earlier
app.use('/slack/events', slackEvents.expressMiddleware());

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('message', (event)=> {
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

app.post('/slack/events', function(req, res) {
    console.log("hello");
});


app.post('/slack/commands', urlencodedParser, (req, res) =>{
    res.status(200).end(); // best practice to respond with empty 200 status code
    var reqBody = req.body;
    var responseURL = reqBody.response_url;
    if (reqBody.token != process.env.SLACK_VERIFICATION_TOKEN){
        res.status(403).end("Access forbidden");
    }else{
        var message = {
            "text": "Hi, My name is Watson. I can help you discover yourself.",
            "attachments": [
                {
                    "text": "How would you like to give me information?",
                    "fallback": "Shame... buttons aren't supported in this land",
                    "callback_id": "info_option",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "twitter",
                            "text": "Twitter Handle",
                            "type": "button",
                            "value": "twitter",
                            "style": "primary"
                        },
                        {
                            "name": "text",
                            "text": "My own text",
                            "type": "button",
                            "value": "text",
                            "style": "success"
                        },
                        {
                            "name": "cancel",
                            "text": "Never mind.",
                            "type": "button",
                            "value": "cancel",
                            "style": "danger"
                        }
                    ]
                }
            ]
        };
        sendMessageToSlackResponseURL(responseURL, message);
    }
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

app.post('/slack/actions', urlencodedParser, (req, res) =>{
    res.status(200).end(); // best practice to respond with 200 status
    var actionJSONPayload = JSON.parse(req.body.payload); // parse URL-encoded payload JSON string
    var message = {
        "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].text,
        "replace_original": true
    };
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
});


// Start the express application
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
  });