function isNumeric(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n)
}


exports.isalive = function(url, cb) {
	var http = require('http')

	if(!url.startsWith('http')) {
		url = 'http://' + url
	}
	if(url.startsWith('https')) {
		http = require('https')
	}
	http.get(url, function(res) {
		var status = res.statusCode
		if(isNumeric(status) && (status.toString().startsWith(2) || status.toString().startsWith(3))) {
			cb(true, 'The URL '+url+' *seems to be working* :white_check_mark: Returned Status: *'+status+'*')
		}
		else {
			cb(false, 'The URL '+url+' *doesn\'t seem accessible* :sos: Returned Status: *'+status+'*')
		}
	}).on('error', function(e) {
		cb(false, 'I could not get to the URL *'+url+'*. :kaboom: Error: *'+e.message+'*')
	});
}

exports.init = function(controller, config) {

	if(config.alive) {
		for(var i in config.alive) {
			controller.hears(['is '+i+' (alive|working|online|offline|dead)'],
			    'direct_message,direct_mention,mention', function(bot, message) {
				var cb = function(success, txt) {
					bot.reply(message, txt);
				}
				for(j in config.alive[i]){
					exports.isalive(config.alive[i][j], cb);
				}
			});
		}
	}

	controller.hears(['is <?([^ ]+) (alive|working|online|offline|dead)'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		var url = message.match[1].match(/([^\|\>]+)/);
		if(url[1].startsWith('@U')) {
			bot.reply(message, 'Imagine <' + url[1] + '> being enclosed in a box with a radioactive source and a poison that will be released when the source (unpredictably) emits radiation, <' + url[1] + '> being considered (according to quantum mechanics) to be simultaneously both dead and alive until the box is opened and <' + url[1] + '> is observed.');

		}
		else {
			exports.isalive(url[1], function(success, txt){
				bot.reply(message, txt);
			})
		}
	    });
}
