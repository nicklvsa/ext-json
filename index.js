const fs = require('fs');
const dotenv = require('dotenv').config();

if (dotenv.error) {
    throw dotenv.error;
}

const inputFile = process.env.INPUT_PATH;
if (!inputFile) {
    throw 'Input file not set!';
}

const outputFile = process.env.OUTPUT_PATH;
if (!outputFile) {
    throw 'Output file not set!';
}

const debug = process.env.SHOULD_DEBUG;
if (!debug) {
    throw 'Debug not set!';
}

fs.readFile(inputFile, 'utf8', (err, raw) => {
    if (err) {
        throw err;
    }

    const data = JSON.parse(raw);
    if (!data) {
        throw 'Could not parse data from the input file!';
    }

    const flat = flatten(data);
    const possibleContainers = [];
    const errors = [];

    for (let d in flat) {
        if (d.startsWith('//') || (d.split('.').length > 1 && d.split('.')[1].startsWith('//'))) delete flat[d];
        possibleContainers.push(`{{${d}}}`);
    }

    for (const d in flat) {
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

    if (debug === 'true') {
        console.log(flat);
        if (errors && errors.length > 0) {
            errors.forEach((err, i) => {
                console.error(`\n\n#${i}: ${err}`);
            });
        }
    }
    
    const normal = JSON.stringify(unflatten(flat), null, '\t');

    fs.writeFile(outputFile, normal, (err) => {
        if (err) {
            throw err;
        }
    });
});

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