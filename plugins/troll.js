var lastmicrosoft = 0;

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

}
