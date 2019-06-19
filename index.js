#!/usr/bin/env node

require('./src/caporal/command');

const prog = require('caporal');

prog.version(require('./package.json').version);

require('./src/gw')(prog)

require('./src/wscmd')(prog)

prog.parse(process.argv);