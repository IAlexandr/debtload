var debtsXlsUtils = require(__dirname + '/debtsXlsUtils');
var arcgis = require(__dirname + '/arcgis');
var _ = require('underscore');


module.exports.buildPrepReport = function (session, fsUrl, callback) {
    debtsXlsUtils.parseToJson(session.filePath, function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            // массив записей с данными о задолженности result
            var debtsData = result;
            arcgis.connectFeatureServer(fsUrl, function (err, Fs) {
                if (err) throw err;
                Fs.query({returnGeometry: true, where: "1=1"}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var fsObjects = result.features;
                        createPrepReport(debtsData, fsObjects, callback);
                    }
                })
            })
        }
    })
};

var createPrepReport = function (debtsData, fsObjects, callback) {
    var missingFsObjects = searchFsObjInDebtsData(debtsData, fsObjects);
    var missingDebtsObjects = searchDebtsDataInFsObj(fsObjects, debtsData);
    var sessionReport = preparePrepReport(debtsData, fsObjects, missingDebtsObjects, missingFsObjects);
    callback(null, JSON.stringify(sessionReport));
}

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

var preparePrepReport = function (debtsData, fsObjects, missingDebtsObjects, missingFsObjects) {
    var report = {};
    report.FsObjInDebtsData = {};
    report.FsObjInDebtsData.missQuantity = missingFsObjects.length;
    report.FsObjInDebtsData.missList = missingFsObjects;
    report.FsObjInDebtsData.updateQuantity = fsObjects.length - missingFsObjects.length;
    report.FsObjInDebtsData.totalFsObjects = fsObjects.length;

    report.DebtsDataInFsObj = {};
    report.DebtsDataInFsObj.missQuantity = missingDebtsObjects.length;
    report.DebtsDataInFsObj.missList = missingDebtsObjects;
    report.DebtsDataInFsObj.updateQuantity = debtsData.length - missingDebtsObjects.length;
    report.DebtsDataInFsObj.totalDebtsObjects = debtsData.length;

    return report;
}