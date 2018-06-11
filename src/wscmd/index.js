const fs = require('fs');
const path = require('path');
const os = require('os');

const { execSync } = require('child_process');

const arg = { stdio: 'inherit' };

module.exports = function (program) {

  program.command('wb init', '初始化workbench')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) {
          if (getContainer()) rmWorkbench();
          workbenchUp();
        }
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err); }
    });

  program.command('wb update', '更新workbench')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) workbenchUpdate();
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err); }
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
      catch (err) { if (err.error != null) console.log(err); }
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
  linkKEY();
  execSync('docker pull yilutech/workbench', arg);
  execSync('docker-compose up -d', arg);
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
  if (os.type() == 'Windows_NT') return win32pathConvert(wbpath);
  return wbpath;
}

function getCWDforWB() {
  var prepath = getContainer();
  if (!prepath) throw "路径有误，无法进入容器";
  let wbpath = "";
  let relation = path.relative(prepath.path, process.cwd());
  if (relation == "") wbpath = '/workspace';
  else {
    wbpath = path.join('/workspace', relation);
    if (os.type() == 'Windows_NT') wbpath = wbpath.replace(/\\/g, '/');
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
  execSync('docker-compose down', arg);
  let names = getImgName();
  execSync(`docker rmi ${names[0]}`, arg);
  workbenchUp();
}

function rmWorkbench() {
  execSync('docker-compose down', arg);
  let names = getImgName();
  execSync(`docker rmi ${names[0]} ${names[1]}`, arg);
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
  let location = 0;
  if (path.split('\\')[1].length == 1) location = 0;
  if (path.split('\\')[2].length == 1) location = 9;
  return `${path[location + 1].toUpperCase()}:${path.substring(location + 2, path.length)}`;
}