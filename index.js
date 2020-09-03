const fs = require('fs');
const cmdArgs = require('command-line-args');
const { resolve } = require('path');

const defOpts = [
    {
        name: 'input', 
        alias: 'i', 
        multiple: true,
        type: String,
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
    },
];

const options = cmdArgs(defOpts);

let inputFile = options.input;
if (!inputFile) {
    throw 'Input file not set!';
}

const outputFile = options.output;
if (!outputFile) {
    throw 'Output file not set!';
}

const readFiles = async (files) => {
    const result = [];

    const proms = files.map((_path) => {
        return new Promise(function (_path, resolve, reject) {
            fs.readFile(_path, 'utf8', (err, raw) => {
                if (err) {
                    resolve(err);
                } else {
                    resolve(raw);
                }
            });
        }.bind(this, _path));
    });

    await Promise.all(proms).then((values) => {
        values.forEach((val) => {
            const content = JSON.parse(val);
            result.push(content);
        });
    });

    return result;
};

const run = (inputData) => {
    const flat = flatten(inputData);
    const refs = [];
    const specialToDelete = [];
    const possibleContainers = [];
    const errors = [];

    for (let d in flat) {
        if (d.startsWith('__ext_json__')) {
            // TODO: possibly add configurable options
            delete flat[d];
        }
        if (d.startsWith('//') || (d.split('.').length > 1 && d.split('.')[1].startsWith('//'))) delete flat[d];
        if (d.startsWith('>>')) {
            flat[d.substring(2)] = flat[d];
            specialToDelete.push(d.substring(2));
            possibleContainers.push(`{{${d.substring(2)}}}`);
            delete flat[d];
        }
        possibleContainers.push(`{{${d}}}`);
    }

    for (let d in flat) {
        try {
            possibleContainers.forEach((container) => {
                if (flat[d].includes(container)) {
                    flat[d] = flat[d].replace(container, flat[possibleContainers.find((e) => e === container).replace('{{', '').replace('}}', '').trim()]);
                }
            });
        } catch (e) {
            errors.push(e);
        }
    }
    
    for (let s of specialToDelete) {
        if (flat[s]) delete flat[s];
    }
    
    const normal = JSON.stringify(unflatten(flat), null, '\t');

    fs.writeFile(outputFile, normal, (err) => {
        if (err) {
            throw err;
        }
    });

    if (errors && errors.length > 0) {
        errors.forEach((err, i) => {
            console.error(`#${i}: ${err}`);
        });
    }
};

const unflatten = (data) => {
    if (Object(data) !== data || Array.isArray(data))
    return data;
    var result = {}, cur, prop, idx, last, temp;
    for(var p in data) {
        cur = result, prop = "", last = 0;
        do {
            idx = p.indexOf(".", last);
            temp = p.substring(last, idx !== -1 ? idx : undefined);
            cur = cur[prop] || (cur[prop] = (!isNaN(parseInt(temp)) ? [] : {}));
            prop = temp;
            last = idx + 1;
        } while(idx >= 0);
        cur[prop] = data[p];
    }
    return result[""];
};

const flatten = (data) => {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop ? prop+"."+i : ""+i);
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
};

// run the preprocessor
(async () => {
    const res = await readFiles(inputFile);
    run(res.reduce((result, current) => {
        return Object.assign(result, current);
    }, {}));
})();