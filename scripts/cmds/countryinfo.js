/cmd install country.js const axios = require('axios');

module.exports = {
  config: {
    name: "countryinfo",
    aliases: ["country"],
    version: "1.2",
    category: "info",
    author: "Nur "
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(' ');

    if (!query) {
      return api.sendMessage("𝗪𝗿𝗼𝗻𝗴 𝗰𝗼𝗺𝗺𝗮𝗻𝗱\n𝘂𝘀𝗲\n /country name of country\n𝐨𝐫\n/countryinfo name of country", event.threadID, event.messageID);
    }

    try {
      // React with search emoji instead of sending a message
      api.setMessageReaction("🔍", event.messageID, (err) => {}, true);
      
      const response = await axios.get(`https://restcountries.com/v2/name/${encodeURIComponent(query)}`);

      if (response.data && response.data.length > 0) {
        const country = response.data[0];
        
        // Format population with commas
        const formattedPopulation = country.population.toLocaleString();
        
        // Get languages
        const languages = country.languages ? country.languages.map(lang => lang.name).join(', ') : 'Not available';
        
        // Get currency information
        let currencyInfo = 'Not available';
        if (country.currencies && country.currencies.length > 0) {
          currencyInfo = country.currencies.map(c => `${c.name} (${c.symbol || 'No symbol'})`)
            .join(', ');
        }
        
        // Get region and subregion
        const region = country.region || 'Not available';
        const subregion = country.subregion || 'Not available';
        
        // Create detailed message
        let message = `🌎 𝗖𝗢𝗨𝗡𝗧𝗥𝗬 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 🌎\n\n`;
        message += `𝗡𝗮𝗺𝗲: ${country.name}\n`;
        message += `𝗖𝗮𝗽𝗶𝘁𝗮𝗹: ${country.capital || 'Not available'}\n`;
        message += `𝗣𝗼𝗽𝘂𝗹𝗮𝘁𝗶𝗼𝗻: ${formattedPopulation}\n`;
        message += `𝗥𝗲𝗴𝗶𝗼𝗻: ${region}\n`;
        message += `𝗦𝘂𝗯𝗿𝗲𝗴𝗶𝗼𝗻: ${subregion}\n`;
        message += `𝗟𝗮𝗻𝗴𝘂𝗮𝗴𝗲𝘀: ${languages}\n`;
        message += `𝗖𝘂𝗿𝗿𝗲𝗻𝗰𝘆: ${currencyInfo}\n`;
        message += `𝗧𝗶𝗺𝗲𝘇𝗼𝗻𝗲𝘀: ${country.timezones ? country.timezones.join(', ') : 'Not available'}\n`;
        
        // Add current time of country based on timezone
        if (country.timezones && country.timezones.length > 0) {
          try {
            const timezone = country.timezones[0];
            const options = { 
              timeZone: timezone, 
              hour12: false,
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            };
            const currentTime = new Date().toLocaleString('en-US', options);
            message += `𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗧𝗶𝗺𝗲: ${currentTime}\n`;
          } catch (timeError) {
            message += `𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗧𝗶𝗺𝗲: Unable to calculate\n`;
          }
        }
        
        if (country.flag) {
          message += `𝗙𝗹𝗮𝗴: ${country.flag}\n`;
        }

        await api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage("❌ Country not found! Please check the spelling and try again.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("Country info error:", error);
      
      if (error.response && error.response.status === 404) {
        api.sendMessage(`❌ Country "${query}" not found. Please check the spelling and try again.`, event.threadID, event.messageID);
      } else {
        api.sendMessage("❌ An error occurred while fetching country information. Please try again later.", event.threadID, event.messageID);
      }
    }
  }
};