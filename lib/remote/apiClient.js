var _          = require('lodash');
var config     = require('../common/config');
var crypto     = require('crypto');
var googleapis = require('googleapis');
var logger     = require('../common/logger')(module);
var Q          = require('q');
var request    = require('pr-request2');

module.exports = {
	mixPanelRequest: mixPanelRequest,
	newRelicRequest: newRelicRequest,
	googleAnalyticsRequest: googleAnalyticsRequest
};

var googleAuth = createGoogleAuth();
var googleAnalyticsPromise = createGoogleAnalyticsClient();

/**
 * Sends an HTTP request to MixPanel
 * @param userOpts
 * 		+ path - the path suffix to append to the baseUrl to get the full URL
 *		         example: 'events/properties/top'
 *		if any of the userOpts must be JSON-encoded (like event[]), that is the responsibility of the calling code
 * @return a promise for the parsed JSON response body
 */
function mixPanelRequest(userOpts){
	var args = _.extend({
		api_key: config.remote.mixpanel.apiKey,
		expire: +new Date() + 10*1000
	}, userOpts.qs);

	var argsHash = crypto.createHash('md5');
	var argsConcat = _(args).pairs().sortBy(0).invoke('join', '=').join('');
	argsHash.end(argsConcat + config.remote.mixpanel.apiSecret, { encoding: 'utf8'});
	args.sig = argsHash.read().toString('hex');

	var requestOpts = _.merge({
		url: config.remote.mixpanel.baseUrl + userOpts.path,
		json: true,
		qs: args
	}, _.omit(userOpts, 'path', 'qs'));

	return apiRequest(requestOpts).get('body');
}

/**
 * Sends an HTTP request to New Relic
 * @param userOpts
 *		+ path - the path suffix to append to the baseUrl to get the full URL
 *		         example: 'applications/12345.json'
 *		+ all other userOpts are passed to request()
 *		         example: header, form, json, jar
 *		         see mikeal/request documentation for all request opts
 * @return a promise for the parsed JSON response body
 */
function newRelicRequest(userOpts){
	var requestOpts = _.merge({
		url: config.remote.newrelic.baseUrl + userOpts.path,
		json: true,
		headers: {
			'X-Api-Key': config.remote.newrelic.apiKey
		}
		// ,proxy: "http://sigyn.bluejeansnet.com:9998"
		// ,strictSSL: false
	}, _.omit(userOpts, 'path'));

	return apiRequest(requestOpts).get('body');
}

/**
 * Sends an HTTP request to Google Analytics Core Reporting
 * @param userOpts all the same options as analytics.data.ga.get
 *		You can omit 'ids' because it's filled in automatically from config.json
 * @see https://developers.google.com/apis-explorer/#p/analytics/v3/analytics.data.ga.get
 * 
 * @return a promise for the parsed JSON response body
 */
function googleAnalyticsRequest(userOpts){
	var deferred = Q.defer();
	var opts = _.extend({ ids: 'ga:'+config.remote.googleanalytics.viewId }, userOpts);

	googleAnalyticsPromise.then(function(analytics){
		analytics.data.ga
			.get(opts)
			.withAuthClient(googleAuth)
			.execute(deferred.makeNodeResolver());
	});

	deferred.promise.then(function(bodyAndResponse){
		var statusCode = bodyAndResponse[1].statusCode;
		logger.trace({ statusCode: statusCode, opts: opts }, "Remote API response");
	});

	return deferred.promise.get(0);
}

function apiRequest(opts){
	var resPromise = request(opts);
	resPromise.then(function(res){
		logger.trace({ statusCode: res.statusCode, opts: opts }, "Remote API response");
	});
	return resPromise;
}

function createGoogleAuth(){
	var auth = new googleapis.OAuth2Client(
		config.remote.googleanalytics.clientId,
		config.remote.googleanalytics.clientSecret,
		'urn:ietf:wg:oauth:2.0:oob');

	auth.setCredentials({ refresh_token: config.remote.googleanalytics.refreshToken });

	auth.refreshAccessToken(function(err, credentials){
		if(err){
			logger.error(err, "Failed to refresh google analytics access token.");
		} else {
			logger.trace("Refreshed Google Analytics access token.");
		}
	});

	return auth;
}

function createGoogleAnalyticsClient(){
	var deferred = Q.defer();

	googleapis.discover('analytics', 'v3')
		.execute(deferred.makeNodeResolver());

	return deferred.promise.get('analytics');
}

/* Used to generate a refresh token once when first setting up this application.
 * Usage:
 *
 * 		$ node
 * 		> var apiClient = require('./lib/remote/apiClient');
 * 		> apiClient._generateGoogleAnalyticsRefreshToken();
 * 		Go to https://accounts.google.com/o/oath2/auth?...
 *
 * Open that URL in your browser, log in to Google, and allow access. You will get an authCode.
 *
 * 		> apiClient._generateGoogleAnalyticsRefreshToken("<authCode>");
 *
 * The tokens and metadata will be output. Copy the refresh_token to config.json under remote.googleanalytics.refreshToken
 */
module.exports._generateGoogleAnalyticsRefreshToken = function(authCode){
	if(!authCode){
		var url = googleAuth.generateAuthUrl({
			access_type: 'offline', //idk
			scope: 'https://www.googleapis.com/auth/analytics.readonly'
		});
		logger.info("Go to "+url);
	} else {
		logger.debug("getting access+request tokens from auth code "+authCode);
		googleAuth.getToken(authCode, function(err, tokens){
			if(err) { throw err; }
			logger.info({ tokens: tokens });
		});
	}
};