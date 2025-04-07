const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "pend", "pe"],
    version: "1.6.9",
    author: "𝗡𝘂𝗿",
    countDown: 5,
    role: 2,
    shortDescription: "handle pending requests",
    longDescription: "Approve orreject pending users or group requests",
    category: "admin",
  },

  onReply: async function ({ message, api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    if (body.trim().toLowerCase() === "c") {
      try {
        await api.unsendMessage(messageID);
        return api.sendMessage(
          ` Operation has been canceled!`,
          threadID
        );
      } catch {
        return;
      }
    }

    const indexes = body.split(/\s+/).map(Number);

    if (isNaN(indexes[0])) {
      return api.sendMessage(`⚠ Invalid input! Please try again.`, threadID);
    }

    let count = 0;

    for (const idx of indexes) {
 
      if (idx <= 0 || idx > pending.length) continue;

      const group = pending[idx - 1];

      try {
        await api.sendMessage(
          `✅ 𝐺𝑟𝑜𝑢𝑝 𝐻𝑎𝑠 𝐵𝑒𝑒𝑛 𝑆𝑢𝑐𝑐𝑒𝑠𝑠𝑓𝑢𝑙𝑙𝑦 𝐴𝑝𝑝𝑟𝑜𝑣𝑒𝑑 𝐵𝑦 ♡︎ 𝗛𝗔𝗦𝗔𝗡 ♡︎\n\n📜 𝑇𝑦𝑝𝑒 ${global.GoatBot.config.prefix}𝐻𝑒𝑙𝑝 𝑇𝑜 𝑆𝑒𝑒 𝐴𝑙𝑙 𝐶𝑜𝑚𝑚𝑎𝑛𝑑𝑠!`,
          group.threadID
        );

        await api.changeNickname(
          `${global.GoatBot.config.nickNameBot || "🦋𝙔𝙤𝙤 𝙔𝙤𝙤 𝙃𝙖𝙨𝙪✨"}`,
          group.threadID,
          api.getCurrentUserID()
        );

        count++;
      } catch {
  
        count++;
      }
    }

    for (const idx of indexes.sort((a, b) => b - a)) {
      if (idx > 0 && idx <= pending.length) {
        pending.splice(idx - 1, 1);
      }
    }

    return api.sendMessage(
      `✅ | [ Successfully ] 🎉 Approved ${count} Groups✨!`,
      threadID
    );
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;
    const adminBot = global.GoatBot.config.adminBot;

    if (!adminBot.includes(event.senderID)) {
      return api.sendMessage(
        `⚠ you have no permission to use this command!`,
        threadID
      );
    }

    const type = args[0]?.toLowerCase();
    if (!type) {
      return api.sendMessage(
        `Usage: pending [user/thread/all]`,
        threadID
      );
    }

    let msg = "",
      index = 1;
    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter((t) => !t.isGroup);
      if (type.startsWith("t")) filteredList = list.filter((t) => t.isGroup);
      if (type === "all") filteredList = list;

      for (const single of filteredList) {
        const name =
          single.name || (await usersData.getName(single.threadID)) || "Unknown";

        msg += `[ ${index} ]  ${name}\n`;
        index++;
      }

      msg += `🦋 Reply with the correct group number to approve!\n`;
      msg += `✨ Reply with "c" to Cancel.\n`;

      return api.sendMessage(
        `✨ | [ Pending Groups & Users ${type
          .charAt(0)
          .toUpperCase()}${type.slice(1)} List ✨ ]\n\n${msg}`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            pending: filteredList,
          });
        },
        messageID
      );
    } catch (error) {
      return api.sendMessage(
        `⚠ Failed to retrieve pending list. Please try again later.`,
        threadID
      );
    }
  },
};
