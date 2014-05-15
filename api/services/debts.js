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
            session.state = 'fileLoaded';
            session.save(function (saveerr) {
                if (err){
                    return io.sockets.emit('prepReportCompleted', err.message, session);
                } else {
                    return io.sockets.emit('prepReportCompleted', saveerr, session);
                }
            });
        } else {
            session.state = 'prepReport';
            session.prepReport = result;

            session.save(function (err) {
                return io.sockets.emit('prepReportCompleted', err, session);
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
    var updateReportPath = path.resolve(__dirname + '../../../tmp/updateReport' + session.id + '.xlsx');
    debtsUpdate.update(updateReportPath, session.sourceFilePath, session.fsUrl, function (err, result) {
        if (err) {
            session.updateReport = err;
            session.createdDate = new Date();
            session.save(function (saveerr) {
                if (err){
                    return io.sockets.emit('updateReportCompleted', err.message, session);
                } else {
                    return io.sockets.emit('updateReportCompleted', saveerr, session);
                }
            });
        } else {
            session.state = 'dataUpdated';

            // For todays date;
            Date.prototype.today = function () {
                return ((this.getDate() < 10)?"0":"") + this.getDate() +"."+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"."+ this.getFullYear();
            }

// For the time now
            Date.prototype.timeNow = function () {
                return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
            }

            var newDate = new Date();
            var datetime = newDate.today() + " - " + newDate.timeNow();
            session.createdDate = datetime;
            session.updateReport = result;

            session.save(function (err) {
                return io.sockets.emit('updateReportCompleted', err, session);
            });
        }
    });
};

module.exports.sendReport = function (sessionId, callback) {
    var pth = path.resolve(__dirname + '../../../tmp/updateReport' + sessionId + '.xlsx');
    fs.exists(pth, function (exists) {
        if (exists) {
            callback(null, pth);
        } else {
            callback("Отчет не найден.", null);
        }
    });
};