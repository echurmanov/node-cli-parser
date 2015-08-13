var CONST = {
    TYPE: {
        STRING: 'string',
        ARRAY: 'array',
        BOOLEAN: 'boolean',
        SECTION: 'section'
    }
};


module.exports = {
    getUsage: getUsage,
    parse: parse,
    TYPES: {
        STRING: 'string',
        ARRAY: 'array',
        BOOLEAN: 'boolean',
        SECTION: 'section'
    }
};


/**
 *
 * @param args
 * @param options
 * @param operands
 *
 * @return {*}|null
 */
function processArgs(args, config) {
    var pos;
    var args = args.slice(0);
    var options = {};
    var operands = [];

    var lastUsedArg = -1;

    var allRequired = true, value;

    for (var idx in config) {
        value = null;
        if (config.hasOwnProperty(idx)) {
            if (typeof config[idx].option !== 'undefined' && config[idx].option == true) {
                pos = args.indexOf("--" + config[idx].name);

                if (pos == -1 && typeof config[idx].short !== 'undefined') {
                    pos = args.indexOf("-" + config[idx].short);
                }
                if (lastUsedArg < pos) {
                    lastUsedArg = pos;
                }
                if (pos == -1) {
                    if (typeof config[idx].require !== 'undefined' && config[idx].require == true ) {
                        allRequired = false;
                        break;
                    }
                } else {
                    if (typeof config[idx].type == 'undefined' || config[idx].type.toLowerCase() == CONST.TYPE.BOOLEAN) {
                        options[config[idx].name] = true;
                    } else {
                        if (config[idx].type.toLowerCase() == CONST.TYPE.STRING) {
                            if (args.length >= pos) {
                                options[config[idx].name] = args[pos + 1];
                                if (options[config[idx].name].indexOf('--') === 0) {
                                    delete options[config[idx].name];
                                } else {
                                    if (lastUsedArg < pos + 1) {
                                        lastUsedArg = pos + 1;
                                    }
                                }
                            }
                            if (typeof options[config[idx].name] === 'undefined'
                                && (typeof config[idx].requireValue === 'undefined' || config[idx].requireValue == false)
                            ) {
                                options[config[idx].name] = true;
                            }
                        } else {
                            options[config[idx].name] = [];
                            while (pos + 1 < args.length && args[pos + 1].indexOf('--') !== 0) {
                                options[config[idx].name].push(args[pos + 1]);
                                if (lastUsedArg < pos + 1) {
                                    lastUsedArg = pos + 1;
                                }
                            }
                        }
                    }

                    if (typeof options[config[idx].name] === 'undefined'
                        && typeof config[idx].require !== 'undefined' && config[idx].require == true
                    ) {
                        allRequired = false;
                        break;
                    }
                }
            }
        }
    }
    if (args.indexOf('--') !== -1) {
        operands = args.slice(args.indexOf('--') + 1);
    } else {
        operands = args.slice(lastUsedArg + 1);
    }
    for (idx = 0; idx < config.length; idx++) {
        value = null;
        if (typeof config[idx].option === 'undefined' || config[idx].option == false) {
            if (typeof config[idx].type === 'undefined' || config[idx].type.toLowerCase() == CONST.TYPE.STRING) {
                if (operands.length > 0) {
                    options[config[idx].name] = operands.shift();
                } else {
                    options[config[idx].name] = false;
                }
            } else if (config[idx].type.toLowerCase() == CONST.TYPE.ARRAY) {
                options[config[idx].name] = [];
                while (operands.length >= config.length - idx) {
                    options[config[idx].name].push(operands.shift());
                }
            }
        }
    }

    if (!allRequired) {
        return null;
    }
    return options;
}


/**
 *
 * @param {{name: string, short: string, type: string, placeholder: string, description: string, share: boolean, params: [{}]}[]} config
 * @param {[]} args
 */
function parse(config, args)
{
    var args = args.slice(2);
    var operands = [];
    var shareOptions = [];
    var sections = {};
    var operandsValues = [];

    if (args.indexOf('--') !== -1) {
        operandsValues = args.splice(args.indexOf('--'));
        operandsValues.shift();
    }

    var i;
    for (i = 0; i < config.length; i++) {
        if (typeof config[i].type !== 'undefined' && config[i].type.toLowerCase() == CONST.TYPE.SECTION) {
            sections[config[i].name] = processArgs(args, config[i].params);
        } else if (typeof config[i].option && config[i].option === true) {
            shareOptions.push(config[i]);
        } else {
            shareOptions.push(config[i]);
        }
    }

    return {
        sections: sections,
        params: processArgs(args, shareOptions)
    };
}

/**
 *
 * @param {{name: string, short: string, type: string, placeholder: string, requireValue: boolean, description: string}} optionConfig
 *
 * @return string
 */
