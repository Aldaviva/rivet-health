var _                      = require('lodash');
var config                 = require('../common/config');
var googleAnalyticsRequest = require('./apiClient').googleAnalyticsRequest;
var logger                 = require('../common/logger')(module);
var Moment                 = require('moment');
var Q                      = require('q');

module.exports.fetchSummary = fetchSummary;

var DATE_FORMAT = 'YYYY-MM-DD';

function fetchSummary(){
	return Q.all([fetchInmeeting(), fetchPlatformDetails()])
		.spread(function(inmeeting, platformDetails){
			return {
				inmeeting: inmeeting,
				platformDetails: platformDetails
			};
		});
}

function fetchInmeeting(){
	logger.debug("Fetching inmeeting from Google Analytics.");

	return fetch({
		metrics    : ['ga:totalEvents'].join(),
		dimensions : ["ga:eventCategory", "ga:eventAction", "ga:eventLabel"].join(),
		filters    : 'ga:eventCategory=~.*inmeeting.*'
	});
}

function fetchPlatformDetails(){
	logger.debug("Fetching platform details from Google Analytics.");

	return fetch({
		metrics    : ['ga:visitors'].join(),
		dimensions : ["ga:browser", "ga:operatingSystem"].join(),
		filters    : 'ga:eventCategory==inmeeting-platform;ga:eventAction==supported'
	});
}

function fetch(opts){
	var queryDate = new Moment().subtract('days', 1).startOf('day');
	var queryDateFormatted = queryDate.format(DATE_FORMAT);
	var defaultOpts = {
		'start-date' : queryDateFormatted,
		'end-date'   : queryDateFormatted
	};

	return googleAnalyticsRequest(_.extend(defaultOpts, opts))
		.then(function(body){
			var headerNames   = _.pluck(body.columnHeaders, 'name');
			var columnParsers = getColumnParsers(body.columnHeaders);
			var parseRow      = _.partial(parseCell, columnParsers);

			return _.map(body.rows, function(row){
				var parsedRow = _.map(row, parseRow);
				return _.zipObject(headerNames, parsedRow);
			});
		});
}

function parseCell(parsers, rawCellValue, columnIdx){
	return parsers[columnIdx](rawCellValue);
}

/*
 * There are other dataTypes like time, percent, and currency which could be added here
 */
function getColumnParsers(columnHeaders){
	return _.map(columnHeaders, function(header){
		switch(header.dataType){
			case 'INTEGER':
				return _.parseInt;
			case 'FLOAT':
				return parseFloat;
			case 'STRING':
			default:
				return _.identity;
		}
	});
}