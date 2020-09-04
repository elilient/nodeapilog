require('dotenv').config();
const rp = require('request-promise');
const Request = require('../models/request');
var express = require('express');
var router = express.Router();

/* GET request listing. */
router.get('/', async function (req, res) {
    const result = await Request.find({});
    const { rawHeaders, httpVersion, method, socket, url } = req;
    const { remoteAddress, remoteFamily } = socket;
    console.log(
        JSON.stringify({
            timestamp: Date.now(),
            rawHeaders,
            httpVersion,
            method,
            remoteAddress,
            remoteFamily,
            url
        })
    );
    res.send(result);

});

router.get('/logs', paginatedResults(Request), (req, res) => {
   res.json(res.paginatedResults)
});

function paginatedResults(model) {
    return async (req, res, next) => {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {};

        if (endIndex < await model.countDocuments().exec()) {
            results.next = {
                page: page + 1,
                limit: limit
            }
        }

        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            }
        }

        const { query } = req;
        let date = new Date(query.created_at);
        const created_at = {$gte: new Date(query.created_at), $lt: new Date(date.setDate(date.getDate()+1))};
        const title = {$regex: '^'+ query.title, $options:'i'};

        try {
            results.results = await model.find().limit(limit).skip(startIndex).exec();
            if (query.created_at && query.title) {
                results.results = await model.find({ title : title, created_at : created_at}).limit(limit).skip(startIndex).exec();
            } else if (query.created_at) {
                results.results = await model.find({created_at : created_at}).limit(limit).skip(startIndex).exec();
            } else if (query.title) {
                results.results = await model.find({ title : title }).limit(limit).skip(startIndex).exec();
            } else {
                results.results = await model.find().limit(limit).skip(startIndex).exec();
            }

            res.paginatedResults = results;
            next()
        } catch (e) {
            res.status(500).json({ message: e.message })
        }
    }
}

/* POST request listing. */
router.post('/', async function (req, res) {
    const request = new Request(req.body);
    const { rawHeaders, httpVersion, method, socket, url } = req;
    const { remoteAddress, remoteFamily } = socket;
    const { statusCode, statusMessage } = res;
    const headers = res.getHeaders();
    const log = ({
        timestamp: Date.now(),
        rawHeaders,
        httpVersion,
        method,
        remoteAddress,
        remoteFamily,
        url,
        res: {
            statusCode,
            statusMessage,
            headers
        }
    });

    let current_datetime = new Date();
    current_datetime.setHours(current_datetime.getHours() + 3);
    let formatted_date = current_datetime.getFullYear() + "-" +
        (current_datetime.getMonth() + 1) + "-"
        + current_datetime.getDate() + " "
        + current_datetime.getHours() + ":"
        + current_datetime.getMinutes() + ":"
        + current_datetime.getSeconds();
    request.created_at = formatted_date;
    request.log = log;

    // Slack payload formatting
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
        // Different slack payload on error
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
