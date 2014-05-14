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

            var debtsDataWithoutStel = [];
            var debtsStel = [];

            _.each(debtsData, function (debt) {
                var stelName = debt["СНР.Объект аренды"].indexOf('ст');   // проверяем на имя стелы
                if (stelName == -1) {
                    debtsDataWithoutStel.push(debt);
                } else {
                    debtsStel.push(debt);
                }
            });

            arcgis.connectFeatureServer(fsUrl, function (err, Fs) {
                if (err) {
                    return callback(err, null);
                }
                Fs.query({returnGeometry: true, where: "1=1"}, function (err, result) {
                    if (err) {
                        return callback(err, null);
                    } else {
                        var fsObjects = result.features;
                        return callback(null, debtsDataWithoutStel, fsObjects, Fs);
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
        var missingFsObjectsAndFounds = searchFsObjInDebtsData(debtsData, fsObjects);
        var report = module.exports.prepareReport(fsObjects, debtsData, missingFsObjectsAndFounds);
        return callback(err, JSON.stringify(report));
    });
};

// Поиск объектов из FC в данных из полученного файла. Возвращает массив с ненайденными СНР.объектами аренды
var searchFsObjInDebtsData = function (debtsData, fsObjects) {
    var missingList = [];
    var foundList = [];
    _.each(fsObjects, function (fsObj) {
        /*var even = _.find(debtsData, function (debt) {
         return debt["СНР.Объект аренды"] == fsObj.attributes["NUMBER_CONSTR"];
         });*/
        /* if (!even) {
         missingList.push(fsObj.attributes["NUMBER_CONSTR"]);
         }*/
        var k = false;
        debtsData.forEach(function (debt) {
            if (debt["СНР.Объект аренды"] == fsObj.attributes["NUMBER_CONSTR"]) {
                k = true;
            }
        });
        if (!k) {
            missingList.push(fsObj.attributes["NUMBER_CONSTR"]);
        } else {
            foundList.push(fsObj.attributes["NUMBER_CONSTR"]);
        }
    });
    return [missingList, foundList];
}

// Поиск данных из полученного файла в объектах из FC. Возвращает массив с ненайденными СНР.объектами аренды
var searchDebtsDataInFsObj = function (fsObjects, debtsData) {
    var missingList = [];
    var foundList = [];
    _.each(debtsData, function (debt) {
        /* var even = _.find(fsObjects, function (fsObj) {
         return debt["СНР.Объект аренды"] == fsObj.attributes["NUMBER_CONSTR"];
         });*/
        var k = false;
        fsObjects.forEach(function (fsObj) {
            if (debt["СНР.Объект аренды"] == fsObj.attributes["NUMBER_CONSTR"]) {
                k = true;
            }
        });
        if (!k) {
            missingList.push(debt["СНР.Объект аренды"]);
        } else {
            foundList.push(debt["СНР.Объект аренды"]);
        }

    });
    return [missingList, foundList];
}

module.exports.prepareReport = function (fsObjects, debtsData, missingFsObjectsAndFounds, fsupdated, foundsWithError) {
    var unfoundList = missingFsObjectsAndFounds[0];
    var foundList = missingFsObjectsAndFounds[1];
    var report = {};
    report.FsObjInDebtsData = {                         // Искали каждую рекламную конструкцию (объект слоя РК) в списке долгов (в файле xls)
        totals: fsObjects.length,                       // общее кол-во
        founds: foundList.length,  // нашлось
        foundList: foundList,
        unfounds: unfoundList.length,                   // не нашлось
        unfoundList: unfoundList,                       // список ненайденных СНР РК
        foundsWithError: 0,             // нашлись, но не обновились (при обновлении завершились с ошибкой)
        updated: 0                                      // обновилось
    };
    if (fsupdated && foundsWithError) {
        report.FsObjInDebtsData.foundsWithError = foundsWithError.length;         // нашлись, но не обновились (при обновлении завершились с ошибкой)
        report.FsObjInDebtsData.updated = fsupdated.length;                        // обновилось
    }

    var missingDebtsObjectsAndFounds = searchDebtsDataInFsObj(fsObjects, debtsData);
    var unfoundList2 = missingDebtsObjectsAndFounds[0];
    var foundList2 = missingDebtsObjectsAndFounds[1];

    var uniqList = checkUniqDebts(foundList2);

    report.DebtsDataInFsObj = {                         // Искали каждый долг (из файла xls) в списке рекламных конструкций (в слое РК)
        totals: debtsData.length,                       // общее кол-во
        founds: foundList2.length,     // нашлось
        foundList: uniqList,
        unfounds: unfoundList2.length,                   // не нашлось
        unfoundList: unfoundList2                        // список ненайденных СНР РК
    };
    return report;
};

var checkUniqDebts = function (foundList2) {
    var uniqList = _.uniq(foundList2);
    var copyList = [];
    uniqList.forEach(function (uniqDebt){
        var currCopy = {
            name: uniqDebt,
            count: 0
        };
       // console.log('uniq - ' + uniqDebt);
        foundList2.forEach(function (debt) {
            if (uniqDebt == debt) {
                currCopy.count += 1;
               // console.log('debt - ' + debt);
            }
        });
        copyList.push(currCopy);
    });
    //console.log(copyList);

    var resultList = [];
    copyList.forEach(function (debt) {
        if (debt.count > 1){
            resultList.push(debt.name + ": " + debt.count);
        }
    });
    return resultList;
};