var _       = require('lodash');
var config  = require('../common/config');
var logger  = require('../common/logger')(module);
var request = require('pr-request2');

module.exports = {
	mixpanel: mixpanelRequest,
	newrelic: newrelicRequest
};

function mixpanelRequest(opts){
	//TODO
	throw new Error("not implemented yet");
}

function newrelicRequest(userOpts){
	var requestOpts = _.merge({
			url: config.remote.newrelic.baseUrl + userOpts.path,
			json: true,
			headers: {
				'X-Api-Key': config.remote.newrelic.apiKey
			}
			,proxy: "http://sigyn.bluejeansnet.com:9998"
			,strictSSL: false
		}, _.omit(userOpts, 'path'));

	return apiRequest(requestOpts);
}

function apiRequest(opts){
	var resPromise = request(opts);
	resPromise.then(function(res){
		logger.trace({ statusCode: res.statusCode, opts: opts }, "Remote API response");
	});
	return resPromise;
}