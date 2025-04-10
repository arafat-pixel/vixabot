module.exports = {
  config: {
    name: "adboxonly",
    aliases: ["adbox", "abox", "adminbox", "adminboxonly"],
    version: "1.3",
    author: "Nur",
    countDown: 2,
    role: 2,
    description: {
      vi: "bật/tắt chế độ chỉ quản trị viên nhóm và bot admin mới có thể sử dụng bot",
      en: "turn on/off mode where only group admin and bot admin can use the bot"
    },
    category: "BOT MANAGEMENT",
    guide: {
      vi: "   {pn} [on | off]: bật/tắt chế độ chỉ quản trị viên nhóm và bot admin sử dụng bot"
         + "\n   {pn} noti [on | off]: bật/tắt thông báo khi người dùng không phải là quản trị viên nhóm hoặc bot admin sử dụng bot",
      en: "   {pn} [on | off]: turn on/off mode where only group admin and bot admin can use the bot"
         + "\n   {pn} noti [on | off]: turn on/off the notification when a non-admin uses the bot"
    }
  },

  langs: {
    vi: {
      turnedOn: "Đã bật chế độ chỉ quản trị viên nhóm và bot admin mới có thể sử dụng bot",
      turnedOff: "Đã tắt chế độ, bây giờ mọi người có thể sử dụng bot",
      turnedOnNoti: "Đã bật thông báo khi người dùng không phải là quản trị viên nhóm hoặc bot admin sử dụng bot",
      turnedOffNoti: "Đã tắt thông báo khi người dùng không phải là quản trị viên nhóm hoặc bot admin sử dụng bot",
      syntaxError: "Sai cú pháp, chỉ có thể dùng {pn} on hoặc {pn} off"
    },
    en: {
      turnedOn: "Turned on: only group admin and bot admin can now use the bot",
      turnedOff: "Turned off: everyone can now use the bot",
      turnedOnNoti: "Turned on the notification when a non-admin uses the bot",
      turnedOffNoti: "Turned off the notification when a non-admin uses the bot",
      syntaxError: "Syntax error, only use {pn} on or {pn} off"
    }
  },

  onStart: async function ({ args, message, event, threadsData, getLang }) {
    let isSetNoti = false;
    let value;
    let keySetData = "data.onlyAdminBox"; // if not setting notification config
    let indexGetVal = 0;

    if (args[0] === "noti") {
      isSetNoti = true;
      indexGetVal = 1;
      keySetData = "data.hideNotiMessageOnlyAdminBox";
    }

    if (args[indexGetVal] === "on") value = true;
    else if (args[indexGetVal] === "off") value = false;
    else return message.reply(getLang("syntaxError"));

    // When setting the noti config, we store the opposite of the value (true will hide noti)
    await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

    if (isSetNoti)
      return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
    else
      return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
  }
};