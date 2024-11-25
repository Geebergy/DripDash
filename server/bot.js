const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Allow access from any origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

// Define the port
const PORT = process.env.PORT || 3001;

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Bot logic should go below, and it will continue running after server starts
console.log('Bot is running...');
// Your bot's logic here, like connecting to a service or handling periodic tasks

// Example of a basic bot operation

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const readline = require("readline");
let client;

// User Bot Configurations
const apiId = parseInt(process.env.API_ID, 10); // Convert to number
const apiHash = process.env.API_HASH; // Replace with your API Hash
const phoneNumber = process.env.PHONE_NUMBER; // Replace with your phone number (e.g., "+1234567890")

const channelsFile = "channels.json"; // File to save joined channels

// Bot API Configurations
const botToken = process.env.BOT_TOKEN; // Replace with your Bot Token
const adminId = process.env.ADMIN_ID; // Replace with your Telegram User ID for Bot Interaction

let joinedChannels = []; // Array to track joined channels

const askQuestion = async (bot, chatId, question) => {
  return new Promise((resolve) => {
    // Send the question to the user
    bot.sendMessage(chatId, question);

    // Wait for the user's response
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId) {
        resolve(msg.text);
      }
    });
  });
};

// Load saved channels
if (fs.existsSync(channelsFile)) {
  joinedChannels = JSON.parse(fs.readFileSync(channelsFile, "utf8"));
}

// Define the session
const savedSession = fs.existsSync("session.json")
  ? fs.readFileSync("session.json", "utf8")
  : "";
const session = new StringSession(savedSession); // Initialize with an empty session or load from storage

// Initialize TelegramClient
async function initializeClient() {
  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  // User Bot Functions
  async function joinChannel(inviteLink) {
    try {
      if (!client || !client.session) {
        throw new Error("User bot is not logged in. Please log in first.");
      }
      const channelEntity = await client.getEntity(inviteLink); // Resolve the invite link
      const result = await client.invoke({
        _: "channels.joinChannel",
        channel: channelEntity,
      });

      const channelInfo = {
        id: channelEntity.id,
        title: channelEntity.title,
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

  // Initialize Bot API
  const bot = new TelegramBot(botToken, { polling: true });

  // Bot Commands
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Use /login to log in to your Telegram account.');
  });

  let errorHandled = false;

bot.onText(/\/login/, async (msg) => {
  if (errorHandled) {
    errorHandled = false;
    return; // Prevent re-triggering error messages for the same command
  }

  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Starting login process...');

  try {
    await client.start({
      phoneNumber: async () => {
        try {
          return await askQuestion(bot, chatId, 'Please enter your phone number:');
        } catch (error) {
          console.error('Phone number input error:', error);
          bot.sendMessage(chatId, 'There was an issue while receiving the phone number. Please try again.');
          errorHandled = true;
          throw error;
        }
      },
      password: async () => {
        try {
          return await askQuestion(bot, chatId, 'Please enter your password (if 2FA is enabled):');
        } catch (error) {
          console.error('Password input error:', error);
          bot.sendMessage(chatId, 'There was an issue while receiving the password. Please try again.');
          errorHandled = true;
          throw error;
        }
      },
      phoneCode: async () => {
        try {
          bot.sendMessage(chatId, 'Enter the code sent to your Telegram account.');
          return await askQuestion(bot, chatId, 'Enter the code you received:');
        } catch (error) {
          console.error('Phone code input error:', error);
          bot.sendMessage(chatId, 'There was an issue while receiving the phone code. Please try again.');
          errorHandled = true;
          throw error;
        }
      },
      onError: (err) => {
        console.error('Client start error:', err);
        bot.sendMessage(chatId, `Error during the login process. Please try again later. Error details: ${err.message}`);
        errorHandled = true;
      },
    });

    bot.sendMessage(chatId, 'You are now logged in!');
    bot.sendMessage(chatId, 'Your session string has been saved for future logins.');
    fs.writeFileSync("session.json", client.session.save()); // Save this securely
    console.log(`User with chatId ${chatId} successfully logged in and session saved.`); // Log successful login
  } catch (error) {
    console.error('Login error:', error);
    bot.sendMessage(chatId, `Login failed: ${error.message}`);
    bot.sendMessage(chatId, `Error details: ${error.stack ? error.stack : error.message}`); // Send error stack to user for debugging
  }
});

  // Other commands
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Commands:\n/login - Log in to your Telegram account\n/help - Show help message');
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
            const messages = client.iterMessages(channel.id, { limit: 100 }); // Fetch last 100 messages

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
}

initializeClient().catch(error => {
  console.error("Failed to initialize user bot:", error.message);
});