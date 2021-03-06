'use strict';
// @ts-check

// redirect the stdout and stderr to ./stdout.log if nodejs is run in development mode
if (process.env.NODE_ENV === 'development') {
    var access = require('fs').createWriteStream('./stdout.log');
    process.stdout.write = access.write.bind(access);
    process.stderr.write = access.write.bind(access);
}

const cors = require('cors');
const pako = require('pako');
const ejb = require('easy-json-database');
const DATABASE = new ejb('../database.json');
let dfdb = {}; require('axios').default.get('https://dfonline.dev/public/dbc.json').then(response => { dfdb = response.data; console.log('Fetched the database.'); });

// create http server
const express = require('express');
const web = express();

const allowedOrigins = [
    "https://dfonline.dev",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:1234",
    "undefined", // localhost can be undefined
    undefined,
];

web.use(cors({
    'origin': (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// body parsers
web.use(express.json());
web.use(express.urlencoded({ extended: true }));
web.use(express.text());

web.get("*/db", cors(), (_req, res) => {
    res.json(dfdb);
});

const rateLimit = require('express-rate-limit')({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: { error: "Too many requests." }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//* GET /save/:id
web.get("*/save/:id", async (req, res) => {
    const data = DATABASE.get('shortTemplates.' + req.params.id);
    const message = data ? 'Success.' : 'No data found.';
    res.json({
        code: req.params.id,
        message: message,
        data: data,
    });
});

//* POST /save
web.post("*/save", rateLimit /* rate limit middleware */, async (req, res) => {
    if (!allowedOrigins.includes(`${req.headers.origin}`)) return res.status(403).json({ error: 'Forbidden.' });
    try {
        const raw = req.body;
        const parsed = JSON.parse(String.fromCharCode.apply(null, new Uint16Array(pako.inflate(new Uint8Array(atob(raw).split("").map(x => x.charCodeAt(0)))))).replace(/????/g, '\u00A7'));
        if (!Array.isArray(parsed.blocks)) throw new Error();
    } catch (err) {
        console.error(err)
        return res.status(400).json({ error: `Invalid data. ${err}` });
    }

    const duped = Object.keys(DATABASE.get('shortTemplates')).find(key => DATABASE.get('shortTemplates')[key] === req.body);
    const ID = !duped ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) : duped;

    DATABASE.set('shortTemplates.' + ID, req.body);
    res.json({
        id: ID
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const routes = [];

web._router.stack.forEach(function(middleware) {
    if (middleware.route) { // routes registered directly on the app
        routes.push(middleware.route);
    }
});

web.use(function(req, res, next) {
    if (!routes.includes(req.path)) return res.status(404).json({ error: 'API endpoint not found.' });
    next();
});

web.listen(8080, () => {
    console.log('server listening on port 8080');
});
