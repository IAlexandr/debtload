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

module.exports = {
    prepareToLoad: function (req, res) {
        if (req.method === 'POST') {
            var filepath = req.files.file.path;
            Sessions.create({
                filePath: filepath,
                state: 'uploadFile'
            }).done(function (err, session){
                if (err) {
                    return res.json({"error": err});
                }else {
                    // Подготовка отчета.
                    var FsUrl = "http://si-sdiis/arcgis/rest/services/ai/test_shields/FeatureServer/0"; // сервис рекламные конструкции с задолженностями
                    debts.buildPrepReport(session, FsUrl, function (err, result) {
                        if (err) {
                            session.prepReport = err;
                            session.save();
                        } else {
                            session.state = 'prepReport';
                            session.prepReport = result;

                            session.save(function(err){
                                if (err){
                                    //todo вызов prepReportCompleted с ошибкой
                                }
                            });
                            debts.messageEmit('prepReportCompleted', session);
                        }
                    });
                    return res.json({sessionId:session.id});
                }
            });
        } else {
            res.view();
        }
    },

    debtsUpdate: function (req, res) {
        if (req.method === 'POST') {
            Sessions.findOne({
                id: req.body.currentSessionId
            }).done(function(err, session) {
                if (err) {
                    return console.log(err);
                } else {
                    // todo начать обновление задолженности в слое
                }
            });
        }
    },

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to DebtController)
     */
    _config: {}


};
