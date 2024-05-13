// my-app/server/app.js
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
