/**
 *
 *  See LICENSE file
 *
 */


var Botkit = require('botkit');
var fs = require('fs');
var nconf = require('nconf');
var os = require('os');
var process = require('process');
var util = require('util');


// ================== Part 1.) Load the config.json file and setup setting.

nconf.argv().env();
nconf.file('conf/config.json');
nconf.save(); // Create the initial file if it hasn't been.


const TAG = nconf.get('TAG');
const channelID = nconf.get('CHANNEL_ID');
const botKey = nconf.get('BOT_KEY');
const botName = nconf.get('BOT_NAME');



// ================== Part 2.) Create the Slack ChatBot API controller.

var controller = Botkit.slackbot();

// Current conversation
var theConvo = null;
var inConvo = false;
var theMessage = null;



// ================== Part 3.) Create the ChatBot

var bot = controller.spawn({ token: botKey, name: botName });

bot.startRTM(function( err, bot, payload ) {

  if(err)
  {
  	console.info(TAG + ' Could not connect to Slack');
  }

  console.info(TAG + ' Slackbot connected.');

});




// ================== Part 4.) Add the interaction logic for the ChatBot via listener/callbacks.

// Example connection Open/Close callbacks.

controller.on('rtm_close', function() {
	console.info(TAG + 'Connection to Slack.com API closed.');
  process.exit(0);
});

// When the connection to the API is open.
controller.on('rtm_open', function() {

	console.info(TAG + ' Connection to Slack.com API open.');
	
	bot.say({
		text: 'Bender\'s here baby!',
		channel: channelID
	}, _onErrorSay );

});


// Example of a Yes/No callback chat.

controller.hears(['shutdown'], 'direct_message,direct_mention,mention',function(bot, message) {

  console.info(TAG + "shutdown command received from channel.");

  bot.startConversation(message, function(err,convo) {

    convo.ask("Are you sure you want me to shutdown?",[
      {
        pattern: bot.utterances.yes,
        callback: function(response, convo) {
          convo.say("Bye!");
          convo.next();
          setTimeout(function() {
            process.exit();
          },3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default:true,
        callback: function(response, convo) {
          convo.say("Shut up baby, I know it!");
          convo.next();
        }
      }
    ])

  });

});

// System Helper Command.
controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot,message) {

  var hostname = os.hostname();
  var time = process.uptime();
  var uptime = formatUptime(time);

  bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name +'>. I have been running for ' + uptime + ' on ' + hostname + ". Timestamp: " + time, _onErrorReply);

});




controller.on('direct_message', function(bot, message) {

	  console.info(TAG + ' direct message received - ' + JSON.stringify(message));

	  bot.say({

		  text:'Direct Message:' + message.text,
		  channel: channelID
		  
	  }, _onErrorSay);	
	  
	  bot.reply(message, 'My Reply...', _onErrorReply );
	  
});

controller.on('message', function(bot, message) {
	  console.log(TAG + ' message received - ' + JSON.stringify(message));
	  bot.reply(message, 'My Reply...', _onErrorReply );
});

controller.on('message', function(bot, message) {
	  console.info(TAG + ' message received - ' + JSON.stringify(message));
});

// System messages that come from Slack.com. Not currently used.
controller.on('message_received', function(bot, message) {

 	 console.info(TAG + ' system message received - ' + JSON.stringify(message));
  
	  switch(message.type)
	  {

	  case 'hello':
		  break;

	  case 'presence_change':
		  break;

	  case 'user_typing':
		  break;

	  default:
		  console.info(TAG + ' message_received::unknown type:' + message.type);
		  break;

	  }

});















// --------------------------------------------------------------------- process

// Main process event handling
process.on('exit', function(code) {
	
	bot.say({
		text: "Goodbye!",
		channel: channelID
	}, _onErrorSay);
	
	bot.closeRTM();

});

process.on('SIGINT', function() {
	process.exit(0);
});

process.on('uncaughtException', function(err) {
	console.error(TAG + ' An uncaught error occurred!: ', err);
	assert.ifError(err);
	process.exit(0);
});


// --------------------------------------------------------------------- error callbacks

function _onErrorMessage(err, res) {
	if(err)
	{
		console.error(TAG + ' SlackAPI - unable to send message.');
	}
}

function _onErrorReply(err, res) {
	if(err)
	{
		console.error(TAG + ' SlackAPI - unable to reply.');
	}
}

function _onErrorSay(err, res) {
	if(err)
	{
		console.error(TAG + ' SlackAPI - unable to speak.');
	}
}



// --------------------------------------------------------------------- helper functions

// Helper Functions
function formatUptime(uptime) {
  
  var unit = 'second';
  
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  
  return uptime;
  
}