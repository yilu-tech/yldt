#!/usr/bin/env node

require('./src/caporal/command');

const prog = require('caporal');

prog.version('1.0.5');

require('./src/config').init();

require('./src/gw')(prog)

require('./src/keyManager')(prog)

require('./src/wscmd')(prog)

prog.parse(process.argv);