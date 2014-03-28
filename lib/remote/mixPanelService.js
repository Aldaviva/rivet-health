var _               = require('lodash');
var config          = require('../common/config');
var logger          = require('../common/logger')(module);
var mixPanelRequest = require('./apiClient').mixPanelRequest;

module.exports.fetchSummary = fetchSummary;

function fetchSummary(){
	logger.debug("Fetching summary from MixPanel.");
	return mixPanelRequest({
			path: 'events',
			qs: {
				event: JSON.stringify(["Clicked Enter Meeting Button"]),
				type: "general",
				unit: "day",
				interval: 0
			}
		})
		.then(function(body){
			return {
				events: _.mapValues(body.data.values, function(dateValues){
					return _.reduce(dateValues, function(prev, curr){
						return prev + curr;
					}, 0);
				})
			};
		});
}