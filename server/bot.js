const express = require('express');
const cors = require('cors');
const app = express();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const TelegramBot = require("node-telegram-bot-api");
const { spawn } = require("child_process");
const fs = require("fs");

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
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

// Bot logic
console.log('Bot is running...');

// User Bot Configurations
const apiId = parseInt(process.env.API_ID, 10); // Convert to number
const apiHash = process.env.API_HASH;
const phoneNumber = process.env.PHONE_NUMBER;
const botToken = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID;

// File configurations
const channelsFile = "channels.json";
const sessionFile = "session.json";

// Initialize joined channels
let joinedChannels = fs.existsSync(channelsFile)
  ? JSON.parse(fs.readFileSync(channelsFile, "utf8"))
  : [];

// Initialize session
const savedSession = fs.existsSync(sessionFile)
  ? fs.readFileSync(sessionFile, "utf8")
  : "";
const session = new StringSession(savedSession);

// Telegram Client
let client;

async function initializeClient() {
  client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    console.log("Connecting to Telegram...");
    await client.connect();

    if (!(await client.isUserAuthorized())) {
      console.log("Session expired. Logging in...");
      await client.start({
        phoneNumber: () => Promise.resolve(phoneNumber),
        password: () => Promise.resolve(""), // Adjust if 2FA is enabled
        phoneCode: () => Promise.resolve(""),
      });

      fs.writeFileSync(sessionFile, client.session.save());
    }

    console.log("Client connected and authorized.");
  } catch (error) {
    console.error("Failed to initialize client:", error.message);
  }
}

// User Bot Functions
async function joinChannel(inviteLink) {
  try {
    const channelEntity = await client.getEntity(inviteLink);
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
      fs.writeFileSync(channelsFile, JSON.stringify(joinedChannels, null, 2));
      return `Successfully joined and saved: ${channelInfo.title}`;
    } else {
      return "Already joined this channel.";
    }
  } catch (error) {
    return `Failed to join channel: ${error.message}`;
  }
}

// Initialize Bot API
const bot = new TelegramBot(botToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use /login to log in to your Telegram account.');
});

bot.onText(/\/login/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    bot.sendMessage(chatId, 'Starting login process...');
    const phoneCode = await askQuestion(bot, chatId, 'Enter the code sent to your Telegram account:');

    await client.start({
      phoneNumber: () => Promise.resolve(phoneNumber),
      phoneCode: () => Promise.resolve(phoneCode),
    });

    bot.sendMessage(chatId, 'You are now logged in!');
    fs.writeFileSync(sessionFile, client.session.save());
  } catch (error) {
    bot.sendMessage(chatId, `Login failed: ${error.message}`);
  }
});

bot.onText(/\/join (.+)/, async (msg, match) => {
  if (msg.chat.id.toString() === adminId) {
    const inviteLink = match[1];
    const response = await joinChannel(inviteLink);
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

initializeClient().catch((error) => {
  console.error("Failed to initialize user bot:", error.message);
});

// Helper Function
function askQuestion(bot, chatId, question) {
  return new Promise((resolve) => {
    bot.sendMessage(chatId, question);
    bot.once("message", (msg) => {
      if (msg.chat.id === chatId) {
        resolve(msg.text);
      }
    });
  });
}