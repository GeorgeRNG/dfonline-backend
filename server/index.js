'use strict';
'@ts-check';

// redirect the stdout and stderr to ./log.log
// var access = require('fs').createWriteStream('./log.log');
// process.stdout.write = access.write.bind(access);
// process.stderr.write = access.write.bind(access);

const zlib = require('zlib');
const ejb = require('easy-json-database');
const DATABASE = new ejb('../database.json');
// fetch the diamondfire database and parse it
let dfdb = {};
require('axios').default.get('https://dfonline.dev/public/db.json').then(response => {
    dfdb = response.data;
    console.log('Fetched the database.')
    // console.log(dfdb);
});

// create http server
const { createServer } = require('http');
const server = createServer(async function(req, res){
    const PATH = req.url.split('/').splice(2);

    // setup cors
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

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
            try {
                // decode the base64'd gzip data with zlib
                var decoded = zlib.gunzipSync(Buffer.from(body, 'base64')).toString();
                // parse the json
                var parsed = JSON.parse(decoded);
                // check if the parsed data is a valid, blocks being an array always
                if(!Array.isArray(parsed.blocks)) {
                    throw new Error('Invalid data');
                }

                // set the response header to json
                res.setHeader('Content-Type', 'application/json');
                // check and get the duplicate data object key
                var duped = Object.keys(DATABASE.get('shortTemplates')).find(key => DATABASE.get('shortTemplates')[key] === body);
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
        else if(req.method === 'GET') { 
            res.setHeader('content-type', 'application/json');
            var data = DATABASE.get('shortTemplates.' + PATH[1]);
            var message = data ? 'Success.' : 'No data found.';
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
