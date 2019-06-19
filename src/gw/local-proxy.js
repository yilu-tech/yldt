var http = require('http');
const httpProxy = require('http-proxy');
var ip = require('ip');
exports.run = function(options){

    console.info('Start gateway local proxy...');
    const proxy = httpProxy.createProxyServer({ changeOrigin: true });

    var server = http.createServer(function(req, res) {

        let target = req.headers['local-url'];

        if(!target){
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write(`${options.name} ${ip.address()} Gateway Proxy can not proxy ${req.url}`);
            res.end();
            return;
        }
        try{
            proxy.web(req, res, { target: target});
        }catch(e){
            console.log(e);
            res.end(JSON.stringify({
                cause:'Local proxy failed.',
                message:e.message,
                target:target,
            }))
        }
        
    });
      
    console.log("listening on port 10802")
    server.listen(10802);
}

exports.services = {};