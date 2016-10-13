var trivias = {}
exports.answertime = 30

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

function isNumeric(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
}
exports.newQuestion = function(callback) {
    var http = require('http')
    var Entities = require('html-entities').AllHtmlEntities;
    var entities = new Entities

    processcb = function(response) {
	var questions = response.results
	for (var i = 0, len = questions.length; i < len; i++) {
        	questions[i].question = entities.decode(questions[i].question)
	        questions[i].correct_answer = entities.decode(questions[i].correct_answer)
	        questions[i].answer = questions[i].correct_answer.toLowerCase().replace(/\s+$/g, " ")
		for(var j in questions[i].incorrect_answers) {
			questions[i].incorrect_answers[j] = entities.decode(questions[i].incorrect_answers[j])
		}
	}
        callback(questions)
    }
    http.get('http://opentdb.com/api.php?amount=5', function(res) {
        res.on('data', function(chunk) {
            processcb(JSON.parse(chunk.toString()))
	});
    });
}

exports.startGame = function(bot, channel) {

    if(!(channel in trivias)) {
	    bot.say({ 'text': 
		    ':star: A Trivia game has started! :star:\n' +
		    '> :warning: You will have *' + exports.answertime + '* seconds to answer the question. ' +
		    'Just type your answers in this channel, no need to *@rubik*!',
		    'channel': channel})
	    exports.newQuestion(function(questions) {
		var trivia = {
			'channel': channel,
			'questions': questions, 
	    		'remaining_questions': questions,
	    		'scores' : {},
	    		'current_question': null,
	    		'question_active': false
		}
		trivias[channel] = trivia;
		exports.nextQuestion(bot, trivia)
	    });
    }
    else
	    console.log('Can\'t start new game, one is already running for channel: '+channel)
}

exports.nextQuestion = function(bot, trivia, delay) {
	if (typeof delay === 'undefined') {
		delay = 0;
	}
	var question = trivia.remaining_questions.pop()
	if(question) {
		if(delay) {
			bot.say({'text':'Next question in '+delay+' seconds...', 'channel': trivia.channel})
		}
		setTimeout(function(){
			var choices = question.incorrect_answers;
			choices.push(question.correct_answer)
			bot.say({'text': 
				    ':interrobang: *'+question.question+'* :interrobang:\n' + 
				    '> *Pick an answer:* \n> ' + shuffle(choices).join('\n> '),
				'channel': trivia.channel
			})
			trivia.question_active = true;
			trivia.current_question = question

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
	    var msg = 'The answer was *' + old_question.answer + '*. Duh!';
            if(!old_question.winner_message) {
		    msg = 'Nobody guessed right! ' + msg;
	    }
	    else {
		    msg = ':medal: *Bravo <@' + old_question.winner_message.user + '>* :medal: You got the right answer!\n' + msg;
	    }

	    bot.say({'text': msg, 'channel': trivia.channel});

	    exports.nextQuestion(bot, trivia, 5)
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

	controller.hears(['trivia'],
	    'direct_message,direct_mention,mention', function(bot, message) {
		    exports.startGame(bot, message.channel)
    })

	controller.on('direct_message,direct_mention,mention,ambient', function(bot, message) {
		if(message.channel in trivias) {
			var trivia = trivias[message.channel]
			console.log(trivia)
		        console.log(message.text)
			if (trivia.question_active && message.text.toLowerCase() == trivia.current_question.answer) {
				exports.foundWinner(bot, message, trivia)
			}

		}
	});
}
