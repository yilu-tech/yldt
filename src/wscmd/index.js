const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { readFileSync } = require('fs');
const { existsSync } = require('fs');
const { copyFileSync } = require('fs');
const { basename } = require('path');
const { exec } = require('../common');

const arg = { stdio: 'inherit' };

const dir = basename(process.cwd());  // 获取当前目录名

module.exports = function (program) {

  program.command('wb init', '初始化workbench')
    .action(() => {
      if (existsSync('./docker-compose.yml')) {
        if (getContainerName()) rmWorkbench();
        workbenchUp();
      }
      else console.error('Error: 请确认当前目录中是否存在docker-compose.yml文件');
    });

  program.command('wb update', '更新workbench')
    .action(() => {
      if (existsSync('./docker-compose.yml')) workbenchUpdate();
      else console.error('Error: 请确认当前目录中是否存在docker-compose.yml文件');
    });

  program.command('wb update', '初始化')

  program.command('wb cmd', '进入到容器')
    .alias('cmd')
    .argument('[shell]', '指定终端，默认为zsh')
    .action(args => {
      if (args.shell == null) args.shell = 'zsh';
      let path = "";
      if (dir == 'workspace') path = `/${dir}`;
      else path = `/workspace/${dir}`
      let cli = `docker exec -w ${path} -it ${getContainerName()} ${args.shell}`;
      execSync(cli, arg);
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
  catch (err) { console.error(err); }
}

function linkKEY() {
  let path = require('path');
  let src = path.join(process.env.HOME, '.ssh/id_rsa');
  let des = path.join(process.cwd(), 'docker/id_rsa');
  copyFileSync(src, des);
}

function workbenchUpdate() {
  try {
    execSync('docker-compose down', arg);
    let names = getImgName();
    execSync(`docker rmi ${names[0]}`, arg);
  }
  catch (err) { console.error(err); }
  workbenchUp();
}

function rmWorkbench() {
  try {
    execSync('docker-compose down', arg);
    let names = getImgName();
    execSync(`docker rmi ${names[0]} ${names[1]}`, arg);
  }
  catch (err) { console.error(err); }
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
  return `docker exec -w /workspace/${dir} -it ${getContainerName()} ${cmd}`;
}

function getContainerName() {
  try {
    let lines = execSync('docker ps').toString().split('\n');
    let bingo = "";
    lines.forEach(line => {
      if (line.match(/workbench/)) bingo = line.split(' ')[0];
    });
    return bingo;
  }
  catch (e) { return null };
}
