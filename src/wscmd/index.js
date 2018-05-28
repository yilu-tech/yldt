const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { exec } = require('../common');

const arg = { stdio: 'inherit' };
const dir = path.basename(process.cwd());  // 获取当前目录名

module.exports = function (program) {

  program.command('wb init', '初始化workbench')
    .action(() => {
      if (fs.existsSync('./docker-compose.yml')) {
        if (getContainer()) rmWorkbench();
        workbenchUp();
      }
      else console.log('Error: 请确认当前目录中是否存在docker-compose.yml文件');
    });

  program.command('wb update', '更新workbench')
    .action(() => {
      if (fs.existsSync('./docker-compose.yml')) workbenchUpdate();
      else console.log('Error: 请确认当前目录中是否存在docker-compose.yml文件');
    });

  program.command('wb cmd', '进入到容器')
    .alias('cmd')
    .argument('[shell]', '指定终端，默认为zsh')
    .action(args => {
      if (args.shell == null) args.shell = 'zsh';
      try {
        let wbpath = getCWDforWB();
        let cli = `docker exec -w ${wbpath} -it ${getContainer().cname} ${args.shell}`;
        execSync(cli, arg);
      }
      catch (err) { console.log(err); }
    });

  program.command('composer')
    .argument('[subcmd...]', 'composer 二级命令')
    .option('--disable')
    .action(() => { run(); });

  program.command('npm')
    .argument('[subcmd...]', 'npm 二级命令')
    .option('--disable')
    .action(() => { run(); });

  program.command('php artisan')
    .argument('[subcmd...]', 'php artisan 二级命令')
    .option('--disable')
    .action(() => { run(); });


}


function run() {
  let cli = genCli();
  try { execSync(cli, arg); }
  catch (err) { }
}

function workbenchUp() {
  try {
    linkKEY();
    execSync('docker pull yilutech/workbench', arg);
    execSync('docker-compose up -d', arg);
  }
  catch (err) { console.log(err); }
}

function getContainer() {
  let ids = getContainerID();
  let prepaths = [];
  let path;
  ids.forEach(id => {
    prepaths.push({ cname: id, path: getVolumePath(id) });
  });
  prepaths.forEach(prepath => {
    if (process.cwd().indexOf(prepath.path) > -1) path = prepath;
  });
  return path;
}

function getVolumePath(cname) {
  let info = JSON.parse(execSync(`docker inspect ${cname}`).toString());
  let wbpath = path.normalize(info[0].Mounts[0].Source);
  return win32pathConvert(wbpath);
}

function getCWDforWB() {
  try { var prepath = getContainer(); }
  catch (err) { throw err };
  let wbpath = "";
  let relation = path.relative(prepath.path, process.cwd());
  if (relation == "") wbpath = '/workspace';
  else {
    wbpath = path.join('/workspace', relation);
    if (process.platform == 'win32') wbpath = wbpath.replace(/\\/g, '/');
  }
  return wbpath;
}

function getContainerID() {
  let dps = execSync(`docker ps`).toString().split('\n');
  let id = [];
  dps.forEach(line => {
    if (line.match(/workbench/)) id.push(line.split(' ')[0]);
  });
  return id;
}

function linkKEY() {
  let src = path.join(process.env.HOME, '.ssh/id_rsa');
  let des = path.join(process.cwd(), 'docker/id_rsa');
  fs.copyFileSync(src, des);
}

function workbenchUpdate() {
  try {
    execSync('docker-compose down', arg);
    let names = getImgName();
    execSync(`docker rmi ${names[0]}`, arg);
  }
  catch (err) { console.log(err); }
  workbenchUp();
}

function rmWorkbench() {
  try {
    execSync('docker-compose down', arg);
    let names = getImgName();
    execSync(`docker rmi ${names[0]} ${names[1]}`, arg);
  }
  catch (err) { console.log(err); }
}

function getImgName() {
  let names = [];
  execSync('docker images').toString().split('\n').forEach(e => {
    if (e.match(/workbench/)) names.splice(names.length, 0, e.split(' ').shift());
  });
  if (names[0] == 'yilutech/workbench') return names.reverse();
  return names;
}

function genCli() {
  let argv = process.argv;
  argv.shift();
  argv.shift();
  let cmd = argv.join(' ');
  let wbpath = getCWDforWB();
  return `docker exec -w ${wbpath} -it ${getContainer().cname} ${cmd}`;
}

function win32pathConvert(path) {
  return `${path[1].toUpperCase()}:${path.substring(2, path.length)}`;
}