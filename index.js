#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { exeSync } = require('child_process');

require('./src/caporal/command');

const prog = require('caporal');

let package_json = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
let version = JSON.parse(package_json).version;
prog.version(version);

require('./src/config').init();

require('./src/gw')(prog)

require('./src/keyManager')(prog)

require('./src/wscmd')(prog)

prog.command('update', '更新yldt')
  .action(() => {
    try {
      let arg = { stdio: 'inherit' };
      exeSync('npm uninstall -g yldt', arg);
      exeSync('npm install -g yldt', arg)
    }
    catch (err) { console.log(err.message); }
  });

prog.parse(process.argv);