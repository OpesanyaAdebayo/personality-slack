require('dotenv').config();
const express = require('express');
const request = require('request');
var bodyParser = require('body-parser');
const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false })

app.listen(3200);

console.log("listening");