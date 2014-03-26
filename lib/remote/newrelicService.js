var _               = require('lodash');
var config          = require('../common/config');
var logger          = require('../common/logger')(module);
var newrelicRequest = require('./apiClient').newrelic;

module.exports.fetchSummary = fetchSummary;

function fetchSummary(){
	logger.debug("Fetching summary from New Relic.");
	return newrelicRequest({
			path: 'applications/'+config.remote.newrelic.applicationId+'.json',
			method: 'get'
		})
		.then(function(res){
			return _.pick(res.body.application, ['health_status', 'application_summary', 'end_user_summary']);
		});
}