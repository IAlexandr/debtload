/**
 * Created by aivanov on 07.05.2014.
 */
var debtsXlsUtils = require(__dirname + '/debtsXlsUtils');
var arcgis = require(__dirname + '/arcgis');
var _ = require('underscore');
var async = require('async');

module.exports.update = function (filePath, fsUrl, callback) {
    debtsXlsUtils.parseToJson(filePath, function (err, result) {
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
                        fsUpdate(debtsData, fsObjects, Fs, function (err, result) {
                            if (err) {
                                callback(err, null);
                            } else {
                                //todo
                            }
                        });
                    }
                })
            })
        }
    })
};

var fsUpdate = function (debtsData, fsObjects, Fs, callback) {
    async.eachLimit(
        fsObjects, 1,
        function (item, done) {
            var debt = _.find(debtsData, function (debt) {
                return debt["СНР.Объект аренды"] == item.attributes["NUMBER_CONSTR"];
            });
            if (debt) {
                item.attributes["DOLG_NA_KONEC_PERIODA"] = debt["Долг"];
                item.attributes["DESCR"] = debt["Контрагент"];
                item.attributes["OBJ_AREND"] = debt["Договор"];

                Fs.update([item], function (err, res) {
                    if (err) {
                        // произошла ошибка при попытке обновить данные
                        // todo записать item в массив с объектами завершившимися с ошибкой при обновлении
                        return done();
                    }
                    if (!res[0].success) {
                        // todo записать item в массив с объектами завершившимися с ошибкой при обновлении
                        return done();
                    }
                    // todo записать item в массив с успешно обновленными объектами
                    return done();
                })
            } else {
                // todo инф. задолженности по объекту рк не найдена.
            }
        },
        function (err) {
            //todo console.log('Добавление объектов в слой завершено.');
        }
    );
};


var buildResultReport = function () {
    //todo
};
