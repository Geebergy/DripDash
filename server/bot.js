const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

// User Bot Configurations
const apiId = parseInt(process.env.API_ID, 10); // Convert to number
const apiHash = process.env.API_HASH; // Replace with your API Hash
const phoneNumber = process.env.PHONE_NUMBER; // Replace with your phone number (e.g., "+1234567890")

const channelsFile = "channels.json"; // File to save joined channels

// Bot API Configurations
const botToken = process.env.BOT_TOKEN; // Replace with your Bot Token
const adminId = process.env.ADMIN_ID; // Replace with your Telegram User ID for Bot Interaction

let joinedChannels = []; // Array to track joined channels

// Load saved channels
if (fs.existsSync(channelsFile)) {
  joinedChannels = JSON.parse(fs.readFileSync(channelsFile, "utf8"));
}

const client = new TelegramClient(session, apiId, apiHash, {
    deviceModel: "Custom Bot", // Adjust to match your app name
    systemVersion: "10", // Mimic system version
    appVersion: "1.0.0", // Ensure the app version matches Telegram requirements
    langCode: "en", // Language
});

(async function startBot() {
    console.log("Starting Telegram Bot...");

    try {
        await client.start({
            phoneNumber: async () => phoneNumber, // Replace with actual phone number
            phoneCode: async () => {
                throw new Error("Manual input not supported in this setup.");
            },
            onError: (error) => {
                console.error("Error occurred during authentication:", error);
            },
        });

        console.log("Bot is connected successfully!");
    } catch (error) {
        console.error("Failed to initialize bot:", error);
    }
})();

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
    try {
      const wordCounts = {}; // To store words and their occurrences per channel

      // Iterate through each joined channel
      for (const channel of joinedChannels) {
        try {
          const messages = await client.iterMessages(channel.id, { limit: 100 }); // Fetch last 100 messages

          for await (const message of messages) {
            if (!message.message) continue; // Skip if message is empty
            const matches = message.message.match(/\$[A-Za-z0-9_]+/g); // Match words starting with $

            if (matches) {
              matches.forEach((word) => {
                if (!wordCounts[word]) {
                  wordCounts[word] = {}; // Initialize word in global storage
                }
                if (!wordCounts[word][channel.title]) {
                  wordCounts[word][channel.title] = 0; // Initialize count for this channel
                }
                wordCounts[word][channel.title] += 1; // Increment count for this channel
              });
            }
          }
        } catch (err) {
          console.log(`Error fetching messages from ${channel.title}: ${err.message}`);
        }
      }

      // Filter words that appear in multiple channels
      const filteredWords = Object.entries(wordCounts).filter(([word, channels]) => {
        return Object.keys(channels).length > 1; // Appear in more than one channel
      });

      // Build the response message
      let response = "Keyword Report:\n";
      if (filteredWords.length > 0) {
        filteredWords.forEach(([word, channels]) => {
          const totalOccurrences = Object.values(channels).reduce((sum, count) => sum + count, 0);
          response += `\n${word} (${totalOccurrences} total occurrences):\n`;
          for (const [channel, count] of Object.entries(channels)) {
            response += `  - ${channel}: ${count} occurrences\n`;
          }
        });
      } else {
        response += "No keywords found appearing in multiple channels.";
      }

      // Send the response
      bot.sendMessage(adminId, response);
    } catch (error) {
      bot.sendMessage(adminId, `Failed to fetch messages: ${error.message}`);
    }
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
  } catch (error) {
    console.error("Failed to initialize user bot:", error.message);
  }
})();