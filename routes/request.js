require('dotenv').config();
const rp = require('request-promise');
const Request = require('../models/request');
var express = require('express');
var router = express.Router();

/* GET request listing. */
router.get('/', async function (req, res) {
    const result = await Request.find({});
    res.send(result);
});

router.get('/logs', async function (req, res, next) {
    let result = await Request.find({});

    if (req.query.created_at) {
        let dater = new Date(req.query.created_at);
        result = await Request.find({created_at : {$gte: new Date(req.query.created_at), $lt: new Date(dater.setDate(dater.getDate()+1))} }).exec();
    } else if (req.query.title) {
        result = await Request.find({ title : {$regex: '^'+req.query.title, $options:'i'} }).exec();
    } else {
        result = await Request.find({});
    }
    console.log(result);

    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);


    const startIndex = (page -1) * limit;
    const endIndex = (page * limit);

    let results = {};


    if (req.query.title) results.results = result;
    if (req.query.created_at) results.results = result;
    if (req.query.created_at == result) {
        if (endIndex < result.length)
            results.next = {
                page: page + 1,
                limit: limit
            };
        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            };
        }
        results.results = result.slice(startIndex, endIndex);
    }

    res.send(results);
    //console.log(result[0].message.id);
});

/* POST request listing. */
router.post('/', async function (req, res) {
    const request = new Request(req.body);

    let current_datetime = new Date();
    current_datetime.setHours(current_datetime.getHours() + 3);
    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds();
    request.created_at = formatted_date;

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
