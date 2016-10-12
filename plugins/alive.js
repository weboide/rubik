
exports.isalive = function(url, cb) {
	var http = require('http');

	if(!url.startsWith('http://')) {
		url = 'http://' + url;
	}
	http.get(url, function(res) {
		cb(res.statusCode);
	}).on('error', function(e) {
		cb(e.message)
	});
}

exports.init = function(controller) {

	controller.hears(['is <?([^ ]+) alive'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		var url = message.match[1].match(/([^\|\>]+)/);
		exports.isalive(url[1], function(status){ 
			bot.reply(message,
			    'The URL *'+url[1].replace('<','')+'* returned: '+ status);
		});
	    });
}
