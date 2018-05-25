const { exec } = require('../common');
const { table } = require('table');

const MAINHOST = require('../config').get('MAINHOST');
const KEYPATH = require('../config').get('KEYPATH');
const HOSTS = require('../config').get('HOSTS');

module.exports = function (program) {

  program.command('key add', '添加<username>到<host>')
    .alias('ka')
    .argument('<username>', '需要添加的用户名')
    .argument('<host>', '目标主机')
    .argument('[huser]', '登录目标主机的用户名, 默认为root')
    .action(args => {
      if (!args.huser) args.huser = 'root';
      if (HOSTS.some(h => { return h.host === args.host; })) {
        addKey(args.username, args.host, args.huser)
          .then(res => console.log(res))
          .catch(err => console.log(err));
      }
      else { console.log(`无法连接主机${args.host}`); }
    });

  program.command('key rm', '取消<username>访问<host>')
    .alias('kr')
    .argument('<username>', '需要取消的用户名')
    .argument('<host>', '目标主机')
    .argument('[huser]', '登录目标主机的用户名, 默认为root')
    .action(args => {
      if (!args.huser) args.huser = 'root';
      if (HOSTS.some(h => { return h.host === args.host; })) {
        rmKey(args.username, args.host, args.huser)
          .then(res => console.log(res))
          .catch(err => console.log(err));
      }
      else { console.log(`无法连接主机${args.host}`); }
    });

  program.command('key gen', '生成<username>的密钥')
    .alias('kg')
    .argument('<username>', '密钥的用户名')
    .action(args => {
      genKey(args.username)
        .then(res => { if (res) console.log(res); })
        .catch(err => console.log(err));
    });

  program.command('key download', '根据<username>下载密钥')
    .alias('kd')
    .argument('<username>', '密钥的用户名')
    .action(args => {
      scpKey(args.username)
        .then(res => console.log(res))
        .catch(err => console.log(handleErr(err)));
    });

  program.command('key upload', '上传密钥')
    .alias('ku')
    .argument('<key>', '密钥文件名')
    .action(args => {
      uploadKey(args.key)
        .then(res => console.log(res))
        .catch(err => console.log(err));
    });

  program.command('key ls', '显示主机群中可被访问用户')
    .alias('kl')
    .option('-u, --user <user>', '显示<user>可访问的主机')
    .option('-H, --host <host...>', '显示<host>可被访问的用户')
    .action((args, options) => {
      if (options.user && options.host) console.log('Error: -u, -h无法同时使用');
      else {
        let hosts;
        if (options.host) hosts = checkHost(options.host);
        else hosts = HOSTS;

        getList(makePromise(hosts), hosts)
          .then(lists => {
            if (options.user) { return searchUser(lists, options.user); }
            else { return Promise.resolve(lists) }
          })
          .then(lists => addHeader(lists))
          .catch(err => console.log(err));
      }
    });
}

// 根据lists[0]类型判断kl命令是否有-u参数，继而打印结果
function addHeader(lists) {
  let tmp;
  if (lists[0] instanceof Array) {
    tmp = [['HOST', 'HUSER', 'USERS']];
    lists.forEach(list => tmp.push(list));
    console.log(table(tmp));
  }
  else {
    lists.forEach(list => {
      console.log(list.user);
      console.log('------------------------');
      tmp = [['HUSER', 'HOST']];
      list.hosts.forEach(host => tmp.push(host));
      console.log(table(tmp));
    })
  }
}
// 返回lists中带有usernames的对象数组
function searchUser(lists, usernames) {
  return new Promise((resolve, reject) => {
    let names = namesToArray(usernames), users = [];
    names.forEach(name => {
      let hosts = [];
      lists.forEach(list => {
        list[2].forEach(user => { //list[2]: user
          if (user == name) hosts.push([list[1], list[0]]); // list[1]: huser , list[0]: host
        });
      });
      users.push({ user: name, hosts: hosts });
    });
    resolve(users);
  });
}
// 将usernames转换成array
function namesToArray(usernames) {
  let names = [];
  if (usernames.split(' ').length > 1) {
    usernames.split(' ').forEach(username => names.push(username));
  }
  else names[0] = usernames;
  return names;
}
// 返回[[host],[huser],[users]]形式的多维数组
function handleLists(lists, hosts) {
  return new Promise((resolve, reject) => {
    let keys = [];
    lists.forEach(list => keys.push(list.split('\n')))
    lists = [];
    hosts.forEach(h => lists.push([h.host, h.huser, []]));
    keys.forEach((key, i) => {
      key.forEach(k => {
        lists[i][2].push(k.split(' ')[2].replace(/\b@yilu\b/, '')); // 去除 @yilu
      });
    });
    resolve(lists);
  });
}

