var xlsx = require('node-xlsx');
var fs = require('fs');


module.exports.buildXlsxFile = function (path, data, callback) {

    var buffer = xlsx.build(data);

    fs.writeFile(path, buffer, function (err) {
        if (err){
            return callback(err, null);
        }
        return callback(null, "complete");
    });
}