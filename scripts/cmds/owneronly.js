const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
  config: {
    name: "owneronly",
    aliases: ["ownly", "onlyowner"],
    version: "1.0",
    author: "YourName", // Replace with your actual name if desired
    countDown: 5,
    role: 3, // You can adjust the role level as needed
    description: {
      
      en: "Turn on/off the mode only owner can use bot"
    },
    category: "𝗕𝗢𝗧 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧",
    guide: {
   
      en: "   {pn} [on | off]: turn on/off the mode only owner can use bot"
    }
  },

  langs: {
    
    en: {
      turnedOn: "Turned on the mode only owner can use bot",
      turnedOff: "Turned off the mode only owner can use bot"
    }
  },

  onStart: function ({ args, message, getLang }) {
    let value;
    if (args[0] === "on") value = true;
    else if (args[0] === "off") value = false;
    else return message.SyntaxError();

    // Toggle the owner-only mode in the configuration.
    config.ownerOnly.enable = value;
    message.reply(getLang(value ? "turnedOn" : "turnedOff"));

    // Save the updated configuration
    fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
  }
};