function getList(promiseBox, hosts) {
  return new Promise((resolve, reject) => {
    Promise.all(promiseBox)
      .then(lists => { return handleLists(lists, hosts); })
      .then(lists => resolve(lists))
      .catch(err => reject(err));
  })
}
// 返回存在于HOSTS中host的对象
function checkHost(host) {
  let hosts = [];
  if (host.split(' ').length > 1) {
    host.split(' ').forEach((h, i) => {
      HOSTS.forEach(HOST => {
        if (HOST.host == h) hosts.push(HOST);
      });
    });
  }
  else {
    HOSTS.forEach(HOST => {
      if (HOST.host == host) hosts.push(HOST);
    });
  }
  return hosts;
}
// 生成promise数组
function makePromise(hosts) {
  let box = [];
  hosts.forEach(h => box.push(getHostList(h.host, h.huser)));
  return box;
}
// 返回huser@host的ssh/authorized_keys内容
function getHostList(host, huser) {
  return new Promise((resolve, reject) => {
    let cli = `ssh ${huser}@${host} \"cat ~/.ssh/authorized_keys\"`
    exec(cli)
      .then(list => resolve(list))
      .catch(err => reject(err));
  });
}

function uploadKey(key) {
  return new Promise((resolve, reject) => {
    hasNoKey(key)
      .then(res => {
        let cli = `scp ${key} root@${MAINHOST}:${KEYPATH}/ && echo OK`;
        return exec(cli);
      })
      .then(res => resolve(res))
      .catch(err => {
        if (err == false) reject(`Error: ${key}已经存在.`);
        else reject(handleErr(err));
      });
  });
}

function rmKey(username, host, huser) {
  return new Promise((resolve, reject) => {
    hasNoUser(huser, host, username)
      .then(() => reject(`Error: ${host}中不存在${username}，无法进行删除操作`))
      .catch(err => {
        let = cli = `ssh ${huser}@${host} \"sed -i \'/${username}@yilu/d\' ~/.ssh/authorized_keys && echo \'删除成功\'\"`;
        exec(cli)
          .then(res => resolve(res))
          .catch(err => reject(handleErr(err)));
      });
  });
}
// 添加username的公钥到host中huser的~/.ssh/authorized_keys中
function addKey(username, host, huser) {
  return new Promise((resolve, reject) => {
    Promise.all([hasNoUser(huser, host, username), getPubKey(username)])
      .then(res => {
        let cli = `ssh ${huser}@${host} \"echo ${res[1]} >> ~/.ssh/authorized_keys && echo \'添加成功\'\"`;
        return exec(cli);
      })
      .then(res => resolve(res))
      .catch(err => {
        if (err == false) reject(`${username}已存在`);
        else reject(handleErr(err));
      });
  });
}

function hasNoUser(huser, host, username) {
  return new Promise((resolve, reject) => {
    let cli = `ssh ${huser}@${host} \"grep \'${username}\' ~/.ssh/authorized_keys\"`;
    exec(cli)
      .then(() => reject(false))
      .catch(() => resolve(true));
  });
}

function hasNoKey(username) {
  return new Promise((resolve, reject) => {
    let cli = `ssh root@${MAINHOST} \"ls ${KEYPATH}/${username}\"`;
    exec(cli)
      .then(() => reject(false))
      .catch(() => resolve(true));
  });
}

function getPubKey(username) {
  return new Promise((resolve, reject) => {
    let cli = `ssh root@${MAINHOST} \"cat ${KEYPATH}/${username}.pub\"`;
    exec(cli)
      .then(key => resolve(key))
      .catch(err => reject(err));
  });
}

// 生成密钥
function genKey(username) {
  return new Promise((resolve, reject) => {
    hasNoKey(username)
      .then(res => {
        let cli = `ssh root@${MAINHOST} \"ssh-keygen -f ${KEYPATH}/${username} -t rsa -N \'\' -C ${username}@yilu\"`;
        return exec(cli)
      })
      .then(() => { return scpKey(username) })
      .then(res => resolve(res))
      .catch(err => {
        if (err == false) reject(`Error: ${username}已经存在.`);
        else reject(handleErr(err));
      });
  });
}
// 下载用户密钥
function scpKey(user) {
  return new Promise((resolve, reject) => {
    let cli = `scp root@${MAINHOST}:\"${KEYPATH}/${user} ${KEYPATH}/${user}.pub\" . && echo OK`;
    exec(cli)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
}

function handleErr(err) {
  return 'Error: ' + err.message.split('\n')[1];
}