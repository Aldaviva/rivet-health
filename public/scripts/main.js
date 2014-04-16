var THRESHOLDS_OF_CONCERN = {
	'appResponseTime' : { yellow: 250,   red: 500 },
	'throughput'      : { yellow: 30,    red: 5 },
	'errorRate'       : { yellow: 0.005, red: 0.01 },
	'apdex'           : { yellow: 0.95,  red: 0.9 }
};


function updateAndRender(){
	update().then(render);
}

function update(){
	return $.getJSON('cgi-bin/analytics');
}

function render(data){
	renderResponseTime(data.newRelic.application_summary.response_time);
	renderThroughput(data.newRelic.application_summary.throughput);
	renderErrorRate(data.newRelic.application_summary.error_rate);
	renderApdex(data.newRelic.application_summary.apdex_score);

	renderJoinClicks(data.mixPanel.events['Clicked Enter Meeting Button']);

	var anonCount = _.find(data.googleAnalytics.inmeeting, {
		'ga:eventCategory': 'inmeeting-platform',
		'ga:eventAction': 'authenticated',
		'ga:eventLabel': 'false'
	})['ga:totalEvents'];
	var notAnonCount = _.find(data.googleAnalytics.inmeeting, {
		'ga:eventCategory': 'inmeeting-platform',
		'ga:eventAction': 'authenticated',
		'ga:eventLabel': 'true'
	})['ga:totalEvents'];
	renderSkinnyAnons(anonCount, notAnonCount);

	var modCount = _.find(data.googleAnalytics.inmeeting, {
		'ga:eventCategory': 'inmeeting-platform',
		'ga:eventAction': 'isModerator',
		'ga:eventLabel': 'true'
	})['ga:totalEvents'];
	var notModCount = _.find(data.googleAnalytics.inmeeting, {
		'ga:eventCategory': 'inmeeting-platform',
		'ga:eventAction': 'isModerator',
		'ga:eventLabel': 'false'
	})['ga:totalEvents'];
	renderSkinnyModerators(modCount, notModCount);

	renderSkinnyBrowsers(data.googleAnalytics.platformDetails);
	renderSkinnyOS(data.googleAnalytics.platformDetails);
}

function renderResponseTime(rawData){
	var el = $('.appResponseTime .value');
	el.text(rawData);
	_applyConcernStyles(el, 'appResponseTime', rawData);
}

function renderThroughput(rawData){
	var el = $('.throughput .value');
	el.text(rawData);
	_applyConcernStyles(el, 'throughput', rawData);
}

function renderErrorRate(rawData){
	var el = $('.errorRate .value');
	el.text((rawData*100).toFixed(1)+'%');
	_applyConcernStyles(el, 'errorRate', rawData);
}

function renderApdex(rawData){
	var el = $('.apdex .value');
	el.text(100*rawData.toFixed(2)+'%');
	_applyConcernStyles(el, 'apdex', rawData);
}

function renderJoinClicks(count){
	$('.enterButtonClicked .value').text(count);
}

function renderSkinnyAnons(anonCount, notAnonCount){
	_renderGraph($('.loggedInShare .value'), [
		{ key: 'Logged-in', value: notAnonCount },
		{ key: 'Guests', value: anonCount }
	]);
}

function renderSkinnyModerators(modCount, notModCount){
	_renderGraph($('.moderatorShare .value'), [
		{ key: 'Moderators', value: modCount },
		{ key: 'Non-moderators', value: notModCount }
	]);
}

function renderSkinnyBrowsers(platformDetails){
	_renderGraph($('.browserShare .value'), _summarizePlatformDetails(platformDetails, 'ga:browser'));
}

function renderSkinnyOS(platformDetails){
	_renderGraph($('.osShare .value'), _summarizePlatformDetails(platformDetails, 'ga:operatingSystem'));
}

function _renderGraph(el, data){
	console.log('renderGraph', data);

	$(el).empty();
	var legendEl = $('<legend>');
	var total = _(data)
		.pluck('value')
		.reduce(function(prev, curr){
			return prev + curr;
		});
	_.forEach(data, function(datum){
		var fractionOfTotal = datum.value / total;
		$(el).append($('<div>').css('width', fractionOfTotal*100+'%'));
		legendEl.append($('<div>', { text: datum.key }));
	});
	$(el).append(legendEl);
}

function _summarizePlatformDetails(platformDetails, groupKey){
	var totalVisitors = _sumVisitors(platformDetails);
	return _(platformDetails)
		.groupBy(groupKey)
		.mapValues(_sumVisitors)
		.pick(function(count, name){
			return (count/totalVisitors) >= 0.01;
		})
		.map(function(value, key){
			return { key: key, value: value };
		})
		.sortBy('value')
		.reverse()
		.value();
}

function _sumVisitors(items){
	return _.reduce(items, function(prev, curr){
		return prev + curr['ga:visitors'];
	}, 0);
}

function _applyConcernStyles(el, id, value){
	$(el).removeClass('yellow red');
	var thresholds = THRESHOLDS_OF_CONCERN[id];
	var isBiggerBetter = (thresholds.red < thresholds.yellow);
	var classToAdd = null;
	if(isBiggerBetter){
		if(value <= thresholds.red){
			classToAdd = 'red';
		} else if(value <= thresholds.yellow){
			classToAdd = 'yellow';
		} 
	} else {
		if(value >= thresholds.red){
			classToAdd = 'red';
		} else if(value >= thresholds.yellow){
			classToAdd = 'yellow';
		}
	}

	$(el).addClass(classToAdd);
}