var debtsPrepare = require(__dirname + '/debtsPrepare');
var xlsxfile = require(__dirname + '/xlsxfile');
var _ = require('underscore');
var async = require('async');

module.exports.update = function (updateRepPath, filePath, fsUrl, callback) {
    async.waterfall([
        function (callback) {
            debtsPrepare.dataPrepare(filePath, fsUrl, callback);
        },
        function (debtsData, fsObjects, Fs, callback) {
            fsUpdate(debtsData, fsObjects, Fs, callback);
        },
        function (fsObjects, debtsData, successList, errorList, missingList, callback) {
            buildUpdateReport(fsObjects, debtsData, successList, errorList, missingList, callback);
        }
    ], function (err, result) {
        buildUpdateReportXlsx(result, updateRepPath);
        return callback(err, JSON.stringify(result));
    });
};

var fsUpdate = function (debtsData, fsObjects, Fs, callback) {

    var updateList = [];               // нашлось
    var errorList = [];       // нашлись, но не обновились
    var missingList = [];          // не нашлось
    async.each(
        fsObjects,
        function (item, done) {
            var debt = _.find(debtsData, function (debt) {
                return debt["СНР.Объект аренды"] == item.attributes["NUMBER_CONSTR"];
            });
            if (debt) {
                item.attributes["DOLG_NA_KONEC_PERIODA"] = debt["Долг"];
                item.attributes["DESCR"] = debt["Контрагент"];
                item.attributes["OBJ_AREND"] = debt["Договор"];
                item.attributes["ACTUALDATE"] = debt["Дата"];

                Fs.update([item], function (err, res) {
                    if (err) {
                        // произошла ошибка при попытке обновить данные
                        // записать item в массив с объектами завершившимися с ошибкой при обновлении
                        errorList.push(item.attributes["NUMBER_CONSTR"]);
                        return done();
                    }
                    if (!res[0].success) {
                        // записать item в массив с объектами завершившимися с ошибкой при обновлении
                        errorList.push(item.attributes["NUMBER_CONSTR"]);
                        return done();
                    }
                    // записать item в массив с успешно обновленными объектами
                    updateList.push(item.attributes["NUMBER_CONSTR"]);
                    return done();
                })
            } else {
                // инф. задолженности по объекту рк не найдена.
                missingList.push(item.attributes["NUMBER_CONSTR"]);
                return done();
            }
        },
        function (err) {
            // Добавление объектов в слой завершено
            if (err) {
                return callback(err, null);
            } else {
                return callback(null, fsObjects, debtsData, updateList, errorList, missingList);
            }
        }
    );
};


var buildUpdateReport = function (fsObjects, debtsData, updateList, errorList, missingList, callback) {
    var report = debtsPrepare.prepareReport(fsObjects, debtsData, missingList, updateList, errorList);
    return callback(null, report);
};

var buildUpdateReportXlsx = function (report, pth) {

    var book = {
        "worksheets": []
    };

    var sheet1 = {
        "name": "РК в долгах",
        "data": []
    }
    var sheet2 = {
        "name": "Долги в РК",
        "data": []
    }

    sheet1.data = [
        [
            {
                "formatCode": "General",
                value: "Общее кол-во"
            },
            {
                "formatCode": "General",
                value: report.FsObjInDebtsData.totals
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Найдено"
            },
            {
                "formatCode": "General",
                value: report.FsObjInDebtsData.founds
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Обновилось"
            },
            {
                "formatCode": "General",
                value: report.FsObjInDebtsData.updated
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Нашлось, но не обновилось"
            },
            {
                "formatCode": "General",
                value: report.FsObjInDebtsData.foundsWithError
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Не найдено"
            },
            {
                "formatCode": "General",
                value: report.FsObjInDebtsData.unfounds
            }
        ],
        [
            {
                "formatCode": "General",
                value: ""
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Список ненайденных рекламных конструкций (СНР. объекта аренды):"
            }
        ]
    ];

    report.FsObjInDebtsData.unfoundList.forEach(function (unfound, i, arr) {
        sheet1.data.push(
            [
                {
                    "formatCode": "General",
                    value: unfound
                }
            ]
        );
    });

    sheet2.data = [
        [
            {
                "formatCode": "General",
                value: "Общее кол-во"
            },
            {
                "formatCode": "General",
                value: report.DebtsDataInFsObj.totals
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Найдено"
            },
            {
                "formatCode": "General",
                value: report.DebtsDataInFsObj.founds
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Не найдено"
            },
            {
                "formatCode": "General",
                value: report.DebtsDataInFsObj.unfounds
            }
        ],
        [
            {
                "formatCode": "General",
                value: ""
            }
        ],
        [
            {
                "formatCode": "General",
                value: "Список ненайденных рекламных конструкций (СНР. объекта аренды):"
            }
        ]
    ];

    report.DebtsDataInFsObj.unfoundList.forEach(function (unfound, i, arr) {
        sheet2.data.push(
            [
                {
                    "formatCode": "General",
                    value: unfound
                }
            ]
        );
    });

    book.worksheets = [sheet1, sheet2];




    xlsxfile.buildXlsxFile(pth, book, function (err, result) {
        if (err) {
            //todo доделать
        }
    });
};

