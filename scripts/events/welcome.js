const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "1.9",
    author: "Nur",
    category: "events"
  },

  langs: {
    vi: {
      session1: "sáng",
      session2: "trưa",
      session3: "chiều",
      session4: "tối",
      welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
      multiple1: "bạn",
      multiple2: "các bạn",
      defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
    },
    en: {
      session1: "𝗠𝗼𝗿𝗻𝗶𝗻𝗴",
      session2: "𝗡𝗼𝗼𝗻",
      session3: "𝗔𝗳𝘁𝗲𝗿𝗻𝗼𝗼𝗻",
      session4: "𝗘𝘃𝗲𝗻𝗶𝗻𝗴",
      session5: "𝗡𝗶𝗴𝗵𝘁",
      welcomeMessage: `𝗔𝘀𝘀𝗮𝗹𝗮𝗺𝘂𝗮𝗹𝗮𝗶𝗸𝘂𝗺.🖤!\n`
        + `\n💥 𝗜'𝗺 𝗩𝗜𝗫𝗔, 𝗔 𝗕𝗼𝘁,`
        + `\n💥 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿/𝗼𝘄𝗻𝗲𝗿: https://www.facebook.com/Badhon2k23`
        + `\n💥 𝗧𝗼 𝘃𝗶𝗲𝘄 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀 𝘁𝘆𝗽𝗲 /help`,
      multiple1: "𝗧𝗼 𝗧𝗵𝗲 ",
      multiple2: "𝗧𝗼 𝗢𝘂𝗿",
      defaultWelcomeMessage: `✨ 𝗔𝘀𝘀𝗮𝗹𝗮𝗺𝘂𝗮𝗹𝗮𝗶𝗸𝘂𝗺..🖤\n`
        + `\n𝗛𝗲𝗹𝗹𝗼 {userName}`
        + `\n𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗢𝘂𝗿 𝗚𝗿𝗼𝘂𝗽`
        + `\n𝗨𝘀𝗲 /help 𝗧𝗼 𝘃𝗶𝗲𝘄 𝗰𝗼𝗺𝗺𝗮𝗻𝗱`
    }
  },

  onStart: async function({ threadsData, message, event, api, getLang }) {
    try {
      // Check if it's a subscribe event
      if (event.logMessageType !== "log:subscribe") return;
      
      const { threadID } = event;
      
      // Debug logs
      console.log(`[DEBUG] Welcome event triggered for thread ${threadID}`);
      console.log(`[DEBUG] Event data:`, JSON.stringify(event.logMessageData || {}));
      
      if (!event.logMessageData || !event.logMessageData.addedParticipants) {
        console.error("[ERROR] Invalid event data structure");
        return;
      }
      
      const dataAddedParticipants = event.logMessageData.addedParticipants;
      console.log(`[DEBUG] Added participants count: ${dataAddedParticipants.length}`);
      
      // Check if bot was added
      if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
        const { nickNameBot } = global.GoatBot.config;
        const prefix = global.utils.getPrefix(threadID);
        console.log(`[DEBUG] Bot was added to group ${threadID}, setting nickname: ${nickNameBot}`);
        
        // Set bot nickname if configured
        if (nickNameBot) {
          try {
            await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
          } catch (err) {
            console.error(`[ERROR] Failed to set bot nickname: ${err.message}`);
          }
        }
        
        // Send welcome message for bot
        try {
          await message.send(getLang("welcomeMessage", prefix));
          console.log(`[DEBUG] Bot welcome message sent to thread ${threadID}`);
          return;
        } catch (err) {
          console.error(`[ERROR] Failed to send bot welcome message: ${err.message}`);
          return;
        }
      }
      
      // Initialize welcome event storage for this thread
      if (!global.temp.welcomeEvent[threadID]) {
        global.temp.welcomeEvent[threadID] = {
          joinTimeout: null,
          dataAddedParticipants: []
        };
      }
      
      // Store new participants
      global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
      console.log(`[DEBUG] Added ${dataAddedParticipants.length} participants to welcome queue`);
      
      // Clear previous timeout to avoid duplicate messages
      if (global.temp.welcomeEvent[threadID].joinTimeout) {
        clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);
        console.log(`[DEBUG] Cleared previous welcome timeout`);
      }
      
      // Set timeout to send welcome message
      global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
        try {
          console.log(`[DEBUG] Welcome timeout triggered for thread ${threadID}`);
          
          // Get thread data from database
          let threadData = null;
          try {
            threadData = await threadsData.get(threadID);
            console.log(`[DEBUG] Thread data retrieved for ${threadID}`);
          } catch (err) {
            console.error(`[ERROR] Failed to get thread data: ${err.message}`);
            delete global.temp.welcomeEvent[threadID];
            return;
          }
          
          // Check if welcome messages are enabled
          if (threadData && threadData.settings && threadData.settings.sendWelcomeMessage === false) {
            console.log(`[DEBUG] Welcome messages disabled for thread ${threadID}`);
            delete global.temp.welcomeEvent[threadID];
            return;
          }
          
          // Get participants from temp storage
          const participants = global.temp.welcomeEvent[threadID].dataAddedParticipants || [];
          console.log(`[DEBUG] Processing ${participants.length} participants`);
          
          if (!participants.length) {
            console.log(`[DEBUG] No participants to welcome`);
            delete global.temp.welcomeEvent[threadID];
            return;
          }
          
          // Get banned users list
          const dataBanned = (threadData && threadData.data && threadData.data.banned_ban) || [];
          
          // Get thread name
          const threadName = threadData && threadData.threadName ? threadData.threadName : "this group";
          
          // Process participants for welcome message
          const userName = [];
          const mentions = [];
          const multiple = participants.length > 1;
          
          for (const user of participants) {
            // Skip if user is missing required data
            if (!user || !user.userFbId || !user.fullName) {
              console.log(`[DEBUG] Skipping invalid user data:`, user);
              continue;
            }
            
            // Skip banned users
            if (dataBanned.some(item => item.id == user.userFbId)) {
              console.log(`[DEBUG] Skipping banned user: ${user.userFbId}`);
              continue;
            }
            
            userName.push(user.fullName);
            mentions.push({ tag: user.fullName, id: user.userFbId });
          }
          
          // Exit if no valid users to welcome
          if (userName.length === 0) {
            console.log(`[DEBUG] No valid users to welcome`);
            delete global.temp.welcomeEvent[threadID];
            return;
          }
          
          // Get custom welcome message or default
          let welcomeMessage = getLang("defaultWelcomeMessage");
          if (threadData && threadData.data && threadData.data.welcomeMessage) {
            welcomeMessage = threadData.data.welcomeMessage;
          }
          
          // Get current session based on time
          const hours = getTime("HH");
          const session = hours <= 10
            ? getLang("session1")
            : hours <= 12
              ? getLang("session2")
              : hours <= 18
                ? getLang("session3")
                : hours <= 21
                  ? getLang("session4")
                  : getLang("session5");
          
          // Replace placeholders in welcome message
          welcomeMessage = welcomeMessage
            .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
            .replace(/\{boxName\}|\{threadName\}/g, threadName)
            .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
            .replace(/\{session\}/g, session);
          
          // Create message form
          const form = {
            body: welcomeMessage
          };
          
          // Add mentions if userNameTag is used
          if (welcomeMessage.match(/\{userNameTag\}/g)) {
            form.mentions = mentions;
          }
          
          // Handle welcome attachments
          if (threadData && threadData.data && 
              threadData.data.welcomeAttachment && 
              Array.isArray(threadData.data.welcomeAttachment) && 
              threadData.data.welcomeAttachment.length > 0) {
            
            try {
              console.log(`[DEBUG] Processing ${threadData.data.welcomeAttachment.length} welcome attachments`);
              
              // Get attachment promises
              const attachmentPromises = threadData.data.welcomeAttachment.map(async (fileId) => {
                try {
                  return await drive.getFile(fileId, "stream");
                } catch (err) {
                  console.error(`[ERROR] Failed to get attachment ${fileId}: ${err.message}`);
                  return null;
                }
              });
              
              // Wait for all attachments
              const attachmentResults = await Promise.all(attachmentPromises);
              
              // Filter out failed attachments
              form.attachment = attachmentResults.filter(attachment => attachment !== null);
              console.log(`[DEBUG] Loaded ${form.attachment.length} attachments successfully`);
            } catch (attachmentError) {
              console.error(`[ERROR] Failed to process attachments: ${attachmentError.message}`);
              // Continue without attachments
            }
          }
          
          // Send welcome message
          try {
            console.log(`[DEBUG] Sending welcome message to thread ${threadID}`);
            await message.send(form);
            console.log(`[DEBUG] Welcome message sent successfully`);
          } catch (sendError) {
            console.error(`[ERROR] Failed to send welcome message: ${sendError.message}`);
          }
          
          // Clean up
          delete global.temp.welcomeEvent[threadID];
          
        } catch (timeoutError) {
          console.error(`[ERROR] Welcome timeout error: ${timeoutError.message}`);
          // Clean up even on error
          delete global.temp.welcomeEvent[threadID];
        }
      }, 1500);
      
    } catch (mainError) {
      console.error(`[CRITICAL] Welcome event main error: ${mainError.message}`);
      console.error(mainError.stack);
    }
  }
};