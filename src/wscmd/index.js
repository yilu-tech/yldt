const { execSync } = require('child_process');
const arg = { stdio: 'inherit' };

const dir = process.cwd().split('\\').pop();  // 获取当前目录名

module.exports = function (program) {


  program.command('ws init', '初始化workbench')
    .action(() => {

    });

  program.command('ws update', '升级workbench镜像，并重启')
    .action(() => {

    });

  program.command('cmd', '进入到容器')
    .option('-s, --shell <shell>', '指定终端，默认为ash')
    .action((args, options) => {
      if (options.shell == null) options.shell = 'ash';
      let cli = `docker exec -w /workspace/${dir} -it ${getContainerName()} ${options.shell}`;
      execSync(cli, arg);

    });

  program.command('composer')
    .argument('[subcmd...]', 'composer 二级命令')
    .option('--disable')
    .action(() => {
      run()
    });

  program.command('npm')
    .argument('[subcmd...]', 'npm 二级命令')
    .option('--disable')
    .action(() => {
      run()
    });

  program.command('php artisan')
    .argument('[subcmd...]', 'php artisan 二级命令')
    .option('--disable')
    .action(() => {
      run()
    });



}


function run() {
  let cli = genCli();
  try { execSync(cli, arg); }
  catch (err) { }
}

function genCli() {
  let argv = process.argv;
  argv.shift();
  argv.shift();
  let cmd = argv.join(' ');
  return `docker exec -w /workspace/${dir} -it ${getContainerName()} ${cmd}`;
}

function getContainerName() {
  return execSync('docker ps').toString().match(/workbench/)[0];
}