function getOptionUsage(optionConfig) {
    var option = '', cfgType, placeholder;
    if (typeof optionConfig.type === 'undefined') {
        cfgType = CONST.TYPE.BOOLEAN;
    } else {
        cfgType = optionConfig.type.toLocaleLowerCase();
    }
    if (typeof optionConfig.short !== 'undefined') {
        option += "-" + optionConfig.short + ", ";
    }
    option += "--" + optionConfig.name;
    if (cfgType == CONST.TYPE.STRING) {
        placeholder = 'value';
        if (typeof optionConfig.placeholder !== 'undefined' && optionConfig.placeholder.trim() !== '') {
            placeholder = optionConfig.placeholder;
        }
        if (typeof optionConfig.requireValue !== 'undefined' && optionConfig.requireValue === false) {
            option += " [<" + placeholder + ">]";
        } else {
            option += " <" + placeholder + ">";
        }
    } else if(cfgType == CONST.TYPE.ARRAY) {
        placeholder = 'value';
        if (typeof optionConfig.placeholder !== 'undefined' && optionConfig.placeholder.trim() !== '') {
            placeholder = optionConfig.placeholder;
        }
        if (typeof optionConfig.requireValue !== 'undefined' && optionConfig.requireValue === false) {
            option += " [<" + placeholder + "1> [... <" + placeholder + "N>]]";
        } else {
            option += " <" + placeholder + "1> [... <" + placeholder + "N>]";
        }
    }

    if (typeof optionConfig.description !== 'undefined') {
        option += "\t\t" + optionConfig.description;
    }

    return option;
}

/**
 *
 * @param {{name: string, short: string, type: string, placeholder: string, description: string, share: boolean, params: [{}]}[]} config
 * @param [opt]
 * @return string
 */
function getUsage(config, opt) {
    var opt = opt || {};
    var usages = {
        sections: [],
        options: [],
        operands: []
    };

    var cfg, option, maxLength = 0, parts, i, section, sectionParams, sectionParam, sectionOperands;
    for (var idx in config) {
        if (config.hasOwnProperty(idx)) {
            cfg = config[idx];
            if (typeof cfg.type !== 'undefined' && cfg.type.toLocaleLowerCase() === CONST.TYPE.SECTION) {
                sectionParams = [];
                sectionOperands = [];
                for (i = 0; i < cfg.params.length; i++) {
                    if (typeof cfg.params[i].option !== 'undefined' && cfg.params[i].option === true) {
                        sectionParam = getOptionUsage({
                            name: cfg.params[i].name,
                            type: cfg.params[i].type,
                            placeholder: cfg.params[i].placeholder,
                            requireValue: cfg.params[i].requireValue,
                            description: cfg.params[i].description
                        });
                        parts = sectionParam.split("\t\t");
                        sectionParam = parts[0];
                        if (!(typeof cfg.params[i].require !== 'undefined' && cfg.params[i].require === true)) {
                            sectionParam = "[" + sectionParam + "]";
                        }
                        sectionParams.push(sectionParam);
                        if (typeof cfg.params[i].short !== 'undefined') {
                            parts[0] = '-' + cfg.params[i].short + ', ' + parts[0];
                        }
                        if (parts[0].length > maxLength) {
                            maxLength = parts[0].length;
                        }
                        usages.options.push('-' + cfg.params[i].short + ', ' + sectionParam + "\t\t" + parts[1]);
                    } else {
                        option = cfg.params[i].name;
                        if (typeof cfg.params[i].require === 'undefined' || cfg.params[i].require === false) {
                            option = "["+option+"]";
                        }
                        if (typeof cfg.params[i].type !== 'undefined' && cfg.params[i].type.toLocaleLowerCase() == CONST.TYPE.ARRAY) {
                            option += "...";
                        }
                        sectionOperands.push(option);
                    }

                }
                section = sectionParams.join(' ');
                if (typeof cfg.options !== 'undefined' && cfg.options === true ) {
                    section += " [OPTIONS]...";
                }
                section += " " + sectionOperands.join(' ');


                usages.sections.push(section.trim());
            } else {
                if (typeof cfg.option !== 'undefined' && cfg.option === true) {
                    option = getOptionUsage(cfg);
                    parts = option.split("\t\t");
                    if (parts[0].length > maxLength) {
                        maxLength = parts[0].length;
                    }
                    usages.options.push(option);
                } else {
                    option = cfg.name;
                    if (typeof cfg.require === 'undefined' || cfg.require === false) {
                        option = "["+option+"]";
                    }
                    if (typeof cfg.type !== 'undefined' && cfg.type.toLocaleLowerCase() == CONST.TYPE.ARRAY) {
                        option += "...";
                    }

                    usages.operands.push(option);
                }
            }
        }
    }
    var result = "USAGE:";
    var exec = "node " + process.argv[1].split(/\\|\//).pop();
    if (usages.sections.length == 0) {
        result += "\n";
        if (typeof opt.pretty !== 'undefined' && opt.pretty === true) {
            result += "\t";
        }
        result += exec;
        if (usages.options.length > 0) {
            result += " [OPTIONS]...";
        }
        if (usages.operands.length > 0) {
            result += " " + usages.operands.join(' ');
        }
    } else {
        for (i = 0; i < usages.sections.length; i++) {
            result += "\n";
            if (typeof opt.pretty !== 'undefined' && opt.pretty === true) {
                result += "\t";
            }
            result += exec + " " + usages.sections[i];
            if (usages.operands.length > 0) {
                result += " " + usages.operands.join(' ');
            }
        }
    }
    result += "\nOPTIONS:";
    for (idx = 0; idx < usages.options.length; idx++) {
        if (typeof opt.pretty !== 'undefined' && opt.pretty === true) {
            parts = usages.options[idx].split("\t\t");
            result += "\n\t" + parts[0];
            if (typeof parts[1] !== 'undefined') {
                for (i = 0; i < maxLength - parts[0].length + 2; i++) {
                    result += " ";
                }
                result += parts[1];
            }
        } else {
            result += "\n" + usages.options[idx];
        }

    }

    return result;
}
