require('dotenv').config();
const express = require('express'),
  app = express(),
  extend = require('util')._extend,
  request = require('request'),
  i18n = require('i18next'),
  slack = require('./routes/slack');

app.use(require('body-parser').json());

app.use('/slack', slack);

//i18n settings
require('./config/i18n')(app);

// Bootstrap application settings
require('./config/express')(app);

app.get('/', function (req, res) {
  res.render('index', {
    ct: req._csrfToken
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