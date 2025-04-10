module.exports = {
	config: {
		name: "adboxonly",
		aliases: ["adminbox", "adminboxonly", "onlyadminbox", "onlyadbox"],
		version: "1.0",
		author: "Nur",
		countDown: 5,
		role: 1,
		description: {
			en: "Toggle between only admins can use bot or everyone can use bot"
		},
		category: "box chat",
		guide: {
			en: "   {pn} [on | off]: toggle mode where only admins (group admins & bot admins) can use bot"
		}
	},

	langs: {
		en: {
			turnedOn: "Turned on admin-only mode. Now only group admins and bot admins can use the bot",
			turnedOff: "Turned off admin-only mode. Now everyone can use the bot",
			syntaxError: "Syntax error, only use {pn} on or {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let value;

		if (args[0] == "on")
			value = true;
		else if (args[0] == "off")
			value = false;
		else
			return message.reply(getLang("syntaxError"));

		await threadsData.set(event.threadID, value, "data.adboxOnly");
		return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	},

	onEvent: async function ({ event, threadsData, api, globalGoat }) {
		const adboxOnly = await threadsData.get(event.threadID, "data.adboxOnly", false);
		
		if (adboxOnly && event.type === "message") {
			// Get bot admins from config
			const botAdmins = globalGoat.config.adminBot || [];
			
			// Skip checking if sender is a bot admin
			if (botAdmins.includes(event.senderID)) {
				return;
			}
			
			// Check if sender is a group admin
			const threadInfo = await api.getThreadInfo(event.threadID);
			const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
			
			if (!adminIDs.includes(event.senderID)) {
				// If not a group admin or bot admin, ignore command
				const hideNoti = await threadsData.get(event.threadID, "data.hideNotiMessageAdboxOnly", false);
				if (!hideNoti) {
					return api.sendMessage("Only group admins and bot admins can use the bot in this group", event.threadID, event.messageID);
				}
			}
		}
	}
};