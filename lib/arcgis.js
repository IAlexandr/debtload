var request = require('superagent');
var _ = require('underscore');

// callback(err, fl)
module.exports.connectFeatureServer = function (fsUrl, callback) {
    // todo: Обработать fsUrl, достраивая его при необходимости url
    try {
        request
            .get(fsUrl)
            .query({ f: 'json' })
            .accept('json')
            .on('error', function (err) {
                console.log('!!!!');
                return callback(err);
            })
            .end(function (res) {
                try {
                    var fsInfo = JSON.parse(res.text);
                } catch (e) {
                    return callback(new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
                }

                // todo: Сделать более широкую проверку типа слоя
                if (!(fsInfo.type && fsInfo.type === 'Feature Layer')) {
                    return callback(new Error('Passed URL seems to be not an Arcgis FeatureServer REST endpoint'));
                }

                return callback(null, new FeatureServer(fsUrl, fsInfo));
            });
    } catch (e) {
        return callback(new Error('Incorrect URL or similar error.'));
    }
};

var FeatureServer = function (fsUrl, fsInfo) {
    this.fsUrl = fsUrl;
    this.fsInfo = fsInfo;
};

// http://si-sdiis/arcgis/sdk/rest/index.html#//02ss0000002r000000
FeatureServer.prototype.query = function (options, callback) {
    var params = _.defaults(options, {
        outFields: '*',
        returnGeometry: false
    });

    // Если в objectIds массив, преобразуем его в строку
    if (_.isArray(params.objectIds)) {
        params.objectIds = params.objectIds.join(', ');
    }

    params.f = 'json';

    request
        .get(this.fsUrl + '/query')
        .query(params)
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (serer response not ok).'));
            }

            try {
                var resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                // todo: error.message содержит больше данных
                return callback(new Error('Arcgis server: ' + resBody.error.message));
            }

            return callback(null, resBody);
        });
};

FeatureServer.prototype.queryCount = function (options, callback) {
    options.returnCountOnly = true;
    this.query(options, function (err, result) {
        if (err) {
            return callback(err);
        }

        if (!result.hasOwnProperty('count')) {
            return callback(new Error('Query result error: no count property returned.'));
        }

        return callback(null, result.count);
    });
};

// http://si-sdiis/arcgis/sdk/rest/index.html#/Update_Features/02ss00000096000000/
FeatureServer.prototype.update = function (features, callback) {
    request
        .post(this.fsUrl + '/updateFeatures')
        .type('form')
        .send({ f: 'json' })
        .send({ features: JSON.stringify(features) })
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (server response not ok).'));
            }

            try {
                var resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                // todo: error.message содержит больше данных
                console.log('*** arcgis err, full body ***')
                console.log(resBody);
                console.log('*****************************')
                return callback(new Error('Arcgis server: ' + resBody.error.message));
            }

            if (!resBody.updateResults) {
                // todo: error.message содержит больше данных
                return callback(new Error('Update error.'));
            }

            return callback(null, resBody.updateResults);
        });
};

// http://si-sdiis/arcgis/sdk/rest/index.html#/Add_Features/02ss0000009m000000/
FeatureServer.prototype.add = function (features, callback) {
    request
        .post(this.fsUrl + '/addFeatures')
        .type('form')
        .send({ f: 'json' })
        .send({ features: JSON.stringify(features) })
        .on('error', function (err) {
            return callback(err);
        })
        .end(function (res) {
            if (!res.ok) {
                return callback(new Error('Query error (server response not ok).'));
            }

            try {
                var resBody = JSON.parse(res.text);
            } catch (e) {
                return callback(new Error('Query error (JSON parse error).'));
            }

            if (!!resBody.error) {
                // todo: error.message содержит больше данных
                console.log('*** arcgis err, full body ***')
                console.log(resBody);
                console.log('*****************************')
                return callback(new Error('Arcgis server: ' + resBody.error.message));
            }

            if (!resBody.addResults) {
                // todo: error.message содержит больше данных
                return callback(new Error('Add error.'));
            }

            return callback(null, resBody.addResults);
        });
};