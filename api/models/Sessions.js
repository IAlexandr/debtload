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
 updateReport
 * */
module.exports = {

    attributes: {
        sourceFilePath: 'string',
        state: 'string',
        fsUrl: 'string',
        prepReport: 'string',
        updateReport: 'string',
        updateReportXlsFilePath: 'string',
        createdDate: 'string'
    }
};
