module.exports = function (prog) {
 
  prog
  .command('gw run', '连接网关')
  .action((args, options, logger) => {
    require('./local-proxy').run();
    require('./ngrok').run();
  });
  
}
  