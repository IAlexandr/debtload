/**
 * DebtController
 *
 * @module      :: Controller
 * @description    :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var path = require('path');

module.exports = {
    prepare: function (req, res) {
        if (req.method === 'POST') {
            var filepath = req.files.file.path;
            // var FsUrl = "http://gis.informatica.ru/arcgis/rest/services/ai/test_shields/FeatureServer/0";
           var FsUrl = "http://si-sdiis/arcgis/rest/services/ai/test_shields/FeatureServer/0"; // сервис рекламные конструкции с задолженностями в котором будет обновлена задолженность
            /**  создание сессии
             * возвращает {sessionId: session.id}, асинхронно запускает подготовку предварительного отчета,
             * который после выполнения вызовет sockets.emit(prepReportCompleted)
             */
            debts.prepareUpdate(filepath, FsUrl, function (err, result) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(result);
                }
            });
        } else {
            res.view();
        }
    },

    update: function (req, res) {
        if (req.method === 'POST') {
            debts.startUpdate(req.body.currentSessionId, function (err, result) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(result);
                }
            });
        } else {
            res.view();
        }
    },

    reportToXls: function (req, res) {
        debts.updateReportToXls(req.query.currentSessionId, function (err, result) {

            if (err) {
                res.json(err);
            } else {
                if (result.message = 'done.'){  // todo
                    var pth = path.resolve(__dirname + '../../../tmp/updateReport' + result.sessionId+ '.xls');
                    res.sendfile(pth);
                }
            }
        });
    },
    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to DebtController)
     */
    _config: {}


};
