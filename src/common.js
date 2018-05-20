const exc = require('child_process').exec;

module.exports = {
  exec: function (cli) {
    return new Promise((resolve, reject) => {
      exc(cli, { encoding: 'utf-8' }, (err, stdout, stderr) => {
        if (err) { reject(err); }
        if (stderr) { reject(stderr); }
        if (stdout) { resolve(stdout.replace(/\n(?=((?!\n).)*$)/, '')); }
      });
    })
  }
}