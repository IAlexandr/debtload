/**
 * Created by aivanov on 07.05.2014.
 */
var debtsXlsUtils = require(__dirname + '/debtsXlsUtils');
var arcgis = require(__dirname + '/arcgis');
var _ = require('underscore');

module.exports.update = function (filePath, fsUrl, callback){
    callback(null, {"":""});
};


var buildResultReport = function () {
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