/* xlgen создание xls
 var buildUpdateReportXls = function (report) {
 var cells1 = [
 {
 row: 0,
 col: 0,
 val: "Общее кол-во"
 },
 {
 row: 0,
 col: 1,
 val: "totals"
 },
 {
 row: 1,
 col: 0,
 val: "Найдено"
 },
 {
 row: 1,
 col: 1,
 val: "founds"
 },
 {
 row: 2,
 col: 0,
 val: "Обновилось"
 },
 {
 row: 2,
 col: 1,
 val: "updated"
 },
 {
 row: 3,
 col: 0,
 val: "Нашлось, но не обновилось"
 },
 {
 row: 3,
 col: 1,
 val: "foundsWithError"
 },
 {
 row: 4,
 col: 0,
 val: "Не найдено"
 },
 {
 row: 4,
 col: 1,
 val: "unfounds"
 },
 {
 row: 5,
 col: 0,
 val: "Список ненайденных рекламных конструкций (СНР. объекта аренды):"
 }
 ];
 var unfoundListCells1 = [];
 report.FsObjInDebtsData.unfoundList.forEach(function (unfound, i, arr) {
 unfoundListCells1.push(
 {
 row: 6 + i,
 col: 0,
 val: unfound
 }
 );
 });


 var unionCells1 =  _.union(cells1, unfoundListCells1);

 var sheet1 = createSheet("РК в долгах", unionCells1);

 var cells2 = [
 {
 row: 0,
 col: 0,
 val: "Общее кол-во"
 },
 {
 row: 0,
 col: 1,
 val: "totals"
 },
 {
 row: 1,
 col: 0,
 val: "Найдено"
 },
 {
 row: 1,
 col: 1,
 val: "founds"
 },
 {
 row: 2,
 col: 0,
 val: "Не найдено"
 },
 {
 row: 2,
 col: 1,
 val: "unfounds"
 },
 {
 row: 3,
 col: 0,
 val: "Список ненайденных рекламных конструкций (СНР. объекта аренды):"
 }
 ];
 var unfoundListCells2 = [];
 report.DebtsDataInFsObj.unfoundList.forEach(function (unfound, i, arr) {
 unfoundListCells2.push(
 {
 row: 4 + i,
 col: 0,
 val: unfound
 }
 );
 });
 var unionCells2 =  _.union(cells2, unfoundListCells2);
 var sheet2 = createSheet("Долги в РК", unionCells2);

 var book = [sheet1];//, sheet2



 var path = require('path'); // временно для теста
 var pth = path.resolve(__dirname + '../../tmp/updateReport123.xls');
 xlsfile.generateXls(pth, book, function (err, result) {
 if (err) {

 }
 })
 };

 var createSheet = function (name, cells) {
 var sheet = {"name": name};
 sheet.data = [];
 cells.forEach(function (cell) {
 sheet.data.push(cell);
 });
 return sheet;
 };*/