function updateAndRender(){
	update().then(render);
}

function update(){
	return $.getJSON('cgi-bin/analytics');
}

function render(data){
	renderResponseTime(data.newRelic.end_user_summary.response_time);
	renderThroughput(data.newRelic.end_user_summary.throughput);

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
	$('.responseTime value').text(rawData+' seconds');
}

function renderThroughput(rawData){
	$('.throughput value').text(rawData);
}

function renderSkinnyAnons(anonCount, notAnonCount){
	$('.skinnyLoggedIn value').text(Math.round(100*notAnonCount/(anonCount+notAnonCount))+'%');
}

function renderSkinnyModerators(modCount, notModCount){
	$('.skinnyModerators value').text(Math.round(100*modCount/(modCount+notModCount))+'%');
}

function renderSkinnyBrowsers(platformDetails){
	$('.skinnyBrowser value').text(getVisitorDistribution(platformDetails, 'ga:browser'));
}

function renderSkinnyOS(platformDetails){
	$('.skinnyOS value').text(getVisitorDistribution(platformDetails, 'ga:operatingSystem'));
}

function getVisitorDistribution(visitors, groupKey){
	var totalVisitors = _sumVisitors(visitors);

	return _(visitors)
		.groupBy(groupKey)
		.mapValues(_sumVisitors)
		.pick(function(count, name){
			return (count/totalVisitors) >= 0.01;
		})
		.pairs()
		.sortBy(1)
		.reverse()
		.map(function(pair){
			var name = pair[0];
			var count = pair[1];
			return name.charAt(0) + ' ' + Math.round(100*count/totalVisitors) + '%';
		})
		.join(', ');
}

function _sumVisitors(items){
	return _.reduce(items, function(prev, curr){
		return prev + curr['ga:visitors'];
	}, 0);
}