#!/usr/bin/env node
const prog = require('caporal');

require('./src/config').init();

require('./src/gw')(prog)

require('./src/keyManager')(prog)

prog.parse(process.argv);

