const config = require("../../confiq.json");

module.exports = {
	config: {
		name: "adboxonly",
		aliases: ["", "", ""],
		version: "1.0",
		author: "Nur",
		countDown: 2,
		role: 2,
		description: {
			vi: "Bật/tắt chế độ chỉ quản trị viên nhóm và bot mới có thể sử dụng bot",
			en: "Toggle mode so that only group admins & bot admins can use the bot"
		},
		category: "BOT MANAGEMENT",
		guide: {
			vi: "   {pn} [on | off] : bật/tắt chế độ chỉ cho quản trị viên",
			en: "   {pn} [on | off] : toggle admin-only mode"
		}
	},

	langs: {
		vi: {
			turnedOn: "Đã bật chế độ chỉ quản trị viên (nhóm & bot admin) có thể sử dụng bot",
			turnedOff: "Đã tắt chế độ quản trị viên, mọi người có thể sử dụng bot",
			syntaxError: "Sai cú pháp, chỉ có thể dùng {pn} on hoặc {pn} off"
		},
		en: {
			turnedOn: "Admin-only mode is enabled: only group & bot admins can use the bot",
			turnedOff: "Admin-only mode is disabled: everyone can use the bot",
			syntaxError: "Syntax error, only use {pn} on or {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let value;
		// Use a key to store the setting in thread data
		const keySetData = "data.adminOnlyMode";

		// Validate command argument
		if (args[0] === "on") {
			value = true;
		} else if (args[0] === "off") {
			value = false;
		} else {
			return message.reply(getLang("syntaxError"));
		}

		// Store the new setting for the current thread
		await threadsData.set(event.threadID, value, keySetData);

		// Reply with the appropriate message
		return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	},

	// Middleware to check if the sender is allowed to use the bot when admin-only mode is on
	onChat: async function ({ event, threadsData, role }) {
		// Retrieve the stored data for this thread
		const threadData = await threadsData.get(event.threadID);
		const adminOnlyMode = threadData?.data?.adminOnlyMode;

		// If admin-only mode is not enabled, allow all messages.
		if (!adminOnlyMode) return;

		// Get the list of bot admin IDs from the configuration.
		const botAdmins = config.adminBot || [];

		// Allow bot admins
		if (botAdmins.includes(event.senderID)) return;

		// Allow group admins (role 1 or 2)
		if (role >= 1) return;

		// Block the message and reply with a warning.
		return {
			reply: "Only group or bot admins are allowed to use the bot while admin-only mode is enabled."
		};
	}
};