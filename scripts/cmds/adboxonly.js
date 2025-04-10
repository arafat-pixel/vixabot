module.exports = {
	config: {
		name: "onlyadminbox",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
		version: "1.5",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			en: "Turn on/off only admin of box can use bot"
		},
		category: "box chat",
		guide: {
			en: "   {pn} [on | off]: turn on/off the mode only admin of group can use bot"
				+ "\n   {pn} noti [on | off]: turn on/off the notification when user is not admin of group use bot"
		}
	},

	langs: {
		en: {
			turnedOn: "Turned on the mode, only group admins and bot owner can use bot.",
			turnedOff: "Turned off the mode, now everyone can use the bot.",
			turnedOnNoti: "Turned on the notification for non-admins using the bot.",
			turnedOffNoti: "Turned off the notification for non-admins using the bot.",
			syntaxError: "Syntax error, only use {pn} on or {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		const botOwnerID = global.GoatBot.config.owner; // use config for dynamic owner ID

		if (args[0] === "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		if (args[indexGetVal] === "on") {
			value = true;
		} else if (args[indexGetVal] === "off") {
			value = false;
		} else {
			return message.reply(getLang("syntaxError"));
		}

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		if (isSetNoti)
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		else
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	},

	onEvent: async function ({ event, threadsData, api }) {
		const onlyAdminMode = await threadsData.get(event.threadID, "data.onlyAdminBox", false);
		const botOwnerID = global.GoatBot.config.owner;

		if (onlyAdminMode) {
			const threadInfo = await api.getThreadInfo(event.threadID);
			const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

			// bot owner always allowed
			if (event.senderID === botOwnerID) return;

			if (!adminIDs.includes(event.senderID)) {
				const hideNoti = await threadsData.get(event.threadID, "data.hideNotiMessageOnlyAdminBox", false);
				if (!hideNoti) {
					return api.sendMessage(
						"This group is currently restricted to only group admins using the bot.",
						event.threadID,
						event.messageID
					);
				}
			}
		}
	}
};