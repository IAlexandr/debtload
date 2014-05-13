var debtsPrepare = require("./../../lib/debtsPrepare");
var debtsUpdate = require("./../../lib/debtsUpdate");
var Sails = require('sails');
var path = require('path');
var fs = require('fs');
var io = Sails.io;

module.exports.prepareUpdate = function (filePath, FsUrl, callback) {
    Sessions.create({
        sourceFilePath: filePath,
        state: 'uploadFile',
        fsUrl: FsUrl
    }).done(function (err, session) {
        if (err) {
            return callback({"error": err}, null);
        } else {
            // Подготовка предварительного отчета.
            asyncBuildPrepReport(session);
            return callback(null, {"sessionId": session.id});
        }
    });
};
var asyncBuildPrepReport = function (session) {
    debtsPrepare.buildPrepReport(session.sourceFilePath, session.fsUrl, function (err, result) {
        if (err) {
            session.prepReport = err;
            session.save(function (err) {
                io.sockets.emit('prepReportCompleted', err, session);
            });
        } else {
            session.state = 'prepReport';
            session.prepReport = result;

            session.save(function (err) {
                io.sockets.emit('prepReportCompleted', err, session);
            });
        }
    });
};

module.exports.startUpdate = function (sessionId, callback) {
    Sessions.findOne({
        id: sessionId
    }).done(function (err, session) {
        if (err) {
            return callback({"message": "Произошла ошибка доступа к сессии! Доступ к загруженному файлу отсутствует, начните с шага №1: Загрузка файла."}, null);
        } else {
            dataUpdate(session);
            return callback(null, {"message": "Выполняется обновление задолженности в слое, пожалуйста подождите."});
        }
    });
};
var dataUpdate = function (session) {
    debtsUpdate.update(session.sourceFilePath, session.fsUrl, function (err, result) {
        if (err) {
            session.updateReport = err;
            session.save(function (err) {
                return io.sockets.emit('updateReportCompleted', err, session);
            });
        } else {
            session.state = 'dataUpdated';
            session.updateReport = result;

            session.save(function (err) {
                io.sockets.emit('updateReportCompleted', err, session);
            });
        }
    });
};

module.exports.sendReport = function (sessionId, callback) {
    var pth = path.resolve(__dirname + '../../../tmp/updateReport' + sessionId + '.xls');
    fs.exists(pth, function (exists) {
        if (exists) {
            callback(null, pth);
        } else {
            callback("Отчет не найден.", null);
        }
    });
};