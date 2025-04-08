const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "1.8",
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

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    if (event.logMessageType == "log:subscribe") {
      const hours = getTime("HH");
      const { threadID } = event;
      const { nickNameBot } = global.GoatBot.config;
      const prefix = global.utils.getPrefix(threadID);
      
      // Ensure event.logMessageData and addedParticipants exist
      if (!event.logMessageData || !event.logMessageData.addedParticipants) {
        console.error("Welcome event error: Invalid event data structure");
        return;
      }
      
      const dataAddedParticipants = event.logMessageData.addedParticipants;

      // Bot was added to group
      if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
        if (nickNameBot)
          api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
        return message.send(getLang("welcomeMessage", prefix));
      }

      // Initialize temp storage for this thread if not exists
      if (!global.temp.welcomeEvent[threadID])
        global.temp.welcomeEvent[threadID] = {
          joinTimeout: null,
          dataAddedParticipants: []
        };

      // Add new participants to the queue
      global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
      
      // Clear previous timeout
      clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

      // Set new timeout to process welcome message
      global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
        try {
          const threadData = await threadsData.get(threadID);
          
          // Check if welcome messages are enabled for this thread
          if (threadData && threadData.settings && threadData.settings.sendWelcomeMessage === false)
            return;

          // Get data from temporary storage
          const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants || [];
          
          // Ensure thread data exists
          if (!threadData || !threadData.data) {
            console.error(`Welcome event error: Invalid thread data for ID ${threadID}`);
            return;
          }
          
          const dataBanned = threadData.data.banned_ban || [];
          const threadName = threadData.threadName || "this group";
          const userName = [];
          const mentions = [];
          let multiple = false;

          if (dataAddedParticipants.length > 1)
            multiple = true;

          // Process each added participant
          for (const user of dataAddedParticipants) {
            if (!user || !user.userFbId || !user.fullName) continue;
            if (dataBanned.some((item) => item.id == user.userFbId))
              continue;
            userName.push(user.fullName);
            mentions.push({ tag: user.fullName, id: user.userFbId });
          }

          if (userName.length == 0) return;

          // Get custom welcome message or use default
          let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data || {};
          
          // Prepare message form
          const form = {
            mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
          };

          // Replace placeholders in welcome message
          welcomeMessage = welcomeMessage
            .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
            .replace(/\{boxName\}|\{threadName\}/g, threadName)
            .replace(
              /\{multiple\}/g,
              multiple ? getLang("multiple2") : getLang("multiple1")
            )
            .replace(
              /\{session\}/g,
              hours <= 10
                ? getLang("session1")
                : hours <= 12
                  ? getLang("session2")
                  : hours <= 18
                    ? getLang("session3")
                    : hours <= 21
                      ? getLang("session4")
                      : getLang("session5")
            );

          form.body = welcomeMessage;

          // Handle welcome attachments if available
          if (threadData.data && threadData.data.welcomeAttachment && Array.isArray(threadData.data.welcomeAttachment)) {
            const files = threadData.data.welcomeAttachment;
            try {
              // Properly handle attachments with Promise.all
              const attachmentPromises = files.map(file => drive.getFile(file, "stream"));
              const attachments = await Promise.all(attachmentPromises);
              
              // Filter out any null or undefined attachments
              form.attachment = attachments.filter(attachment => attachment);
            } catch (attachmentError) {
              console.error("Welcome attachment error:", attachmentError);
              // Continue without attachments if there's an error
            }
          }

          // Send welcome message
          await message.send(form);
          
          // Clean up temporary storage
          delete global.temp.welcomeEvent[threadID];
        } catch (err) {
          console.error("Welcome event error:", err);
          // Clean up temporary storage even on error
          delete global.temp.welcomeEvent[threadID];
        }
      }, 1500);
    }
  }
};