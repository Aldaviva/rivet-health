var _               = require('lodash');
var config          = require('../common/config');
var logger          = require('../common/logger')(module);
var newRelicRequest = require('./apiClient').newRelicRequest;

module.exports.fetchSummary = fetchSummary;

function fetchSummary(){
	logger.debug("Fetching summary from New Relic.");
	return newRelicRequest({
			path: 'applications/'+config.remote.newrelic.applicationId+'.json',
			method: 'get'
		})
		.then(function(body){
			return _.pick(body.application, ['health_status', 'application_summary', 'end_user_summary']);
		});
}