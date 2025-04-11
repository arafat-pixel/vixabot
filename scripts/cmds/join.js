const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");

module.exports = {
	config: {
		name: "join",
		version: "2.3",
		author: "Nur",
		countDown: 5,
		role: 3,
		shortDescription: "Join the group that bot is in or remove the bot ",
		longDescription: "",
		category: "Owner",
		guide: {
			en: "{p}{n}",
		},
	},

	onStart: async function ({ api, event }) {
		try {
			const groupList = await api.getThreadList(100, null, ['INBOX']);
			
			// Filter only the groups where the bot is actually a member
			const filteredList = groupList.filter(group => {
				// Check if it's a group and the bot is a participant
				const isGroup = group.isGroup === true;
				const botID = api.getCurrentUserID();
				const botIsMember = group.participantIDs && group.participantIDs.includes(botID);
				
				// For groups without names, assign "Unnamed Group"
				if (isGroup && botIsMember && (group.threadName === null || group.threadName === "")) {
					group.threadName = "𝗨𝗻𝗻𝗮𝗺𝗲𝗱";
				}
				
				return isGroup && botIsMember;
			});

			if (filteredList.length === 0) {
				api.sendMessage('⚠️ No group chats found.', event.threadID);
			} else {
				const formattedList = filteredList.map((group, index) => {
					const memberCount = group.participantIDs ? group.participantIDs.length : "Unknown";
					
					// Check if the admin is already a member based on the participantIDs from the thread list
					const adminInGroup = group.participantIDs && group.participantIDs.includes(event.senderID);
					
					// Only show the "(not joined)" text for groups where admin is not a member
					const joinStatus = !adminInGroup ? " (𝗡𝗼)" : "";
					
					return `➥ ${index + 1}. ${group.threadName}${joinStatus}\n𝗜𝗗: ${group.threadID}\n𝗠𝗲𝗺𝗯𝗲𝗿: ${memberCount}\n`;
				});

				const message = `💢 𝗟𝗶𝘀𝘁 𝗼𝗳 𝗚𝗿𝗼𝘂𝗽𝘀..!\n 
${formattedList.join("\n")}
─────────────────────
💥𝗥𝗲𝗽𝗹𝘆 𝘄𝗶𝘁𝗵 𝘁𝗵𝗲 𝗴𝗿𝗼𝘂𝗽 𝗻𝘂𝗺𝗯𝗲𝗿 𝘁𝗼 𝗷𝗼𝗶𝗻\n𝗼𝘂𝘁(𝗴𝗿𝗼𝘂𝗽 𝗻𝘂𝗺𝗯𝗲𝗿) 𝘁𝗼 𝗹𝗲𝗮𝘃𝗲`;

				const sentMessage = await api.sendMessage(message, event.threadID);
				global.GoatBot.onReply.set(sentMessage.messageID, {
					commandName: 'join',
					messageID: sentMessage.messageID,
					author: event.senderID,
					groupList: filteredList // Store the list for later use
				});
			}
		} catch (error) {
			console.error("Error listing group chats", error);
			api.sendMessage('❌ An error occurred while fetching group chats.', event.threadID);
		}
	},

	onReply: async function ({ api, event, Reply, args }) {
		const { author, commandName, groupList } = Reply;

		if (event.senderID !== author) {
			return;
		}

		const userInput = event.body.trim();
		
		// Check if the message starts with "out" to handle bot removal request
		if (userInput.toLowerCase().startsWith("out")) {
			const leaveRequestMatch = userInput.match(/^out\s*(\d+)$/i);
			if (leaveRequestMatch) {
				const groupIndex = parseInt(leaveRequestMatch[1], 10);
				
				if (isNaN(groupIndex) || groupIndex <= 0 || groupIndex > groupList.length) {
					api.sendMessage('⚠️ Invalid group number.\nPlease choose a valid number within the range.', event.threadID, event.messageID);
					return;
				}
				
				const selectedGroup = groupList[groupIndex - 1];
				const leaveMessage = `⚠️ React to this message to remove the bot from "${selectedGroup.threadName}"`;
				
				const sentLeaveMessage = await api.sendMessage({
					body: leaveMessage
				}, event.threadID);
				
				// Set up reaction handler for bot removal
				global.GoatBot.onReaction.set(sentLeaveMessage.messageID, {
					commandName: 'join',
					messageID: sentLeaveMessage.messageID,
					author: event.senderID,
					groupToLeave: selectedGroup,
					leaveAction: true
				});
				
				return;
			}
		}

		const groupIndex = parseInt(userInput, 10);

		if (isNaN(groupIndex) || groupIndex <= 0) {
			api.sendMessage('⚠️ Invalid input.\nPlease provide a valid number.', event.threadID, event.messageID);
			return;
		}

		try {
			if (groupIndex > groupList.length) {
				api.sendMessage('⚠️ Invalid group number.\nPlease choose a number within the range.', event.threadID, event.messageID);
				return;
			}

			const selectedGroup = groupList[groupIndex - 1];
			const groupID = selectedGroup.threadID;

			// Check if the user is already in the group
			const memberList = await api.getThreadInfo(groupID);
			if (memberList.participantIDs.includes(event.senderID)) {
				api.sendMessage(`⚠️ You are already a member of:\n"${selectedGroup.threadName}"`, event.threadID, event.messageID);
				return;
			}

			// Check if group is full
			if (memberList.participantIDs.length >= 250) {
				api.sendMessage(`⚠️ Unable to join "${selectedGroup.threadName}".\nThe group has reached its maximum capacity of 250 members.`, event.threadID, event.messageID);
				return;
			}

			// Check if the bot has approval rights in the group
			const botID = api.getCurrentUserID();
			const threadInfo = await api.getThreadInfo(groupID);
			const approvalMode = threadInfo.approvalMode;
			const botIsAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

			// Handle the case where the group has approval mode on
			if (approvalMode === true) {
				try {
					await api.addUserToGroup(event.senderID, groupID);
					api.sendMessage(`🔄 Join request sent to "${selectedGroup.threadName}".\nWaiting for admin approval...`, event.threadID, event.messageID);
				} catch (approvalError) {
					console.error("Approval error:", approvalError);
					api.sendMessage(`⚠️ Could not send join request to "${selectedGroup.threadName}".\nPlease ask a group admin to add you manually.`, event.threadID, event.messageID);
				}
				return;
			}

			// Try to add the user to the group with better error handling
			try {
				await api.addUserToGroup(event.senderID, groupID);
				api.sendMessage(`✅ 𝗝𝗼𝗶𝗻𝗲𝗱:\n"${selectedGroup.threadName}"`, event.threadID, event.messageID);
			} catch (addError) {
				// Check if error code is related to permissions
				if (addError.errorDescription && addError.errorDescription.includes("permission")) {
					api.sendMessage(`⚠️ Cannot join "${selectedGroup.threadName}".\nThe bot doesn't have permission to add members to this group.`, event.threadID, event.messageID);
				} else if (addError.errorDescription && addError.errorDescription.includes("limit")) {
					api.sendMessage(`⚠️ Cannot join "${selectedGroup.threadName}".\nYou've reached the limit of groups you can join in a short period. Please try again later.`, event.threadID, event.messageID);
				} else if (addError.errorDescription && addError.errorDescription.includes("approval")) {
					api.sendMessage(`🔄 Join request sent to "${selectedGroup.threadName}".\nWait for admin approval...`, event.threadID, event.messageID);
				} else {
					// If all else fails, provide generic error message with more details
					console.error("Detailed join error:", addError);
					api.sendMessage(`❌ Could not join "${selectedGroup.threadName}".\nThis might be due to group privacy settings or temporary restrictions.\nPlease try again later or ask a group admin to add you.`, event.threadID, event.messageID);
				}
			}
		} catch (error) {
			console.error("Error joining group chat", error);
			api.sendMessage('❌ An error occurred while processing your request.\nPlease try again later.', event.threadID, event.messageID);
		} finally {
			global.GoatBot.onReply.delete(Reply.messageID);
		}
	},
	
	// Add handler for reaction
	onReaction: async function ({ api, event, Reaction }) {
		// Check if this is a leave reaction
		if (!Reaction || !Reaction.leaveAction) return;
		
		const { author, groupToLeave } = Reaction;
		
		// Verify that the reaction is from the original command author
		if (event.userID !== author) return;
		
		try {
			const groupID = groupToLeave.threadID;
			const groupName = groupToLeave.threadName;
			
			// Send a goodbye message
			await api.sendMessage(`𝗜'𝗺 𝗹𝗲𝗮𝘃𝗶𝗻𝗴 𝗮𝘁 𝗺𝘆 𝗢𝘄𝗻𝗲𝗿 𝗥𝗲𝗾𝘂𝗲𝘀𝘁.`, groupID);
			
			// Leave the group
			await api.removeUserFromGroup(api.getCurrentUserID(), groupID);
			
			// Confirm to the author that the bot has left
			api.sendMessage(`✅ Left from "${groupName}".`, event.threadID);
		} catch (error) {
			console.error("Error leaving group chat", error);
			api.sendMessage(`❌ Failed to leave the group "${groupToLeave.threadName}".\nError: ${error.message || "Unknown error"}`, event.threadID);
		} finally {
			global.GoatBot.onReaction.delete(Reaction.messageID);
		}
	}
};