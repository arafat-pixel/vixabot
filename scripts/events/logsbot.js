const { getTime } = global.utils;

module.exports = {
	config: {
		name: "logsbot",
		isBot: true,
		version: "1.5",
		author: "NTKhang",
		envConfig: {
			allow: true
		},
		category: "events"
	},

	langs: {
		vi: {
			added: "💥Bot được thêm vào nhóm mới!\n     ➥Người thêm: %1\n     ➥ID: %2\n     ➥Nhóm: %3\n     ➥ID nhóm: %4\n     ➥Thời gian: %5",
			kicked: "❌Bot bị kick khỏi nhóm!\n     ➥Người kick: %1\n     ➥ID: %2\n     ➥Nhóm: %3\n     ➥ID nhóm: %4\n     ➥Thời gian: %5"
		},
		en: {
			added: "💥𝗕𝗼𝘁 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝗮𝗱𝗱𝗲𝗱 𝘁𝗼 𝗮 𝗻𝗲𝘄 𝗴𝗿𝗼𝘂𝗽..!\n     ➥𝗔𝗱𝗱𝗲𝗱 𝗯𝘆 : %1\n     ➥ 𝗜𝗗: %2\n     ➥𝗚𝗿𝗼𝘂𝗽 : %3\n     ➥𝗜𝗗 : %4\n     ➥𝗧𝗶𝗺𝗲: %5",
			kicked: "❌𝗕𝗼𝘁 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝗞𝗶𝗰𝗸𝗲𝗱 𝗳𝗿𝗼𝗺 𝘁𝗵𝗲 𝗴𝗿𝗼𝘂𝗽..!\n     ➥𝗞𝗶𝗰𝗸𝗲𝗱 𝗯𝘆 : %1\n     ➥ 𝗜𝗗: %2\n     ➥𝗚𝗿𝗼𝘂𝗽 : %3\n     ➥𝗜𝗗 : %4\n     ➥𝗧𝗶𝗺𝗲: %5"
		}
	},

	onStart: async ({ usersData, threadsData, event, api, getLang }) => {
		const { author, threadID } = event;
		
		// Check if this is a bot being added or removed event
		const isAddedEvent = event.logMessageType === "log:subscribe" && 
			event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID());
		
		const isRemovedEvent = event.logMessageType === "log:unsubscribe" && 
			event.logMessageData.leftParticipantFbId == api.getCurrentUserID();
		
		// If neither case applies, exit early
		if (!isAddedEvent && !isRemovedEvent) return;

		// Don't process if the bot added/removed itself
		if (author == api.getCurrentUserID()) return;

		const { config } = global.GoatBot;
		let threadName, msg;
		const time = getTime("DD/MM/YYYY hh:mm:ss A");

		try {
			if (isAddedEvent) {
				threadName = (await api.getThreadInfo(threadID)).threadName;
				const authorName = await usersData.getName(author);
				msg = getLang("added", authorName, author, threadName, threadID, time);
			}
			else if (isRemovedEvent) {
				const threadData = await threadsData.get(threadID);
				threadName = threadData.threadName;
				const authorName = await usersData.getName(author);
				msg = getLang("kicked", authorName, author, threadName, threadID, time);
			}

    // Owner-দের কাছে মেসেজ পাঠানোর জন্য
    for (const ownerID of config.ownerBot) {
        await api.sendMessage(msg, ownerID);
    }
    // নির্দিষ্ট গ্রুপে মেসেজ পাঠানো জন্য
    await api.sendMessage(msg, "8724817120954173");
} catch (err) {
    console.error("Error in logsbot:", err);
}