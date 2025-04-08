const destination = "100034630383353";

module.exports = {
	config: {
		name: "catchpastebin",
		aliases: ["cpbin"],
		version: 1.0,
		author: "LiANE",
		countDown: 5,
		role: 2,
		shortDescription: { en: "Catch Pastebin" },
		longDescription: { en: "Use this to catch pastebin" },
		category: "info",
		guide: { en: "{pn}" }
	},

	onStart: async function ({ api, event, message, usersData }) {
		const data = await usersData.get(event.senderID);
		message.reply(`⚠ Pastebin Alert:
How to use?
1. Open the code file.
2. Change the 'destination' ID to your own UID.
3. Save and deploy the bot again.
Once set, it will catch pastebin links and forward them.`);
	},

	onChat: async function ({ api, event, usersData, threadsData }) {
		const chat = event.body;
		if (chat && chat.includes("pastebin.com")) {
			try {
				const data = await usersData.get(event.senderID);
				const thread = await threadsData.get(event.threadID);
				const name = data.name || "Unknown";
				const threadName = thread.threadName || "Private Chat";

				const alertMessage = `⚠ Pastebin Alert:
» From: ${name}
» UID: ${event.senderID}
» Thread: ${threadName}
» GCID: ${event.threadID}
🔖 Content:
${chat}`;

				api.sendMessage(alertMessage, destination);
			} catch (err) {
				console.error("Error in catchpastebin onChat:", err);
			}
		}
	}
};
