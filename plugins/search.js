
exports.ddgsearch = function(term, cb) {
	var DDG = require('node-ddg-api').DDG;

	var ddg = new DDG('my-app-name');

	ddg.instantAnswer(term, {skip_disambig: '0'}, function(err, response) {
		var r = []
		for(var a in response.RelatedTopics) {
			if(response.RelatedTopics[a].Text) {
				r.push(response.RelatedTopics[a].Text)
			}
		}
		console.log(response.RelatedTopics)
		console.log(r)
		cb(true, r)
	});
}

exports.ddginstantsearch = function(term, cb) {
	var DDG = require('node-ddg-api').DDG;

	var ddg = new DDG('my-app-name');

	ddg.instantAnswer(term, {skip_disambig: '0'}, function(err, response) {
		console.log(response)
		cb(true, response.AbstractText, response.AbstractURL)
	});
}

exports.init = function(controller) {

	controller.hears(['search (.+)'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		var cb = function(success, abstract, url) {
			console.log(abstract)
			var txt = 'No results for "'+message.match[1]+'"';
			if(abstract) {
				txt = '> '+abstract;
			}
			bot.reply(message, txt);
		}
		exports.ddginstantsearch(message.match[1], cb);
		/*var cb = function(success, results) {
			var txt = 'No results for "'+message.match[1]+'"';
			if(results) {
				txt = 'Results for "'+message.match[1]+'":\n';
				for(var i in results) {
					txt = txt + '\n> ' + results[i]
				}
			}
			bot.reply(message, txt);
		}
		exports.ddgsearch(message.match[1], cb);*/
    	});
}
