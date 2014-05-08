var debtsPrepare = require("./../../lib/debtsPrepare");
var debtsUpdate = require("./../../lib/debtsPrepare");
var Sails = require('sails');
var io = Sails.io;

module.exports.prepareUpdate = function (filePath, FsUrl, callback) {
    Sessions.create({
        filePath: filePath,
        state: 'uploadFile'
    }).done(function (err, session) {
        if (err) {
            callback({"error": err}, null);
        } else {
            // Подготовка предварительного отчета.
            asyncBuildPrepReport(session, FsUrl);
            callback(null, {"sessionId": session.id});
        }
    });
};

var asyncBuildPrepReport = function (session, FsUrl) {
    debtsPrepare.buildPrepReport(session.filePath, FsUrl, function (err, result) {
        if (err) {
            session.prepReport = err;
            session.save(function (err) {
                if (err) {
                    io.sockets.emit('prepReportCompleted', err, session);
                }
            });
            io.sockets.emit('prepReportCompleted', err, session);
        } else {
            session.state = 'prepReport';
            session.prepReport = result;

            session.save(function (err) {
                if (err) {
                    io.sockets.emit('prepReportCompleted', err, session);
                }
            });
            io.sockets.emit('prepReportCompleted', err, session);
        }
    });
};

module.exports.startUpdate = function (sessionId, fsUrl, callback) {
    Sessions.findOne({
        id: sessionId
    }).done(function (err, session) {
        if (err) {
            callback({"message": "Произошла ошибка доступа к сессии! Доступ к загруженному файлу отсутствует, начните с шага №1: Загрузка файла."}, null);
        } else {
            dataUpdate(session, fsUrl);
            callback(null, {"message": "Выполняется обновление задолженности в слое, пожалуйста подождите."});
        }
    });
};

var dataUpdate = function (session, FsUrl) {
    debtsUpdate.update(session.filePath, FsUrl, function (err, result) {
        if (err) {
            session.resultReport = err;
            session.save(function (err) {
                if (err) {
                    io.sockets.emit('resultReportCompleted', err, session);
                }
            });
            io.sockets.emit('resultReportCompleted', err, session);
        } else {
            session.state = 'dataUpdated';
            session.resultReport = result;

            session.save(function (err) {
                if (err) {
                    io.sockets.emit('resultReportCompleted', err, session);
                }
            });
            io.sockets.emit('resultReportCompleted', err, session);
        }
    });
};