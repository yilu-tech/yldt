var os = require('os');
var path = require('path');
var config = require('../config');
const { spawn } = require('child_process');
var fs = require('fs');
var wget = require('node-wget-promise');

const {zip, unzip, list} = require('zip-unzip-promise');

var ngrokProcess;
exports.run = async function(configfile, options){
    console.info('Start gateway ngrok...');
    var command = await getCommand();
    var args = [];

    if(!config.get('gateway-proxy') || !config.get('gateway-proxy').name){
        throw "gateway-proxy.name is required."
    }

    if(!config.get('gateway-proxy') || !config.get('gateway-proxy').port){
        throw "gateway-proxy.port is required."
    }
    var ngrokCfg = `server_addr: "gw.proxy:${config.get('gateway-proxy').port}"\n`
    ngrokCfg = `${ngrokCfg}trust_host_root_certs: false`;
    
    console.log(path.join(__dirname,'ngrok.cfg'));
    var ngrokPath = path.join(__dirname,'tmp/ngrok.cfg');
    fs.writeFileSync(ngrokPath,ngrokCfg);


    args.push(`-subdomain=${config.get('gateway-proxy').name}`);
    var configPath = ngrokPath;
    args.push(`-config=${configPath}`);
    args.push('10802');
    ngrokProcess = spawn(command,args);
    ngrokProcess.stdout.on('data',stdout);
      
    ngrokProcess.stderr.on('data',stderr);
    
    //ngrok退出的时候kill主进程
    ngrokProcess.on('close',close);

    //主进程关闭的时候kill ngrok
    process.on('exit',function(){
        spawn('kill',['-9',ngrokProcess['pid']]);
        console.error("\n---> process exited.")
    })

}

function stdout(data){
    console.info(`${data}`);
}

function stderr(data){
    console.info(`stderr: ${data}`);
}

function close(code){
    console.info(`Gateway proxy process exited with code ${code}`);
    process.on('exit', function () {
        console.info('Gateway proxy exit.');
    });
    process.exit(1);
}


async function getCommand(){
    var osType = os.type();
    if(osType == 'Darwin'){
        var filename = "ngrok-Darwin-64";
        return await getBin(filename);

    }else if(osType == 'linux'){

    }else if(osType == 'Windows_NT'){
        var filename = "ngrok-windows-64.exe";
        return await getBin(filename);
    }else{
        console.error('Not support ',osType);
    }
}

async function getBin(filename){
    var zipfilePath = path.join(__dirname,`tmp/${filename}.zip`);
    var filepath = path.join(__dirname,`tmp/${filename}`);
    var options = {
        output: zipfilePath
      };
      if(!fs.existsSync(zipfilePath)){
        console.log('download')
        var url = `https://github.com/yilu-tech/yldt/releases/download/0.0.1/${filename}.zip`
        await wget(url,options);
      }

      if(!fs.existsSync(filepath)){
        console.log('unzip')
        const dirPath = await unzip(zipfilePath,path.join(__dirname,`tmp`));
        
      }
      fs.chmodSync(filepath,'500');
      console.log(`${filename} is ok.`)

      return filepath;
}