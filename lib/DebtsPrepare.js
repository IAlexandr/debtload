var debtsXlsUtils = require(__dirname + '/debtsXlsUtils');
var arcgis = require(__dirname + '/arcgis');
var _ = require('underscore');

module.exports.dataPrepare = function (filePath, fsUrl, callback) {
    debtsXlsUtils.parseToJson(filePath, function (err, result) {
        if (err) {
            return callback(err, null);
        } else {
            // массив записей с данными о задолженности result
            var debtsData = result;
            arcgis.connectFeatureServer(fsUrl, function (err, Fs) {
                if (err) {
                    return callback(err, null);
                }
                Fs.query({returnGeometry: true, where: "1=1"}, function (err, result) {
                    if (err) {
                        return callback(err, null);
                    } else {
                        var fsObjects = result.features;
                        return callback(null, debtsData, fsObjects, Fs);
                    }
                })
            })
        }
    })
};

module.exports.buildPrepReport = function (filePath, fsUrl, callback) {
    module.exports.dataPrepare(filePath, fsUrl, function (err, debtsData, fsObjects) {
        if (err) {
            return callback(err, null);
        }
        var missingFsObjects = searchFsObjInDebtsData(debtsData, fsObjects);
        //var missingDebtsObjects = searchDebtsDataInFsObj(fsObjects, debtsData);
        // var sessionReport = preparePrepReport(debtsData.length, fsObjects.length, missingDebtsObjects, missingFsObjects);
        var report = module.exports.prepareReport(fsObjects, debtsData, missingFsObjects);
        return callback(err, JSON.stringify(report));
    });
};

// Поиск объектов из FC в данных из полученного файла. Возвращает массив с ненайденными СНР.объектами аренды
var searchFsObjInDebtsData = function (debtsData, fsObjects) {
    var missingList = [];
    _.each(fsObjects, function (fsObj) {
        var even = _.find(debtsData, function (debt) {
            return debt["СНР.Объект аренды"] == fsObj.attributes["NUMBER_CONSTR"];
        });
        if (!even) {
            missingList.push(fsObj.attributes["NUMBER_CONSTR"]);
        }
    });
    return missingList;
}

// Поиск данных из полученного файла в объектах из FC. Возвращает массив с ненайденными СНР.объектами аренды
var searchDebtsDataInFsObj = function (fsObjects, debtsData) {
    var missingList = [];
    _.each(debtsData, function (debt) {
        var even = _.find(fsObjects, function (fsObj) {
            return debt["СНР.Объект аренды"] == fsObj.attributes["NUMBER_CONSTR"];
        });
        if (!even) {
            var stelName = debt["СНР.Объект аренды"].indexOf('ст');   // проверяем на имя стелы
            if (stelName == -1) {
                missingList.push(debt["СНР.Объект аренды"]);
            }
        }
    });
    return missingList;
}

module.exports.prepareReport = function (fsObjects, debtsData, unfoundList, fsupdated, foundsWithError) {
    var report = {};
    report.FsObjInDebtsData = {                         // Искали каждую рекламную конструкцию (объект слоя РК) в списке долгов (в файле xls)
        totals: fsObjects.length,                       // общее кол-во
        founds: fsObjects.length - unfoundList.length,  // нашлось
        unfounds: unfoundList.length,                   // не нашлось
        unfoundList: unfoundList,                       // список ненайденных СНР РК
        foundsWithError: 0,             // нашлись, но не обновились (при обновлении завершились с ошибкой)
        updated: 0                                      // обновилось
    };
    if (fsupdated && foundsWithError){
        report.FsObjInDebtsData.foundsWithError = foundsWithError.length;         // нашлись, но не обновились (при обновлении завершились с ошибкой)
        report.FsObjInDebtsData.updated = fsupdated.length;                        // обновилось
    }

    var missingDebtsObjects = searchDebtsDataInFsObj(fsObjects, debtsData);
    report.DebtsDataInFsObj = {                         // Искали каждый долг (из файла xls) в списке рекламных конструкций (в слое РК)
        totals: debtsData.length,                       // общее кол-во
        founds: debtsData.length - missingDebtsObjects.length,     // нашлось
        unfounds: missingDebtsObjects.length,                   // не нашлось
        unfoundList: missingDebtsObjects                        // список ненайденных СНР РК
    };
    return report;
}