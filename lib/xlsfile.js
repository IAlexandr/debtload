/**
 * Created by aivanov on 30.04.2014.
 */
var XLS = require('xlsjs');


module.exports.read = function (path, callback) {
    try {
        var rfile = XLS.readFile(path);
        var sheet = rfile.Sheets[rfile.SheetNames[0]];
        return callback(null, sheet);
    } catch (e) {
        return callback(e, null);
    }
}
var _chr = function (c) {
    return String.fromCharCode(c);
};
// столбец
function encode_col(col) {
    var s = "";
    for (++col; col; col = Math.floor((col - 1) / 26)) s = _chr(((col - 1) % 26) + 65) + s;
    return s;
}
// строка
function encode_row(row) {
    return "" + (row + 1);
}
// перевод в номер ячейки
module.exports.encode_cell = function (cell) {
    return encode_col(cell.c) + encode_row(cell.r);
}
function decode_col(c) {
    var d = 0, i = 0;
    for (; i !== c.length; ++i) d = 26 * d + c.charCodeAt(i) - 64;
    return d - 1;
}
function decode_row(rowstr) {
    return Number(rowstr) - 1;
}
function split_cell(cstr) {
    return cstr.replace(/(\$?[A-Z]*)(\$?[0-9]*)/, "$1,$2").split(",");
}
function decode_cell(cstr) {
    var splt = split_cell(cstr);
    return { c: decode_col(splt[0]), r: decode_row(splt[1]) };
}
module.exports.decode_range = function (range) {
    var x = range.split(":").map(decode_cell);
    return {s: x[0], e: x[x.length - 1]};
}
function encode_range(range) {
    return encode_cell(range.s) + ":" + encode_cell(range.e);
};


/* xlgen

var xl = require('xlgen');

module.exports.generateXls = function (path, data, callback) {
   var xlg = xl.createXLGen(path);

    data.forEach(function (sheet, i, data){
        var sht = xlg.addSheet(sheet.name);
        sheet.data.forEach(function (cell, i, arr) {
            var c = cell;
            sht.cell(c.row, c.col, c.val);
        });
    });
    var sht2 = xlg.addSheet('myname');
    sht2.cell(1, 1, "1");
    xlg.end(function (err) {
        if (err) {
            return callback(err, null);
        }
        else {
            return callback(null, 'complete');
        }
    });
}*/