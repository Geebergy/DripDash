const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api'); // Assuming this is your API router
const app = express();

app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Allow access from any origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

// Setup API route
app.use('/api', apiRouter);

// Define the port
const PORT = process.env.PORT || 3001;

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Bot logic should go below, and it will continue running after server starts
console.log('Bot is running...');
// Your bot's logic here, like connecting to a service or handling periodic tasks

// Example of a basic bot operation (you can replace it with actual bot code)
setInterval(() => {
  console.log("Bot is active and running...");
}, 5000); // Example: Bot logs every 5 seconds

// If you need to handle any other bot-specific tasks, add them here.