const config = require("../../confiq.json");

module.exports = {
	config: {
		name: "adboxonly",
		aliases: ["adbox", "abox", "adminbox", "adminboxonly"],
		version: "1.3",
		author: "Nur",
		countDown: 2,
		role: 2,
		description: {
			vi: "bật/tắt chế độ chỉ quản trị của viên nhóm mới có thể sử dụng bot",
			en: "turn on/off only group 𝗮𝗱𝗺𝗶𝗻 can use bot"
		},
		category: "𝗕𝗢𝗧 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧",
		guide: {
			vi: "   {pn} [on | off]: bật/tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot"
				+ "\n   {pn} noti [on | off]: bật/tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
			en: "   {pn} [on | off]: turn on/off the mode only admin of group can use bot"
				+ "\n   {pn} noti [on | off]: turn on/off the notification when user is not admin of group use bot"
		}
	},

	langs: {
		vi: {
			turnedOn: "Đã bật chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot",
			turnedOff: "Đã tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot",
			turnedOnNoti: "Đã bật thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
			turnedOffNoti: "Đã tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
			syntaxError: "Sai cú pháp, chỉ có thể dùng {pn} on hoặc {pn} off"
		},
		en: {
			turnedOn: "Turned on now only group 𝗔𝗱𝗺𝗶𝗻 can use bot",
			turnedOff: "Turned off now everyone can use bot",
			turnedOnNoti: "Turned on the notification when user is not admin of group use bot",
			turnedOffNoti: "Turned off the notification when user is not admin of group use bot",
			syntaxError: "Syntax error, only use {pn} on or {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		const botAdmins = config.adminBot || [];

		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.reply(getLang("syntaxError"));

		// Set the config
		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		// Notify
		if (isSetNoti)
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		else
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	},

	// Middleware to check if the sender is allowed
	onChat: async function ({ event, threadsData, role }) {
		const threadData = await threadsData.get(event.threadID);
		const onlyAdmin = threadData?.data?.onlyAdminBox;
		const hideNoti = threadData?.data?.hideNotiMessageOnlyAdminBox;
		const botAdmins = require("../../confiq.json").adminBot || [];

		// If the restriction is OFF, allow all
		if (!onlyAdmin) return;

		// If sender is bot admin, allow
		if (botAdmins.includes(event.senderID)) return;

		// If sender is group admin (role 1 or 2), allow
		if (role >= 1) return;

		// Otherwise block message
		if (!hideNoti)
			return {
				reply: "Only group or bot admin can use bot while admin-only mode is enabled."
			};

		// Silent block
		return false;
	}
};