function isNumeric(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
}


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
		if(url[1].startsWith('@U')) {
			bot.reply(message, 'Imagine <' + url[1] + '> being enclosed in a box with a radioactive source and a poison that will be released when the source (unpredictably) emits radiation, <' + url[1] + '> being considered (according to quantum mechanics) to be simultaneously both dead and alive until the box is opened and <' + url[1] + '> is observed.');

		}
		else {
			exports.isalive(url[1], function(status){ 
				console.log(status);
				if(isNumeric(status) && (status.toString().startsWith(2) || status.toString().startsWith(3))) {
					bot.reply(message,
					    'The URL *'+url[1].replace('<','')+'* seems to be working. It returned: '+ status);
				}
				else {
					bot.reply(message,
					    'The URL *'+url[1].replace('<','')+'* may not be working. It returned: '+ status);
				}
			});
		}
	    });
}
