var http = require('http');
const httpProxy = require('http-proxy');
var config = require('../config');
var minimatch = require("minimatch");
var ip = require('ip');
exports.run = function(){

    parseConfig();


    console.info('Start gateway local proxy...');
    const proxy = httpProxy.createProxyServer({ changeOrigin: true });



    var server = http.createServer(function(req, res) {
       
        var target = matchService(req.url);
        if(!target){
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write(`${config.get('gateway-proxy').name} ${ip.address()} Gateway Proxy can not proxy ${req.url}`);
            res.end();
            return;
        }
        try{
            proxy.web(req, res, { target: target});
        }catch(e){
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

function parseConfig(){
    var servicesConfig = config.get('gateway-proxy').services;
    for(var i in servicesConfig){
        var str = servicesConfig[i];
        if(str.indexOf(' -> ') < 0){
            throw "gateway-proxy.services define like 'center -> http://127.0.0.1:3000'"
        }
        var arr = str.split(' -> ');
        exports.services[arr[0]] = arr[1];
    }
}

function matchService(url){
    var services = exports.services;
   
    for(var service in services){
        if(minimatch(url,service,{noglobstar:false})){
            return services[service];
        }
    }

    return null;

}