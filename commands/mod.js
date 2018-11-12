/*
 * Invocation Syntax: !announcement <id> <announcement>
 * Action: Makes announcement to the specified channel
 * @param {DiscordJS Message} message - discord js message
 * @param {string[]} args - args from command (pre split)
 */
exports.announcement = function(message, args){
  var channelIdentifier = args.shift();
  var channel;
  //Check if we are given a channelName or a channelID
  logger.info(`Attempting to locate channel ${channelIdentifier}`);
  if(channelIdentifier.match(/^[0-9]+$/) != null){
    channel = global.util.getChannel({id: channelIdentifier, type: 'text'});
  }
  else if(channelIdentifier.match(/^<#[0-9]+>$/) != null){
    var id_rx = /^<#([0-9]+)>$/g;
    var id = id_rx.exec(channelIdentifier)[1];
    channel = global.util.getChannel({id: id, type: 'text'});
  }
  else{
    channel = undefined;
  }
  
  //Channel not found
  if(channel===undefined){
    message.channel.send(`The channel  \`${channelIdentifier}\' wasn't found... please check your spelling!`)
  }
  //Only one channel found
  else if(channel.length===undefined){
    logger.info(`Sending an announcement to ${channel} (${channel.name}) on behalf of ${message.author.id} (${message.author.username})`);
    //Images
    var delay = 0;
    //Broken with cleanMode #BUG #TODO
    for (var [snowflake, attachment] of message.attachments) {
      delay++;
      channel.send(" ", {files: [attachment.url]}).catch(logger.error);
    }
    //Message
    if(args[0]){
      setTimeout(function(){
        channel.send(args.join(" ")).catch(logger.error);
      }, 1000*delay);
    }
  }
  //Multiple channels found
  else{
    channelOptions = []
    channel.forEach(function(c) {
      channelOptions.push(JSON.stringify({id: c.id, server: c.guild.name}));
    });
    channelOptions = util.listToString(channelOptions);
    message.channel.send(`The channel \`${channelIdentifier}\` matches multiple channels!\n
      Please try again with a channelID: \n ${channelOptions}`)
  }
  return;
}

/*
 * Invocation Syntax: !warn <id> <reason>
 * Action: Warn a user, logs reason and id, and also PMs the user
 * @param {DiscordJS Message} message - discord js message
 * @param {string[]} args - args from command (pre split)
 */
exports.warn = function(message, args){
  if (!args[0]) {
    message.channel.send(`You need arguments to send warnings!`);
    return;
  }
  var userIdentifier = args.shift();
  var id_rx = /^<@!?([0-9]+)>$/g;
  var id = id_rx.exec(userIdentifier);
  id = id ? id[1] : userIdentifier;
  var user = global.util.getUser({id: id});
  logger.info(`Locating user ${id}`);
  
  //Channel not found
  if(user===undefined){
    message.channel.send(`User not found!`)
  }
  else{
    var reason;
    if(args[0]){
      reason = args.join(" ")
      logger.info(`Giving a warning to ${user} on behalf of ${message.author}. Reason: ${reason}`);
      user.send(`You have recieved a warning from ${message.author} ` +
       `on the Tespa Carleton Discord! This does not mean anything will happen right now, ` +
       `but please be wary of what you do in the future as multiple warnings will ` +
       `result in punishment! Reason: ${reason} `);
       global.database.warnUser(message.id, user.id, reason.substring(0,255));
    }
    else{
      message.channel.send(`You must specify a reason for warnings!`);
    }
   
  }
}

/*
 * Invocation Syntax: !warnings <id>
 * Action: Lists all warnings a user has been given
 * @param {DiscordJS Message} message - discord js message
 * @param {string[]} args - args from command (pre split)
 */
exports.warnings = function(message, args){
  if (!args[0]) {
    message.channel.send(`You need arguments to get warnings!`);
    return;
  }
  var userIdentifier = args.shift();
  var id_rx = /^<@!?([0-9]+)>$/g;
  var id = id_rx.exec(userIdentifier);
  id = id ? id[1] : userIdentifier;
  var user = global.util.getUser({id: id});
  logger.info(`Locating user ${id}`);
  
  //Channel not found
  if(user===undefined){
    message.channel.send(`User not found!`)
  }
  else{
    global.database.getWarnings(id).then(
      function(warnings){
        console.log(warnings);
        if(warnings.length==0){
          message.channel.send(`User has no warnings!`)
        }
        else{
          output = `Warnings for <@!${warnings[0].userid}>:\n`;
          for(var i=0; i<warnings.length; i++){
            output+=`\t ${i+1}. (${warnings[i].id}) ${warnings[i].reason}\n`
          }
          message.channel.send(output);
        }
      }
    ).catch(
      function(reason){
          logger.error(reason);
          message.channel.send(`Retrieving warnings failed, see system logs.`);
      }
    );
    
  }
}

/*
 * Invocation Syntax: !mod
 * Action: List mod commands
 * @param {DiscordJS Message} message - discord js message
 * @param {string[]} args - args from command (pre split)
 */
exports.mod = function(message, args){
  message.channel.send(`Here are some things I can help you with as an moderator: \n${global.util.listToString(Object.keys(exports))}`);
  return;
}