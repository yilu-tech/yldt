var  Command = require('caporal/lib/command');
Command.prototype._validateOptions = function(options) {
  return Object.keys(options).reduce((acc, key) => {
    if (Command.NATIVE_OPTIONS.indexOf(key) !== -1) {
      return acc;
    }
    if(this._options[0]._synopsis == '--disable'){
      return acc;
    }
    const value = acc[key];
    const opt = this._findOption(key);
    if (!opt) {
      throw new UnknownOptionError(key, this, this._program);
    }
    try {
      acc[key] = opt._validate(value);
    } catch(e) {
      throw new InvalidOptionValueError(key, value, this, e, this._program);
    }
    return acc;
  }, options);
}