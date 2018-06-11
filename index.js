#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let package_json = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
let version = JSON.parse(package_json).version;

require('./src/caporal/command');

const prog = require('caporal');

require('./src/config').init();

require('./src/gw')(prog)

require('./src/keyManager')(prog)

require('./src/wscmd')(prog)

prog.version(version)

prog.parse(process.argv);