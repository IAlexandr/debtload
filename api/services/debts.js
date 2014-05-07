/**
 * Created by aivanov on 30.04.2014.
 */
var debtsXlsUtils = require("./../../lib/debtsXlsUtils");
var debtsPrepare = require("./../../lib/debtsPrepare");

var Sails = require('sails');
var io = Sails.io;

module.exports.buildPrepReport = function (filePath, fsUrl, callback) {
    debtsPrepare.buildPrepReport(filePath, fsUrl, callback);
};

module.exports.messageEmit = function (ch, err, data) {
    io.sockets.emit(ch, err, data);
}

module.exports.debtsUpdate = function () {

};