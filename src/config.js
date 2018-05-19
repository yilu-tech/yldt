var yaml = require('js-yaml');
var fs   = require('fs');
var path = require('path');
var deepAssign = require('deep-assign');
exports.configs = {

};

exports.init = function(){
    var baseConfigPath = path.join(process.cwd(),'yldt.yml');
    console.log(baseConfigPath);
    try {
        var yldt_file = fs.readFileSync(baseConfigPath, 'utf8');
    } catch (e) {
        console.error(`Can not load ${baseConfigPath} file.`);
        process.exit(0);
    }

    try {
        var configs = yaml.safeLoad(yldt_file);
    } catch (e) {
        console.error(e);
        process.exit(0);
    }

    var selfConfigPath = path.join(process.cwd(),'self.yml');

    try {
        var self_file = fs.readFileSync(selfConfigPath, 'utf8');
    } catch (e) {
        console.error(`Can not load ${baseConfigPath} file.`);
        process.exit(0);
    }

    try {
        var selfConfigs = yaml.safeLoad(self_file);
        configs = deepAssign(configs,selfConfigs);
    } catch (e) {
        console.error(e);
        process.exit(0);
    }
    exports.configs = configs;
}

exports.register = function(path,name){

}

exports.get = function(name){
    return exports.configs[name];
}