'use strict';
'@ts-check';

// redirect the stdout and stderr to ./stdout.log if nodejs is run in development mode
if(process.env.NODE_ENV === 'development') {
    var access = require('fs').createWriteStream('./stdout.log');
    process.stdout.write = access.write.bind(access);
    process.stderr.write = access.write.bind(access);
}

const zlib = require('zlib');
const ejb = require('easy-json-database');
const DATABASE = new ejb('../database.json');
// fetch the diamondfire database and parse it
let dfdb = {};
require('axios').default.get('https://dfonline.dev/public/db.json').then(response => {
    dfdb = response.data;
    console.log('Fetched the database.');
});

// create http server
const { createServer } = require('http');
const server = createServer(async function(req, res){
    const PATH = req.url.split('/').splice(2);

    console.log(req.headers.origin);
    // if the request originated from dfonline.dev or localhost:1234
    let safe = false;
    if(req.headers.origin === 'https://dfonline.dev' || req.headers.origin === 'http://localhost:1234'){
        safe = true;
        // set CORS to allow it
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
    }

    // read the body
    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }
    const body = Buffer.concat(buffers).toString();
    
    // saving templates to shortTemplates
    if(PATH[0] === 'save') {
        // check if its a post
        if(req.method === 'POST') {
            if(safe) {
                try {
                    // decode the base64'd gzip data with zlib
                    const decoded = zlib.gunzipSync(Buffer.from(body, 'base64')).toString();
                    // parse the json
                    const parsed = JSON.parse(decoded);
                    // check if the parsed data is a valid, blocks being an array always
                    if(!Array.isArray(parsed.blocks)) {
                        throw new Error('Invalid data');
                    }

                    // set the response header to json
                    res.setHeader('Content-Type', 'application/json');
                    // check and get the duplicate data object key
                    const duped = Object.keys(DATABASE.get('shortTemplates')).find(key => DATABASE.get('shortTemplates')[key] === body);
                    // create a random youtube like id if it isn't a dupe
                    const ID = !duped ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) : duped;
                    // save the data
                    DATABASE.set('shortTemplates.' + ID, body);
                    // end the response
                    res.end(JSON.stringify({
                        id: ID
                    }));
                } catch(e) {
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 400;
                    res.end(JSON.stringify({
                        error: 'Invalid data'
                    }));
                }
            }
            else{
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 403;
                res.end(JSON.stringify({
                    error: 'Forbidden'
                }));
            }
        }
        else if(req.method === 'GET') { 
            res.setHeader('content-type', 'application/json');
            const data = DATABASE.get('shortTemplates.' + PATH[1]);
            const message = data ? 'Success.' : 'No data found.';
            res.end(JSON.stringify({
                code: PATH[1],
                message: message,
                data: data,
            }));
        }
        else {
            res.writeHead(405);
            res.end('Method not allowed');  // 405
        }
    }
    // getting the diamondfire database
    else if(PATH[0] === 'db') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(dfdb));
    }
    else {
        // set status to 400
        res.statusCode = 400;
        res.write('No API endpoint at ' + PATH.join('/'));
        res.end(); 
    }
});

server.listen(8080,() => {
    console.log('server listening on port 8080');
});
