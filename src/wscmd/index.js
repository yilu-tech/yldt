const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { readFileSync } = require('fs');
const { existsSync } = require('fs');
const arg = { stdio: 'inherit' };

const dir = process.cwd().split('\\').pop();  // 获取当前目录名

module.exports = function (program) {


  program.command('ws init', '初始化workbench')
    .action(() => {
      if (existsSync('./docker-compose.yml')) {
        let cname = getContainerName(), fname = getDCName();
        if (fname) {
          if (!cname || cname !== fname) workbenchInit();
          else {
            execSync('docker-compose down', arg);
            getImgsName().forEach(name => execSync(`docker rmi ${name}`, arg));
            workbenchInit();
          }
        }
        else console.error('Error: docker-compose.yml不匹配');
      }
      else console.error('Error: 请确认当前目录中是否存在docker-compose.yml文件');
    });

  program.command('cmd', '进入到容器')
    .argument('[shell]', '指定终端，默认为zsh')
    .action(args => {
      if (args.shell == null) options.shell = 'zsh';
      let cli = `docker exec -w /workspace/${dir} -it ${getContainerName()} ${args.shell}`;
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

function workbenchInit() {
  execSync('docker pull yilutech/workbench', arg);
  execSync('docker-compose up -d', arg);
}

function getImgsName() {
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
  try { return execSync('docker ps').toString().match(/workbench/)[0] }
  catch (e) { return null };
}

function getDCName() {
  try { return readFileSync('./docker-compose.yml', 'utf8').match(/workbench/)[0]; }
  catch (e) { return null }
}

