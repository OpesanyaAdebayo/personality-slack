const request = require('request');
function sendResponse(responseURL, message) {
    var postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: message
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

module.exports = sendResponse;