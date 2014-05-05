var xlsfile = require(__dirname + '/xlsfile');

module.exports.parseToJson = function (path, callback) {
    xlsfile.read(path, function (err, rawData) {
        if (err) {
            return callback(err, null);
        }
        checkData(rawData, function (err, isChecked) {
            if (isChecked) {
                var data = prepareData(rawData);
                return callback(null, data);
            } else {
                return callback("Неверная структура данных в файле", null);
            }
        });
    });
};
var prepareData = function (sheet) {
    var amountOfContract = {};
    var date = getDate(sheet);
    var data = getData(sheet);
    data.forEach(function (val){
        amountOfContract[val['Договор']] = 0;
    });
    data.forEach(function (val){
        amountOfContract[val['Договор']] += 1;
    });
    data.forEach(function (val){
        val['Дата'] = date;
        val['Количество рекламных конструкций в договоре'] = amountOfContract[val['Договор']];
    });
    return data;
};
var checkData = function (sheet, callback) {
    if (sheet["!ref"]) {
        var isChecked = true;
        var checkCells = [
            {c: 0, r: 3, value: 'Контрагент'},
            {c: 3, r: 3, value: 'Договор'},
            {c: 5, r: 3, value: 'СНР.Объект аренды'},
            {c: 6, r: 3, value: 'Долг'}
        ];
        checkCells.forEach(function (cell) {
            var value = sheet[xlsfile.encode_cell(cell)];

            if (value != undefined) {
                if (value.v != cell.value) {
                    isChecked = false;
                }
            } else {
                isChecked = false;
            }
        });
        return callback(null, isChecked);
    }
};
var getDate = function (sheet) {
    if (sheet["!ref"]) {
        var val = sheet[xlsfile.encode_cell({
            c: 2,
            r: 1
        })];
        if (val) {
            var str = val.v;
            return str.substring(6);
        } else {
            return "";
        }
    }
};
var getData = function (sheet) {
    var val, rowObject, range, columnHeaders, emptyRow, pushToOutSheet, C;
    var outSheet = [];
    if (sheet["!ref"]) {
        range = xlsfile.decode_range(sheet["!ref"]);
        range.s.r = 3;
        columnHeaders = prepareColumnHeaders(range, sheet);

        for (var R = range.s.r + 1; R <= range.e.r; ++R) {
            emptyRow = true;
            pushToOutSheet = false;
            rowObject = Object.create({ __rowNum__: R });
            for (C = range.s.c; C <= range.e.c; ++C) {
                val = sheet[xlsfile.encode_cell({
                    c: C,
                    r: R
                })];
                if (val !== undefined) switch (val.t) {
                    case 's':
                    case 'str':
                    case 'b':
                    case 'n':
                        if (val.v !== undefined) {
                            rowObject[columnHeaders[C]] = val.v;
                            emptyRow = false;
                        }
                        if (columnHeaders[C] == "СНР.Объект аренды" && val.v !== undefined) {
                            pushToOutSheet = true;
                        }
                        break;
                    case 'e':
                        break;
                    default:
                        throw 'unrecognized type ' + val.t;
                }
            }
            if (!emptyRow && pushToOutSheet) {
                outSheet.push(rowObject);
            }
        }
    }
    return outSheet;
};
var prepareColumnHeaders = function (range, sheet) {
    columnHeaders = {};
    for (C = range.s.c; C <= range.e.c; ++C) {
        val = sheet[xlsfile.encode_cell({
            c: C,
            r: range.s.r
        })];
        if (val) {
            switch (val.t) {
                case 's':
                case 'str':
                    columnHeaders[C] = val.v;
                    break;
                case 'n':
                    columnHeaders[C] = val.v;
                    break;
            }
        }
    }
    return columnHeaders;
}
