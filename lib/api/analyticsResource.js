var analyticsService = require('../service/analyticsService');
var server           = require('./server');

server.get({ path: '/cgi-bin/analytics', name: 'getAnalytics' }, function(req, res, next){
	analyticsService.fetchAnalytics()
		.then(function(summary){
			res.send(summary);
		})
		.done();
});