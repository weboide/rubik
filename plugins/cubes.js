
exports.generateScrambles = function() {
        var Scrambo = require('scrambo');
        var scramble2 = new Scrambo().type('222').length(10).get();
        var scramble3 = new Scrambo().get();
        return '2x2: ' + scramble2 + '.\n' +
        '3x3: ' + scramble3 + '.';
}

exports.setupcron = function(bot, channelid) {
    var CronJob = require('cron').CronJob;
    new CronJob('0 0 8 * * 1-5', function() {
        var msg = ':rubix: Here are the daily scrambles:\n' + exports.generateScrambles() + '\nGood luck! :troll:';
        bot.say({'channel': channelid, 'text': msg});
        console.log('Sent daily scrambles!');
    }, null, true, 'America/Detroit');
}


exports.init = function(controller) {

	controller.hears(['scramble'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		bot.reply(message,
		    ':rubix: Here are some scrambles:\n'+ exports.generateScrambles() +'\n Good luck :)');
	    });

	controller.on('rtm_open', function(bot) {
	    if(!exports.cronsetup) {
		    exports.cronsetup = true;
		    exports.setupcron(bot, 'G1X3LGTNF');
	    }
	});
}
