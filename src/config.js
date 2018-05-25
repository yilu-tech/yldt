var yaml = require('js-yaml');
var fs   = require('fs');
var path = require('path');
var deepAssign = require('deep-assign');
var configs = exports.configs = {

};

exports.init = function(){
    var baseConfigPath = path.join(process.cwd(),'yldt.yml');

    try {
        if(fs.existsSync(baseConfigPath)){
            var yldt_file = fs.readFileSync(baseConfigPath, 'utf8');
            var baseConfigs = yaml.safeLoad(yldt_file);
            configs = deepAssign(configs,baseConfigs);
        }
    } catch (e) {
        console.error(`Can not load ${baseConfigPath} file.`);
        process.exit(0);
    }

    
    var selfConfigPath = path.join(process.cwd(),'self.yml');
    try {
        if(fs.existsSync(selfConfigPath)){
            var self_file = fs.readFileSync(selfConfigPath, 'utf8');
            var selfConfigs = yaml.safeLoad(self_file);
            configs = deepAssign(configs,selfConfigs);
        }
    } catch (e) {
        console.error(`Can not load ${baseConfigPath} file.`);
        process.exit(0);
    }
}

exports.register = function(path,name){

}

exports.get = function(name){
    return exports.configs[name];
}