var _                      = require('lodash');
var cache                  = require('../common/cache');
var googleAnalyticsService = require('../remote/googleAnalyticsService');
var mixPanelService        = require('../remote/mixPanelService');
var newRelicService        = require('../remote/newRelicService');
var Q                      = require('q');

function fetchAnalytics(){
	return Q.all([
			newRelicService.fetchSummary(),
			mixPanelService.fetchSummary(),
			googleAnalyticsService.fetchSummary()
		]).spread(function(newRelicSummary, mixPanelSummary, googleAnalyticsSummary){
			return {
				newRelic: newRelicSummary,
				mixPanel: mixPanelSummary,
				googleAnalytics: googleAnalyticsSummary
			};
		});
}

module.exports.fetchAnalytics = cache.wrapPromise('analyticsService.analytics', fetchAnalytics);
