const prog = require('caporal');
prog
  .version('1.0.0')
  .command('gw run', '连接网关')
  .action((args, options, logger) => {
    require('./local-proxy').run();
    require('./ngrok').run();
  });
 
