const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');
const { spawn } = require('child_process'); // Import child_process module

const app = express();
app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Allow access from any origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
const PORT = process.env.PORT || 3001;

app.use('/api', apiRouter);

// Run bot.js as a separate process
const botProcess = spawn('node', ['./bot.js']); // Ensure the path is correct

// Log bot.js output to console
botProcess.stdout.on('data', (data) => {
  console.log(`Bot output: ${data}`);
});

botProcess.stderr.on('data', (data) => {
  console.error(`Bot error: ${data}`);
});

botProcess.on('exit', (code) => {
  console.log(`Bot process exited with code ${code}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});