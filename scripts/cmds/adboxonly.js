module.exports = {
	config: {
		name: "onlyadminbox",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
		version: "1.4",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			en: "turn on/off only admin box can use bot"
		},
		category: "box chat",
		guide: {
			en: "   {pn} [on | off]: turn on/off the mode only admin of group can use bot"
				+ "\n   {pn} noti [on | off]: turn on/off the notification when user is not admin of group use bot"
		}
	},

	langs: {
		en: {
			turnedOn: "Turned on the mode, only admin of group & bot owner can use bot",
			turnedOff: "Turned off the mode, now everyone can use the bot",
			turnedOnNoti: "Turned on the notification when a user who is not an admin of the group uses the bot",
			turnedOffNoti: "Turned off the notification when a user who is not an admin of the group uses the bot",
			syntaxError: "Syntax error, only use {pn} on or {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, usersData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		// Bot owner ID (এখানে তোমার বট মালিকের আইডি বসাও)
		const botOwnerID = "100034630383353"; 

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

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		if (isSetNoti)
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		else
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	},

	onEvent: async function ({ event, threadsData, api }) {
		const onlyAdminMode = await threadsData.get(event.threadID, "data.onlyAdminBox", false);
		const botOwnerID = "100034630383353"; // তোমার বট মালিকের আইডি

		if (onlyAdminMode) {
			const threadInfo = await api.getThreadInfo(event.threadID);
			let adminIDs = threadInfo.adminIDs.map(admin => admin.id);
			
			// যদি বোট মালিক গ্রুপে এডমিন না হন তবে তাকে অ্যাডমিন হিসেবে যুক্ত করুন
			if (!adminIDs.includes(botOwnerID)) {
				adminIDs.push(botOwnerID);
			}
			
			// বোট মালিক ছাড়া যারা এডমিন না, তাদেরকে ব্যবহারের থেকে নিষিদ্ধ করুন
			if (!adminIDs.includes(event.senderID)) {
				return api.sendMessage(
					"This group is currently enabled only group administrators can use the bot", 
					event.threadID, 
					event.messageID
				);
			}
		}
	}
};