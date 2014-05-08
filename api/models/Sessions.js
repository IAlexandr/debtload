/**
 * Sessions
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

/*
 uploadFile
 fileLoaded
 prepReport
 dataStartUpdate
 dataUpdated
 resultReport
* */
module.exports = {

    attributes: {
        filePath:'string',
        state:'string',
        fsUrl: 'string',
        prepReport:'string',
        resultReport: 'string'
    }
};
