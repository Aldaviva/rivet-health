var _               = require('lodash');
var cache           = require('../common/cache');
var newrelicService = require('../remote/newrelicService');
var Q               = require('q');

function fetchAnalytics(){
	return Q.all([
			newrelicService.fetchSummary()
		]).spread(function(newrelicSummary){
			return {
				newrelic: newrelicSummary
			};
		});
}

module.exports.fetchAnalytics = cache.wrapPromise('analyticsService.analytics', fetchAnalytics);
