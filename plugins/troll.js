var lastmicrosoft = 0;
var http = require('http');

function timestamp() {
	return Math.floor(Date.now() / 1000)
}

exports.init = function(controller) {

	controller.hears(['(@U[a-z0-9]+).* is a troll'],
	    'direct_message,direct_mention,mention,ambient', function(bot, message) {
		var user = message.match[1];
			bot.reply(message, ':troll: ahhh <' + user + '>, you troll! :troll:');

	    });

	controller.hears(['microsoft'],
	    'direct_message,direct_mention,mention,ambient', function(bot, message) {
		if(timestamp() - lastmicrosoft > 30) {
			var replies = [
				'Microsoft? Gosh I hate Microsoft :rage:',
				'Let\'s change the subject, I\'d hate to give my opinion about Microsoft in here',
				':msdos: = :kaboom:',
				'<@'+message.user+'> you get a '+Math.floor(Math.random() * 1000)+' point penalty for talking about Microsoft.',
				'<@'+message.user+'> you get a virtual :facepunch: for mentioning Microsoft.',
				'<@'+message.user+'> :facepalm:',
				'Why are PCs like air conditioners?\nThey stop working properly if you open Windows!',
				'Can someone please tell <@'+message.user+'> that Microsoft is taboo here?',
				'Enough talking about Microsoft :rage:',
				':msdos: ? :laughing:',
				'<#' + message.channel + '> is not the place to talk about Microsoft!'
			];
			var user = message.match[1];
				bot.reply(message, replies[Math.floor(Math.random()*replies.length)]);

			lastmicrosoft = timestamp();
		}
	    });


	controller.hears(['(find|give|send|need|had|have).*excuses?', 'why.*(doesn\'t|does not|isn\'t|is not|cannot|can\'t).*(work|function|stay up)','why.*bad', 'why.*(keep|always).*crashing'], 'direct_message,direct_mention,mention', function(bot, message) {
		var request = http.request({
			host: 'www.codingexcuses.com',
	    		headers: {'Accept': 'application/json'}
		}, function(res) {
			var body = '';
			res.setEncoding('utf8');
			res.on('data', function (d) {
				body += d;
			});
			res.on('end', function () {
				var j = JSON.parse(body);
				bot.reply(message, '<@'+message.user+'> '+j.excuse);
			});
			res.on('error', function (e) {
				bot.reply(message, 'Sorry <@'+message.user+'>, I couldn\'t find an excuse for you due to: '+e.message);
			});
		});
		request.end();
		console.log('Request for excuse sent!');

	});
}
