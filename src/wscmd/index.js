const fs = require('fs');
const path = require('path');
const os = require('os');

const { execSync } = require('child_process');

const arg = { stdio: 'inherit' };

module.exports = function (program) {

  program.command('wb stop', '停止')
    .alias('stop')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) {
          let cli = "docker-compose stop";
          execSync(cli, arg);
        }
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err.message); }
    });

  program.command('wb start', '启动')
    .alias('start')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) {
          let cli = "docker-compose start";
          execSync(cli, arg);
        }
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err.message); }
    });

  program.command('wb restart', '重启')
    .alias('restart')
    .argument('[cname]', '指定需要重启的容器')
    .action((args) => {
      try {
        if (fs.existsSync('./docker-compose.yml')) {
          let cli = "docker-compose restart";
          if (args.cname) cli = `docker restart ${args.cname}`;
          execSync(cli, arg);
        }
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err.message); }
    });

  program.command('wb down', '卸载')
    .alias('down')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) {
          let cli = "docker-compose down";
          execSync(cli, arg);
        }
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err.message); }
    });

  program.command('wb init', '初始化workbench')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) {
          if (getContainer()) rmWorkbench();
          workbenchUp();
        }
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err.message); }
    });

  program.command('wb update', '更新workbench')
    .action(() => {
      try {
        if (fs.existsSync('./docker-compose.yml')) workbenchUpdate();
        else throw ('Error: 请确认当前目录中是否存在docker-compose.yml文件');
      }
      catch (err) { console.log(err.message); }
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
      catch (err) { if (err.error != null) console.log(err.message); }
    });

  program.command('wb composer', '在workbench中执行composer')
    .alias('composer')
    .argument('[subcmd...]', 'composer 二级命令')
    .option('--disable')
    .action(() => { run(); });

  program.command('wb npm', '在workbench中执行npm')
    .alias('npm')
    .argument('[subcmd...]', 'npm 二级命令')
    .option('--disable')
    .action(() => { run(); });

  program.command('wb php artisan', '在workbench中执行php artisan')
    .alias('php artisan')
    .argument('[subcmd...]', 'php artisan 二级命令')
    .option('--disable')
    .action(() => { run(); });


}


function run() {
  try {
    let argv = process.argv;
    argv.shift();
    argv.shift();
    let cmd = argv.join(' ');
    let wbpath = getCWDforWB(workbench);
    let cli = `docker exec -w ${wbpath} -it ${getContainer().cname} ${cmd}`;
    execSync(cli, arg);
  }
  catch (err) { console.log(err.message); }
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

function win32pathConvert(path) {
  let location = 0;
  if (path.split('\\')[2].length == 1) location = 9;
  if (path.split('\\')[1].length == 1) location = 0;
  return `${path[location + 1].toUpperCase()}:${path.substring(location + 2, path.length)}`;
}