var debtsPrepare = require(__dirname + '/debtsPrepare');
var _ = require('underscore');
var async = require('async');

module.exports.update = function (filePath, fsUrl, callback) {
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
        return callback(err, result);
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
    return callback(null, JSON.stringify(report));
};