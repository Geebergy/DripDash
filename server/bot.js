const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const input = require("input");

// User Bot Configurations
const apiId = process.env.APP_ID; // Replace with your API ID
const apiHash = process.env.API_HASH; // Replace with your API Hash

const channelsFile = "channels.json"; // File to save joined channels

// Bot API Configurations
const botToken = process.env.BOT_TOKEN; // Replace with your Bot Token
const adminId = process.env.ADMIN_ID; // Replace with your Telegram User ID for Bot Interaction

let joinedChannels = []; // Array to track joined channels



// Load saved channels
if (fs.existsSync(channelsFile)) {
  joinedChannels = JSON.parse(fs.readFileSync(channelsFile, "utf8"));
}

// Initialize User Bot
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

// Initialize Bot API
const bot = new TelegramBot(botToken, { polling: true });


  // User Bot Functions
  async function joinChannel(inviteLink) {
    try {
      const result = await client.invoke({
        _: "joinChannel",
        channel: await client.getEntity(inviteLink),
      });

      const channelInfo = {
        id: result.chats[0].id,
        title: result.chats[0].title,
      };

      if (!joinedChannels.some((ch) => ch.id === channelInfo.id)) {
        joinedChannels.push(channelInfo);
        fs.writeFileSync(channelsFile, JSON.stringify(joinedChannels, null, 2), "utf8");
        const message = `Successfully joined and saved: ${channelInfo.title}`;
        console.log(message);
        return message;
      } else {
        return "Already joined this channel.";
      }
    } catch (error) {
      return `Failed to join channel: ${error.message}`;
    }
  }

  async function fetchMessagesFromAllChannels() {
    let allMessages = "Fetched Messages:\n";
    for (const channel of joinedChannels) {
      try {
        const messages = await client.iterMessages(channel.id, { limit: 10 });
        allMessages += `\n[${channel.title}]\n`;
        for await (const message of messages) {
          allMessages += `${message.message}\n`;
        }
      } catch (err) {
        allMessages += `Error fetching messages from ${channel.title}: ${err.message}\n`;
      }
    }
    return allMessages;
  }

  // Bot API Commands
  bot.onText(/\/start/, (msg) => {
    if (msg.chat.id.toString() === adminId) {
      bot.sendMessage(adminId, "Hello Admin! Send /join <invite_link>, /fetch, or /channels.");
    } else {
      bot.sendMessage(msg.chat.id, "Unauthorized access.");
    }
  });

  bot.onText(/\/join (.+)/, async (msg, match) => {
    if (msg.chat.id.toString() === adminId) {
      const inviteLink = match[1];
      const response = await joinChannel(inviteLink);
      bot.sendMessage(adminId, response);
    }
  });

  bot.onText(/\/fetch/, async (msg) => {
    if (msg.chat.id.toString() === adminId) {
      const response = await fetchMessagesFromAllChannels();
      bot.sendMessage(adminId, response);
    }
  });

  bot.onText(/\/channels/, (msg) => {
    if (msg.chat.id.toString() === adminId) {
      if (joinedChannels.length === 0) {
        bot.sendMessage(adminId, "No channels in the list.");
      } else {
        let response = "Joined Channels:\n";
        joinedChannels.forEach((channel, index) => {
          response += `${index + 1}. ${channel.title} (ID: ${channel.id})\n`;
        });
        bot.sendMessage(adminId, response);
      }
    }
  });
})();