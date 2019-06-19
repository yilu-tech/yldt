module.exports = function (prog) {
 
  prog
  .command('gw run', '连接网关')
  .option('-p, --port', 'ngrok服务器端口号')
  .option('-n, --name', 'ngrok用户名')
  .action((args, options, logger) => {
    if (!options.port) {
      throw new Error("请填写ngrok服务端口");
    }

    if (!options.name) {
      throw new Error("请填写用户名");
    }

    require('./local-proxy').run(options);
    require('./ngrok').run(options);
  });
  
}
  