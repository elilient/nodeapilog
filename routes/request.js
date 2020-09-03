require('dotenv').config();
const rp = require('request-promise');
const Request = require('../models/request');
var express = require('express');
var router = express.Router();

/* GET request listing. */
router.get('/', async function (req, res) {
    const result = await Request.find({});
    res.send(result);
    console.log(result[0].message.id);
});

/* POST request listing. */
router.post('/', async function (req, res) {
    const request = new Request(req.body);
    const slackBody = {
        attachments: [
            {
                title: `POST request: ${request.title}`,
                text: `${request.message}`,
                color: 'good',
                ts: Date.now()
            }
        ]
    };
    var options = {
        method: 'POST',
        uri: process.env.SLACK_URL,
        body: slackBody,
        json: true
    };
    try {
        await request.save();
        await rp(options)
            .then(function (parsedBody) {
                console.log(parsedBody);
                res.send(parsedBody)
            })
            .catch(function (err) {
                console.log(err);
                res.send(err)
            });
    } catch (error) {
        res.statusCode = 400;
        console.log(error);
        const slackBody = {
            attachments: [
                {
                    title: `POST /callback/ ${res.statusCode}: ${error.errors.title.name}`,
                    text: `${error.errors.title}\n ${request}`,
                    color: '#E01E5A',
                    ts: Date.now()
                }
            ]
        };
        var options = {
            method: 'POST',
            uri: process.env.SLACK_URL,
            body: slackBody,
            json: true
        };
        await rp(options)
            .then(function (parsedBody) {
                console.log(parsedBody);
                res.send(parsedBody)
            })
            .catch(function (err) {
                console.log(err);
                res.send(err)
            });
    }
});

module.exports = router;
