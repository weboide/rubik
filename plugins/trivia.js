var trivias = {}
var http = require('http')
var https = require('https')
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities
var api = 'https://opentdb.com/api.php';
var categories = {
	"any":"Any Category",
	"9":"General Knowledge",
	"10":"Entertainment: Books",
	"11":"Entertainment: Film",
	"12":"Entertainment: Music",
	"13":"Entertainment: Musicals &amp; Theatres",
	"14":"Entertainment: Television",
	"15":"Entertainment: Video Games",
	"16":"Entertainment: Board Games",
	"17":"Science &amp; Nature",
	"18":"Science: Computers",
	"19":"Science: Mathematics",
	"20":"Mythology",
	"21":"Sports",
	"22":"Geography",
	"23":"History",
	"24":"Politics",
	"25":"Art",
	"26":"Celebrities",
	"27":"Animals",
	"28":"Vehicles",
	"29":"Entertainment: Comics",
	"30":"Science: Gadgets",
	"31":"Entertainment: Japanese Anime &amp; Manga",
	"32":"Entertainment: Cartoon &amp; Animations"
}
exports.votesToAnsers = 3
exports.answertime = 30

function replaceAt(str, index, character) {
	    return str.substr(0, index) + character + str.substr(index+character.length);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function normalizeAnswer(s, lowercase) {
	var t = s.replace(/\s+/g, " ").trim()
	if(lowercase)
		return t.toLowerCase()
	else
		return t
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
exports.newQuestion = function(topic, callback) {

    processcb = function(response) {
	var questions = response.results
	for (var i = 0, len = questions.length; i < len; i++) {
        	questions[i].question = entities.decode(questions[i].question)
	        questions[i].correct_answer = normalizeAnswer(entities.decode(questions[i].correct_answer))
	        questions[i].answer = questions[i].correct_answer.toLowerCase()
		questions[i].hint = questions[i].answer.replace(/[a-z0-9]/gi, '_')
		for(var j in questions[i].incorrect_answers) {
			questions[i].incorrect_answers[j] = normalizeAnswer(entities.decode(questions[i].incorrect_answers[j]))
		}
	}
        callback(questions)
    }
    var url = api + '?amount=5&type=multiple';
    if(topic != 'any') {
	url += '&category='+encodeURIComponent(topic)
    }
    console.log('Calling Trivia API: '+url)
    https.get(url, function(res) {
        res.on('data', function(chunk) {
	    console.log('Received: '+chunk.toString())
            processcb(JSON.parse(chunk.toString()))
	});
    });
}

exports.startGame = function(bot, channel, topic) {
    if(!(channel in trivias)) {
	    if(!(topic in categories)) {
		topic = 'any';
	    }
	    bot.say({ 'text': 
		    ':star: A Trivia game has started in <!here|here>! Topic: *' + categories[topic] + '*:star:\n' +
		    ':warning: You will have *' + exports.answertime + '* seconds to answer each question. ' +
		    'Just type your answers in this channel, no need to *@rubik*!',
		    'channel': channel})
	    exports.newQuestion(topic, function(questions) {
		var trivia = {
			'topic': topic,
			'channel': channel,
			'questions': questions, 
	    		'remaining_questions': questions,
	    		'scores' : {},
	    		'current_question': null,
	    		'question_active': false
		}
		trivias[channel] = trivia;
		exports.nextQuestion(bot, trivia, 10)
	    });
    }
    else
	    console.log('Can\'t start new game, one is already running for channel: '+channel)
}

exports.showPossibleAnswers = function(bot, trivia, returnStr) {
	var question = trivia.current_question
	var choices = question.incorrect_answers.slice(0); // Copy object
	choices.push(question.correct_answer)
		
	var s = 'The possible answers are: \n> '+shuffle(choices).join('\n> ');

	if(returnStr)
		return s
	else
		bot.say({'text': s, 'channel': trivia.channel})
}

exports.showHint = function(bot, trivia, returnStr) {
	var question = trivia.current_question
	var hintcount = question.hintcount
	if(hintcount > 0) {
		// If less than 10 letters, then show only 1 letter per hint, if less than 20, show 2, etc.
		for(var x = 0; x < Math.ceil(question.hint.length/10); x++) {
			var pos_ = [];
			for(var i=0; i<question.hint.length;i++) {
				    if (question.hint[i] === '_') pos_.push(i);
			}
			
			if(pos_.length > 1) {
				var next_ = pos_[Math.floor(Math.random()*pos_.length)]
				question.hint = replaceAt(question.hint, next_, question.correct_answer.charAt(next_))
			}
		}
	}
	
	question.hintcount++;
	var msg = '> *Hint:* `' + question.hint + '` (' + question.correct_answer.length + ' letters)'
	if(returnStr)
		return msg
	else
		bot.say({'text': msg, 'channel': trivia.channel})
	
}

exports.nextQuestion = function(bot, trivia, delay) {
	if (typeof delay === 'undefined') {
		delay = 0;
	}
	var question = trivia.remaining_questions.pop()
	if(question) {
		// set the hint count to 0
		question.hintcount = 0
		if(delay) {
			bot.say({'text':'_Next question in *'+delay+' seconds...*_', 'channel': trivia.channel})
		}
		setTimeout(function(){
			var choices = question.incorrect_answers.slice(0); // copy object
			choices.push(question.correct_answer)
			var msg = ':interrobang: *'+question.question+'* :interrobang:\n' 
			trivia.current_question = question
			if(question.type == 'boolean')
				msg += '> Answer with *True* or *False*'
			else
				msg += exports.showHint(bot, trivia, true) + '\n> Type *hint* to get another hint, or *answers* to vote to show the possible answers ('+exports.votesToAnsers+' votes needed)!'
			bot.say({'text': msg, 'channel': trivia.channel})
			trivia.question_active = true;

			trivia.timer = setTimeout(function() {
				exports.endQuestion(bot, trivia)
			}, exports.answertime*1000)
		}, delay*1000)
	}
	else {
		exports.endGame(bot, trivia)
	}
}

exports.foundWinner = function(bot, message, trivia) {
    console.log('Found a winner: '+message.user)
    bot.api.reactions.add({
	timestamp: message.ts,
	channel: message.channel,
	name: 'white_check_mark',
    }, function(err, res) {
	if (err) {
	    bot.botkit.log('Failed to add emoji reaction :(', err);
	}
    })
    if(!(message.user in trivia.scores)) {
        trivia.scores[message.user] = 1;
    }
    else {
        trivia.scores[message.user]++;
    }
    trivia.current_question.winner_message = message;
    exports.endQuestion(bot, trivia)
}

exports.endQuestion = function(bot, trivia) {
    if(trivia.question_active) {	
	    // disable timer
	    clearTimeout(trivia.timer)	    
	    var old_question = trivia.current_question
	    trivia.question_active = false
	    trivia.current_question = null
	    var msg = '';
            if(!old_question.winner_message) {
		    msg = 'Nobody guessed right! The answer was *' + old_question.correct_answer + '*. Duh!';
	    }
	    else {
		    msg = ':medal: *Bravo <@' + old_question.winner_message.user + '>* :medal: You got the right answer: *' + old_question.correct_answer + '* :beer: ';
	    }

	    bot.say({'text': msg, 'channel': trivia.channel});

	    exports.nextQuestion(bot, trivia, 10)
    }
    else
	    console.log('Tried to end the question, but it was already over')
}
exports.endGame = function(bot, trivia) {
	var scores_msg = '*Here are the scores:*\n'
	var has_scores = false;
	for (var user in trivia.scores) {
		has_scores = true
		scores_msg += '> <@' + user + '>: *' + trivia.scores[user] + '* correct answer(s)\n'
	}
	if(!has_scores) {
		scores_msg += '> nobody? :facepalm:'
	}
	bot.say({'channel': trivia.channel, 'text': 'The Trivia game is now over :sob:. Just say *@rubik trivia* to start a new game! \n\n' + scores_msg});

	delete trivias[trivia.channel];
}

exports.init = function(controller) {

	controller.hears(['trivia categories'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		    var msg = 'Here are the trivia categories: \n'
		    for(var k in categories) {
			msg += k + ': ' + categories[k] + '\n'
		    }

		    bot.reply(message, msg);
    })
	controller.hears(['trivia ?([a-z0-9]*)'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		    exports.startGame(bot, message.channel, message.match[1])
    })

	controller.on('direct_message,direct_mention,mention,ambient', function(bot, message) {
		if(message.channel in trivias) {
			var trivia = trivias[message.channel]
			if (trivia.question_active) {
				var cleantext = normalizeAnswer(message.text, true)
				var cleananswer = normalizeAnswer(trivia.current_question.answer, true)
				console.log(trivia)
				console.log('Received: "' + message.text + '"  ==>  "' + cleantext + '"')
			       
				if(cleantext == cleananswer) {
					exports.foundWinner(bot, message, trivia)
				}
				if (cleantext == 'hint') {
					exports.showHint(bot, trivia)
				}
				if (cleantext == 'answers' || cleantext == 'answer' || cleantext == 'choices') {
					if(!trivia.current_question.answers_votes) {
						trivia.current_question.answers_votes = {}
					}
					trivia.current_question.answers_votes[message.user] = 1
					var votes = Object.keys(trivia.current_question.answers_votes).length
					if(votes < exports.votesToAnsers) {
						bot.reply(message, 'I need '+(exports.votesToAnsers-votes)+' more votes to show the possible answers!')
					}
					else {
						exports.showPossibleAnswers(bot, trivia)
					}
				}
			}
		}
	});

}
