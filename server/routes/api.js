// my-app/server/routes/api.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../model');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const axios = require('axios');

// const uri = "mongodb+srv://TheGilo:OnlyOneGilo@cluster0.pvwjh.mongodb.net/userData?retryWrites=true&w=majority&appName=DripDashCluster";
const uri = "mongodb+srv://OneGilo:OnlyOneGilo@dripdash.f23pb.mongodb.net/userData?retryWrites=true&w=majority&appName=DripDash"

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {

    
    console.error('Error connecting to MongoDB', error);
  }
}

connectToMongoDB();



// create user
router.post("/createUser", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    if(!doesDataExist){
      await userDetails.save();
      response.send({"userDetails": userDetails, "status": "success"});
    }
    else{
      const reply = {
        "status": "failed",
        "message": "User data already exists",
      }
      response.send(reply);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

router.post("/addUser", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    if(!doesDataExist){
      await userDetails.save();
      response.send({"userDetails": userDetails, "status": "success"});
    }
    else{
      const reply = {
        "status": "success",
        "message": "User data already exists",
      }
      response.send(reply);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});
// update users on referrals change

// Function to watch referralsBalance for all users
async function watchReferralsBalanceForAllUsers() {
  // Set up a change stream for the referralsBalance field for all users
  const changeStream = User.watch();

  // Watch for changes in the referralsBalance field for all users
  changeStream.on('change', async change => {
    if (change.operationType === 'update' && change.documentKey._id) { // Check if fullDocument exists
      const userID = change.documentKey._id;
          // Fetch the full document to get referralsBalance
    const user = await User.findById(userID);
    if (!user) {
        throw new Error(`User with ID ${userID} not found.`);
    }

    const { userId, referralsBalance, referredBy, role, previousReferralsBalance } = user;

    if (!userId || !referralsBalance || !referredBy || !role || !previousReferralsBalance) {
        console.log('Required user data is missing or invalid.');
    }


    // Fetch the user details of the user who referred this user
    const referringUser = await User.findOne({ userId: referredBy });

      if (!referringUser) {
        if(referringUser !== "none"){
         console.log(`Referring user with ID ${referredBy} not found.`);
        }
      }
    
    

      // Calculate increase in referrals balance
      const increase = referralsBalance - (previousReferralsBalance || 0);

      const userRole = role;
      // Update referring user's referrals balance if increase is positive
      // Update referring user's referrals balance based on userRole
      if (userRole === 'crypto') {
        // Crypto account crediting
        if (referringUser && increase > 0) {
            const bonus = referringUser.role === 'crypto' ? increase * 0.1 : increase * 50;
            referringUser.referralsBalance += bonus;
            referringUser.weeklyEarnings = (referringUser.weeklyEarnings || 0) + bonus;
            await referringUser.save();
        }
      } else {
        // Naira account crediting
        if (referringUser && increase > 0) {
            const bonus = referringUser.role === 'crypto' ? increase * 0.0005 : increase * 0.05;
            referringUser.referralsBalance += bonus;
            referringUser.weeklyEarnings = (referringUser.weeklyEarnings || 0) + bonus;
            await referringUser.save();
        }
      }


      // Update user's previousReferralsBalance
      user.previousReferralsBalance = referralsBalance;
      await User.findOneAndUpdate({ userId: userId }, { previousReferralsBalance: referralsBalance });
    }
  });
}

// Example usage: Watch referralsBalance for all users
watchReferralsBalanceForAllUsers();




// ...
// fetch prizes and winners
const prizesAndWinnersSchema = new mongoose.Schema({
  lastWinner: String,
  lastPrize: Number,
  currentPrize: Number,
  adPrize: Number,
  userId: String,
  category: {
    type: String,
    required: true
  },
  prize: Number,
});

const rafflesSchema = new mongoose.Schema({
  userId: String,
  category: String,
  name: String,
  fee: Number,
});
// Create a model based on the schema
const Prize = mongoose.model('Prize', prizesAndWinnersSchema, 'prizesandwinners');
const RaffleParticipant = mongoose.model('RaffleParticipant', rafflesSchema, 'raffles');

router.get('/getPrizesAndWinners', async (req, res) => {
  try {
    // Fetch the top earner and top ad clicker from the prizesandwinners collection
    const topEarnerPrize = await Prize.findOne({ category: 'topEarner' });
    const topAdClickerPrize = await Prize.findOne({ category: 'topAdClicker' });
    const currentPrizeDoc = await Prize.findOne({ category: 'Info' });
    const raffleWinner = await Prize.findOne({ category: 'raffleWinner' });
    const raffleFeeDoc = await RaffleParticipant.findOne({ category: 'fee' });

    // Fetch the user documents for the top earners and ad clickers
    const topEarnerUser = await User.findOne({userId: topEarnerPrize.userId});
    const topAdClickerUser = await User.findOne({userId: topAdClickerPrize.userId});
    const raffleWinnerUser = await User.findOne({userId: raffleWinner.userId});
    const topEarnerLastPrize = topEarnerPrize.prize;
    const topAdClickerLastPrize = topAdClickerPrize.prize;
    const raffleWinnerLastPrize = raffleWinner.prize;
    const currentPrize = currentPrizeDoc.prize;
    const currentAdPrize = currentPrizeDoc.adPrize;
    const currentRaffleFee = raffleFeeDoc.fee;
    

    // Extract the usernames from the user documents
    const topEarnerUsername = topEarnerUser ? topEarnerUser.name : null;
    const topAdClickerUsername = topAdClickerUser ? topAdClickerUser.name : null;
    const raffleWinnerUsername = raffleWinnerUser ? raffleWinnerUser.name : null;

    // getting users anon status
    const topEarnerAnon = topEarnerUser ? topEarnerUser.isAnonymous : null;
    const topAdClickerAnon = topAdClickerUser ? topAdClickerUser.isAnonymous : null;
    const raffleWinnerAnon = raffleWinnerUser ? raffleWinnerUser.isAnonymous : null;
    // Return the top earners and ad clickers with usernames
    res.json({ 
        topEarner: { userId: topEarnerPrize.userId, username: topEarnerUsername },
        topAdClicker: { userId: topAdClickerPrize.userId, username: topAdClickerUsername },
        topEarnerUsername,
        topAdClickerUsername,
        topEarnerLastPrize,
        topAdClickerLastPrize,
        raffleWinnerLastPrize,
        currentPrize,
        currentAdPrize,
        currentRaffleFee,
        raffleWinnerUsername,
        topEarnerAnon,
        topAdClickerAnon,
        raffleWinnerAnon
    });
  } catch (err) {
      console.error('Error fetching prizes and winners:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});
// end of prizesandwinners collection
// define crypto save collection
// Define schema for storing payment callback data
const PaymentCallbackSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now }, // Timestamp of the callback
  userID: String,
  payment_id: String,
  payment_status: String,
  pay_address: String,
  price_amount: Number,
  order_description: String
});

// Create model for payment callback data
const PaymentCallback = mongoose.model('PaymentCallback', PaymentCallbackSchema, 'cryptopayment');

// save data
// Define a route to handle transaction creation
router.post('/saveCryptoPayments', async (request, response) => {
  try {
    const paymentData = request.body;
    const paymentCallback = new PaymentCallback(paymentData);

    // Save the document to the database
    paymentCallback.save()
      .then(() => {
        console.log('Payment callback data saved successfully');
        response.sendStatus(200); // Respond with success status
      })
      .catch(error => {
        console.error('Error saving payment callback data:', error);
        response.status(500).send('Error saving payment callback data'); // Respond with error status
      });
  } catch (error) {
    console.error('Error adding transaction document: ', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

// ...
// callback data
router.post('/payment', async (req, res) => {
  try {
    const { data } = req.body;
    const API_KEY = 'ANAVJWM-2GKMRZJ-GV6RDW4-J1N753D';

    const response = await axios.post('https://api.nowpayments.io/v1/payment', data, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

  res.json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Callback endpoint (crypto)

router.post('/crypto-callback', async (req, res) => {
  try {
    const { data } = req.body;

    res.json(data);
    console.log(data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// 
// Backend (Express) - Route to Add Participants
router.post('/addParticipant', async (req, res) => {
  try {
      const { userId, fee } = req.body;
      // update user balance before adding them
      await User.findOneAndUpdate(
        { userId: userId },
        { $inc: { referralsBalance: -fee, slots: 1 } }, // Deduct the fee from the balance
        { new: true } // To return the updated user document
      );
  
      // Check if the user exists and the balance was updated
      
       // Save participant to the "raffleParticipants" collection in MongoDB
       await RaffleParticipant.create({ userId, category: 'participant' });
       res.status(200).json({ message: 'Fee deducted successfully'});
      
  } catch (error) {
      console.error('Error adding participant:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// select raffle winner
const selectRaffleWinner = async () => {
  try {
      // Fetch all participants from the raffleParticipants collection
      const participants = await RaffleParticipant.find({ category: 'participant' });
      
      console.log('Participants:', participants); // Log participants array
      
      // Check if there are any participants
      if (participants.length === 0) {
          console.log('No participants found.');
          return; // Exit function early if no participants
      }

      // Select a random participant as the winner
      const winner = participants[Math.floor(Math.random() * participants.length)];
      
      console.log('Winner:', winner); // Log winner
      
      if (!winner) {
          console.log('Winner is undefined.');
          return; // Exit function early if winner is undefined
      }

      // Save the winner to the raffleWinners collection or document
      await Prize.findOneAndUpdate({ category: 'raffleWinner' }, { $set: { userId: winner.userId, prize: 0 } }, { upsert: true });

      console.log('Raffle winner selected:', winner);

      // Delete all participants from the raffleParticipants collection
      await RaffleParticipant.deleteMany({ category: 'participant' });

      console.log('All participants deleted from the raffleParticipants collection.');
  } catch (error) {
      console.error('Error selecting raffle winner:', error);
  }
};



// reset and set leadderboard
// Schedule task to run at 00:00 on Monday (start of the week)
cron.schedule('0 0 * * 0', async () => {
  try {
      console.log('started update')
      // Reset weeklyEarnings and adsClicked for all users
      await User.updateMany({}, { $set: { weeklyEarnings: 0, adsClicked: 0, weeklyReferrals: 0, slots: 0 } });

      console.log('users updated')
      // Fetch top earners and ad clickers
      const topEarners = await User.find().sort({ weeklyReferrals: -1 }).limit(1);
      const topAdClickers = await User.find().sort({ adsClicked: -1 }).limit(1);

    // Save the top earners and ad clickers to the prizesandwinners collection
      await Prize.findOneAndUpdate({ category: 'topEarner' }, { $set: { userId: topEarners[0].userId, prize: 0 } }, { upsert: true });
      await Prize.findOneAndUpdate({ category: 'topAdClicker' }, { $set: { userId: topAdClickers[0].userId, prize: 0 } }, { upsert: true });
      console.log('winners assigned')
      selectRaffleWinner();


      console.log('Weekly reset completed successfully.');
  } catch (err) {
      console.error('Error resetting weekly data:', err);
  }
});


// update access
const TWENTY_FOUR_HOURS_IN_SECONDS = 24 * 60 * 60; // 24 hours * 60 minutes * 60 seconds

// Inside your Node.js backend
router.get('/featureAccess', async (req, res) => {
  try {
    const { userID } = req.query;
    const user = await User.findOne({userId: userID}); // Assuming you have userId available in req
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentTime = new Date();
    const timeSinceCreation = currentTime - user.createdAt;
    const timeLeftInSeconds = Math.max(0, TWENTY_FOUR_HOURS_IN_SECONDS - Math.floor(timeSinceCreation / 1000));
    const hasAccess = timeLeftInSeconds > 0;
    
    res.status(200).json({ hasAccess, timeLeftInSeconds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// update anonymity
// Assuming you have a User model and express.Router() already set up

// POST /api/update-anonymity
router.post('/update-anonymity', async (req, res) => {
  const anonymous  = req.body.anonymous;
  const userID = req.body.userID;
  try {
      // Find the current user and update the isAnonymous field
      const user = await User.findOne({userId: userID});
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      await User.updateOne(
        { userId: userID },
        { $set: {isAnonymous: anonymous } }
      );
      res.status(200).json({ message: 'Anonymity preference updated successfully' });
  } catch (error) {
      console.error('Error updating anonymity preference:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get top earners for the current week
router.get('/top-earners', async (req, res) => {
  try {
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const endOfWeek = new Date();
      endOfWeek.setHours(23, 59, 59, 999);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const topEarners = await User.find().sort({ weeklyReferrals: -1 }).limit(10);
      const fullListEarners = await User.find().sort({ weeklyReferrals: -1 });

      res.json({topEarners, fullListEarners});
  } catch (err) {
      console.error('Error fetching top earners:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get top ad clickers for the current week
router.get('/top-ad-clickers', async (req, res) => {
  try {
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const endOfWeek = new Date();
      endOfWeek.setHours(23, 59, 59, 999);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const topAdClickers = await User.find().sort({ adsClicked: -1 }).limit(10);
      const fullListClickers = await User.find().sort({ adsClicked: -1 });

      res.json({topAdClickers, fullListClickers});
  } catch (err) {
      console.error('Error fetching top ad clickers:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// end of leaderboard


// update account limit
router.post('/updateAccountLimit', async (req, res) => {
  const userId = req.body.userId;

  try {
    const userDoc = await User.findOne({ userId: userId });

    // Get the referredBy user's ID from the current user's document
    const referredByUserId = userDoc.referredBy;

    if (referredByUserId !== 'none') {
      try {
        // Fetch the referredBy user's document
        const referredByUserDoc = await User.findOne({ userId: referredByUserId });

        if (!referredByUserDoc) {
          throw new Error('ReferredBy user data not found.');
        }

        // Define account limit, activity, and referral count from the referredBy user
        const currentAccountLimit = referredByUserDoc.accountLimit;
        const isAccountActive = referredByUserDoc.isUserActive;
        const referralsCount = referredByUserDoc.referralsCount;
        const hasUserPaid = referredByUserDoc.hasPaid;

        const amount = referredByUserDoc.reserveAccountLimit;

        // Check if the user has three referrals and isAccountActive
        if (referralsCount >= 3 && isAccountActive && hasUserPaid) {
          await User.updateOne(
            { userId: referredByUserId },
            { $set: { accountLimit: parseFloat(currentAccountLimit) + parseFloat(amount), referralsCount: 0, hasPaid: false } }
          );
        }

        // Fetch the referredBy user's balance after potential update
        const updatedAccountLimitDoc = await User.findOne({ userId: referredByUserId });

        try {
          // Fetch the user's document
          const currentUserDoc = await User.findOne({ userId: userId });
  
          if (!currentUserDoc) {
            throw new Error('User data not found.');
          }
  
          const currentUserAccountLimit = currentUserDoc.accountLimit;
          const isCurrentAccountActive = currentUserDoc.isUserActive;
          const currentUserReferralsCount = currentUserDoc.referralsCount;
          const currentUserPaid = currentUserDoc.hasPaid;
  
          const amount = currentUserDoc.reserveAccountLimit;
  
          // Check if the user has three referrals and isCurrentAccountActive
          if (currentUserReferralsCount >= 3 && isCurrentAccountActive && currentUserPaid) {
            await User.updateOne(
              { userId: userId },
              { $set: { accountLimit: parseFloat(currentUserAccountLimit) + parseFloat(amount), referralsCount: 0, hasPaid: false } }
            );
          }
  
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        }

        if (!updatedAccountLimitDoc) {
          throw new Error('ReferredBy user data not found after update.');
        }

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      try {
        // Fetch the user's document
        const currentUserDoc = await User.findOne({ userId: userId });

        if (!currentUserDoc) {
          throw new Error('User data not found.');
        }

        const currentUserAccountLimit = currentUserDoc.accountLimit;
        const isCurrentAccountActive = currentUserDoc.isUserActive;
        const currentUserReferralsCount = currentUserDoc.referralsCount;
        const currentUserPaid = currentUserDoc.hasPaid;

        const amount = currentUserDoc.reserveAccountLimit;

        // Check if the user has three referrals and isCurrentAccountActive
        if (currentUserReferralsCount >= 3 && isCurrentAccountActive && currentUserPaid) {
          await User.updateOne(
            { userId: userId },
            { $set: { accountLimit: parseFloat(currentUserAccountLimit) + parseFloat(amount), referralsCount: 0, hasPaid: false } }
          );
        }

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }

    res.status(200).json({ message: 'Account limit updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// update user data
router.post("/updateInfo", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
      // Example 1: Updating user's balance
      // await User.updateOne(
      //   { userId: userId },
      //   { $set: { balance: newBalance } }
      // );
      
      // Example 2: Incrementing referredUsers field
      if(doesDataExist){
        await User.updateOne(
          { userId: userId },
          { $inc: { referredUsers: 1, weeklyReferrals: 1 } }
      );
      
    
        response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{

      }
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

// update user balance
router.post("/updateBalance", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
  const newBalance = userDetails.balance;
  const dailyDropBalance = userDetails.dailyDropBalance;
  const accountLimit = userDetails.accountLimit;
  const lastLogin = userDetails.lastLogin;
  const firstLogin = userDetails.firstLogin;
  const weeklyEarnings = userDetails.weeklyEarnings;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
      // Example 1: Updating user's balance
      
  
      // Example 2: Incrementing referredUsers field
      if(doesDataExist){
        await User.updateOne(
          { userId: userId },
          { $set: { balance: newBalance,
          dailyDropBalance,
          accountLimit,
          lastLogin,
          firstLogin },
          $inc: { weeklyEarnings: weeklyEarnings}  },
           
        );
    
        response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{
        response.send({"status": "failed",})
      }
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

// UPDATE INFO AFTER PAY
// update user data
router.post("/updateInfoAfterPay", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
  const deposit = userDetails.deposit;
  const dailyDropBalance = userDetails.dailyDropBalance;
  const referralsBalance = userDetails.referralsBalance;
  const addAmount = userDetails.addAmount;
  const amountToAdd = userDetails.amountToAdd;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
  
        if(doesDataExist){
          await User.updateOne(
            { userId: userId },
            { $set: { deposit,
              isUserActive: true,
              dailyDropBalance,
              referralRedeemed: true,
              referralsBalance,
              hasPaid: true },
              $inc: { weeklyEarnings: referralsBalance } }
          );
          response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{
        response.send({"status": "failed",})
      }
     
      
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

// UPDATE BALANCE AFTER TASK

// 


//DEBIT USER AFTER WITHDRAWAL
// updating user details after withdrawal
// update user data
router.post("/updateOnDebit", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
  const adRevenue = userDetails.adRevenue;
  const referralsBalance = userDetails.referralsBalance;
  const dailyDropBalance = userDetails.dailyDropBalance;
  const accountLimit = userDetails.accountLimit;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
   
  
      // Example 2: Incrementing referredUsers field
      if(doesDataExist){
          await User.updateOne(
            { userId: userId },
            { $set: { adRevenue,
              referralsBalance,
              dailyDropBalance,
              accountLimit},
              $inc: { weeklyEarnings: referralsBalance } }
          );
        
    
        response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{
        response.send({"status": "failed",})
      }
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

// UPDATE ON ADCLICK
router.post("/updateOnClick", async (request, response) => {
  const userDetails = new User(request.body);
  const userId = userDetails.userId;
  const newAdBalance = userDetails.newAdBalance;
 
  try {
    const doesDataExist = await User.findOne({ userId: userId});
    try {
   
      // Example 2: Incrementing referredUsers field
      if(doesDataExist){
        const userRole = doesDataExist.role;
        const adReward = userRole === 'crypto' ? 0.05 : 1.0;
          await User.updateOne(
            { userId: userId },
            { $set: {adRevenue: newAdBalance},
              $inc: {adsClicked: 1, weeklyEarnings: adReward } }
          );
        
    
        response.send({"status": "successful", "referrerData" : doesDataExist})
      }
      else{
        response.send({"status": "failed",})
      }
      
    } catch (error) {
      response.send(error);
    }
    
  } catch (error) {
    response.status(500).send(error);
  }
});

// CREDIT REFERRER AFTER PAY
router.post("/creditReferrer", async (request, response) => {
  const userDetails = request.body;
  const userId = userDetails.userId;
  const referralsCount = userDetails.referralsCount;
  const totalReferrals = userDetails.totalReferrals;
  const balance = userDetails.balance;
  const referralsBalance = userDetails.referralsBalance;

  try {
    const referredByUser = await User.findOne({ userId: userId });
    const referredByUserRole = referredByUser ? referredByUser.role : null;
    const referredByUserTotalReferrals = referredByUser ? referredByUser.totalReferrals : null;

    // Example 2: Incrementing referredUsers field
    if (referredByUser) {
        let commissionRate = 0.17; // Default commission rate for tier 0
        if (referredByUserTotalReferrals !== null) {
        if (referredByUserTotalReferrals >= 9) commissionRate = 0.3;
        else if (referredByUserTotalReferrals >= 6) commissionRate = 0.25;
        else if (referredByUserTotalReferrals >= 3) commissionRate = 0.20;
      }
      const commission = commissionRate * (referredByUserRole === 'crypto' ? 2 : 3000);
  
      const revenueAdd = referredByUserRole === 'crypto' ? 2 : 1333;

       // Update referrer's commission
       await User.updateOne(
        { userId: userId },
        {
          $inc: { referralsCount: 1, totalReferrals: 1, referralsBalance: commission, referredUsers: -1, weeklyEarnings: commission, reserveAccountLimit: revenueAdd, dailyDropBalance: 2000}
        }
      );

      response.send({ status: "successful", referrerData: referredByUser });

    } else {
      response.send({ status: "failed" });
    }
  } catch (error) {
    response.status(500).send(error);
  }
});

// end of update user data

router.get("/userExists/:userIdentification", async (request, response) => {
  try {
    const userId = request.params.userIdentification;
    const userExists = await User.findOne({ userId: userId });

    if(userExists){
      response.send({status: true, data: userExists})
    }
    else{
      response.send({status: false})
    }
  } catch (error) {
    response.status(500).send(error);
  }
});


// check referral code
router.get("/checkUserReferral/:userReferral", async (request, response) => { 
  try {
    const userReferralCode = request.params.userReferral;
    const referrerExists = await User.findOne({ referralCode: userReferralCode});

    if(referrerExists){
      response.send({"referrerInfo": referrerExists,
      "status": "true",
    })
    }
    else{
      response.send({"status": "false"})
    }
  } catch (error) {
    response.status(500).send(error);
  }
});
// end of check referral code

router.get("/userDetail/:userId", async (request, response) => { 
  try {
    const userId = request.params.userId;
    const user = await User.findOne({ userId: userId});

    response.send(user);
  } catch (error) {
    response.status(500).send(error);
  }
});

// transactions backend
// create TX

// Define a Mongoose schema for transactions
const transactionSchema = new mongoose.Schema({
  transactionReference: String,
  email: String,
  amount: Number,
  userID: String,
  status: String,
  timestamp: Date,
  transactionType: String,
  paymentID: String
});

// Create a model based on the schema
const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

// Define a route to handle transaction creation
router.post('/createTransactions', async (request, response) => {
  try {
    const txDetails = request.body;

    // Create a new transaction document
    const newTransaction = new Transaction(txDetails);

    // Save the transaction to the MongoDB collection
    await newTransaction.save();

    response.status(201).json({ message: 'Transaction document written' });
  } catch (error) {
    console.error('Error adding transaction document: ', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET USER TRANSACTIONS
// Define a route to get user transactions
router.get('/getUserTransactions', async (request, response) => {
  const { userID } = request.query;

  try {
    // Create a query to filter transactions by the user's ID
    const userTransactions = await Transaction.find({ userID });

    response.status(200).json(userTransactions);
  } catch (error) {
    console.error('Error fetching user transactions: ', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});



// fetching daily tasks
// Define your MongoDB schema
const dailyTaskSchema = new mongoose.Schema({
  taskID: String,
  description: String,
  reward: Number,
  // other fields in your schema
});

const DailyTask = mongoose.model('dailytasks', dailyTaskSchema);

// save tasks

// Save daily task
router.post('/saveTasks', async (req, res) => {
  try {
    const { taskID } = req.body;

    // Check if task with the same ID already exists
    let existingTask = await DailyTask.findOne({ taskID });

    if (existingTask) {
      // Update existing task
      existingTask = await DailyTask.findOneAndUpdate({ taskID }, req.body, { new: true });
      return res.json({ message: 'Task updated successfully', task: existingTask });
    }
    else{
      const newTask = new DailyTask(req.body);
      await newTask.save();
      res.json({ message: 'Task created successfully', task: newTask });
    }

    // Create new task
    
  } catch (error) {
    console.error('Error saving task:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// Your API endpoint to fetch and set the task
router.get('/tasks/:taskID', async (request, response) => {
  try {
    const { taskID } = request.params;

    // Fetch data from MongoDB based on taskID
    const task = await DailyTask.findOne({ taskID: taskID });

    // If task is found, set it
    if (task) {
      response.json({ success: true, "task": task });
    } else {
      response.status(404).json({ success: false, message: `Task not found ` });
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// FETCH COMPLETED TASKS
// ... (Previous code)

// Define a route to fetch completed tasks
router.post('/fetchCompletedTasks', async (request, response) => {
  const { userUid} = request.body;

  try {
    const user = await User.findOne({ userId: userUid });

    if (!user) {
      console.error('User not found');
      return response.status(404).json({ error: 'User not found' });
    }

    const completedTaskIds = user.completedTasks;
    response.status(200).json(completedTaskIds);
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

// ... (Remaining code)

// FETCHING ACTIVE TASKS
// 

const activeTaskSchema = new mongoose.Schema({
  taskID: String,
  description: String,
  reward: Number,
  // Other task data as needed
});

const ActiveTask = mongoose.model('activetasks', activeTaskSchema);

router.post('/activeTasks', async (req, res) => {
  try {
    const { taskID } = req.body;

    // Fetch data from MongoDB based on taskID
    const activeTask = await ActiveTask.findOne({ taskID: taskID });

    if (activeTask) {
      res.json({ success: true, activeTask: activeTask });
    } else {
      res.status(404).json({ success: false, message: `Task not found` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// 



const taskSchema = new mongoose.Schema({
  userId: String,
  taskId: String,
  pending: Boolean,
  confirmed: Boolean,
  declined: Boolean,
  imageSrc: String,
  description: String,
  // other task fields...
});

const Task = mongoose.model('pendingtasks', taskSchema);// fetch pending tasks

router.post('/addTaskForUser', async (req, res) => {
  const { userID, imageSrc, taskID, description } = req.body;
  const taskId = taskID; // Replace with the actual taskId

  try {
    // Add a new task to the 'pendingTasks' collection
    await addNewTaskToPendingTasks(userID, taskId, imageSrc, description);

    // Reload the page after 5 seconds
    setTimeout(() => {
      res.status(200).json({ message: 'Task added successfully' });
    }, 5000);
  } catch (error) {
    console.error('Error adding task for user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function addNewTaskToPendingTasks(userID, taskId, imageSrc, description) {
  // Add a new task to the 'pendingTasks' collection
  const newTask = new Task({
    userId: userID,
    taskId: taskId,
    confirmed: false,
    declined: false,
    pending: true,
    imageSrc: imageSrc,
    description,
    // Other task data as needed
  });

  await newTask.save(); // Save to the 'pendingTasks' collection
}

// CHECK IF TASK EXISTS IN THE PENDING TASKS COLLECTION
router.post('/checkTaskInPendingTasks', async (req, res) => {
  const { taskID, userID } = req.body;

  try {
    // Assume you have a "pendingTasks" collection with a schema similar to "activeTasks"
    const pendingTask = await Task.findOne({ taskId: taskID, userId: userID });

    if (pendingTask) {
      if (pendingTask.pending) {
        // Move task to completed array

        res.json({ isTaskInPendingTasks: true, isConfirmed: true});

      } else {
        res.json({ isTaskInPendingTasks: false, isConfirmed: false });

      }
    } else {
      res.json({ isTaskInPendingTasks: false, isConfirmed: false });
    }
  } catch (error) {
    console.error('Error checking pending tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CHECK CONFIRMED TASK
router.post('/checkTaskIsConfirmed', async (req, res) => {
  const { taskID, userID } = req.body;

  try {
    // Assume you have a "pendingTasks" collection with a schema similar to "activeTasks"
    const pendingTask = await Task.findOne({ taskId: taskID, userId: userID });

    if (pendingTask) {
      if (pendingTask.confirmed) {
        // Move task to completed array

        // Assume you have a "users" collection with a schema similar to your previous examples
        const user = await User.findOneAndUpdate(
          { userId: userID },
          { $push: { completedTasks: taskID } },
          { new: true }
        );

        res.json({ isTaskInPendingTasks: true, isConfirmed: true, user });

      } else {
        res.json({ isTaskInPendingTasks: true, isConfirmed: false });

      }
    } else {
      res.json({ isTaskInPendingTasks: false, isConfirmed: false });
  
    }
  } catch (error) {
    console.error('Error checking pending tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// DECLINED TASK CHECK
router.post('/checkDeclinedTasks', async (req, res) => {
  const { taskID, userID } = req.body;

  try {
    // Assume you have a "pendingTasks" collection with a schema similar to "activeTasks"
    const pendingTask = await Task.findOne({ taskId: taskID, userId: userID });

    if (pendingTask) {
      if (pendingTask.declined) {
        // Move task to completed array
        await Task.deleteOne({ taskId: taskID, userId: userID });


        res.json({ isTaskInPendingTasks: true, isDeclined: true});
      } else {
        res.json({ isTaskInPendingTasks: true, isDeclined: false });
      }
    } else {
      res.json({ isTaskInPendingTasks: false, isConfirmed: false });

    }
  } catch (error) {
    console.error('Error checking pending tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CHECK IF TASKS EXIST IN COMPLETED TASKS ARRAY
router.post('/checkTaskInCompletedTasks', async (req, res) => {
  const { taskID, userID } = req.body;

  try {
    const user = await User.findOne({ userId: userID });

    if (user && user.completedTasks && user.completedTasks.includes(taskID)) {
      // Task is confirmed in completedTasks array
      res.json({ isTaskConfirmed: true });
    } else {
      // Task is not confirmed
      res.json({ isTaskConfirmed: false });
    }
  } catch (error) {
    console.error('Error checking completed tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// COMPLETE TASK
// Define a route to mark a task as completed
router.post('/markTaskAsCompleted', async (req, res) => {
  const { userUid, taskID } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: userUid },
      { $addToSet: { completedTasks: taskID } },
      { new: true }
    );

    if (!updatedUser) {
      console.error('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: `Task ${taskID} marked as completed for user ${userUid}` });
  } catch (error) {
    console.error('Error marking task as completed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const updateBonus = async (userId, reward, taskID) => {
  // Your bonus update logic here...
  const doesDataExist = await User.findOne({ userId: userId});
  
  if (doesDataExist) {
    await User.updateOne(
      { userId: userId },
      { $inc: {
          referralsBalance: reward,
          weeklyEarnings: reward // Increment by 1 or change as needed
        },
      }
    );

    await Task.deleteOne({ userId, taskId: taskID });
         
  }
  // Simulate a response for testing
  return { success: true };
};

router.post('/updateBonusAfterTask', async (req, res) => {
  const {
    userID,
    userRole,
    activeTaskOne,
    activeTaskTwo,
    activeTaskThree,
    activeTaskFour,
    activeTaskFive,
    isTaskActuallyConfirmed,
    isTaskActuallyConfirmedTwo,
    isTaskActuallyConfirmedThree,
    isTaskActuallyConfirmedFour,
    isTaskActuallyConfirmedFive,
    isTaskDeclined,
    isTaskDeclinedTwo,
    isTaskDeclinedThree,
    isTaskDeclinedFour,
    isTaskDeclinedFive,
  } = req.body;

  if (
    (activeTaskOne ||
      activeTaskTwo ||
      activeTaskThree ||
      activeTaskFour ||
      activeTaskFive) &&
    (isTaskActuallyConfirmed ||
      isTaskActuallyConfirmedTwo ||
      isTaskActuallyConfirmedThree ||
      isTaskActuallyConfirmedFour ||
      isTaskActuallyConfirmedFive)
  ) {
    try {
      // task one confirmed
      if (isTaskActuallyConfirmed && activeTaskOne) {
        if(userRole === 'crypto'){
          await updateBonus(userID, activeTaskOne.reward / 150, activeTaskOne.taskID);
        }
        else{
          await updateBonus(userID, activeTaskOne.reward, activeTaskOne.taskID);
        }
      }

      // task two confirmed
      if (isTaskActuallyConfirmedTwo && activeTaskTwo) {
        if(userRole === 'crypto'){
          await updateBonus(userID, activeTaskTwo.reward / 150, activeTaskTwo.taskID);
        }
        else{
          await updateBonus(userID, activeTaskTwo.reward, activeTaskTwo.taskID);
        }
      }

      // task three confirmed
      if (isTaskActuallyConfirmedThree && activeTaskThree) {
        if(userRole === 'crypto'){
          await updateBonus(userID, activeTaskThree.reward / 150, activeTaskThree.taskID);
        }
        else{
          await updateBonus(userID, activeTaskThree.reward, activeTaskThree.taskID);
        }
      }

      // task four confirmed
      if (isTaskActuallyConfirmedFour && activeTaskFour) {
        if(userRole === 'crypto'){
          await updateBonus(userID, activeTaskFour.reward / 150, activeTaskFour.taskID);
        }
        else{
          await updateBonus(userID, activeTaskFour.reward, activeTaskFour.taskID);
        }
      }

      // task five confirmed
      if (isTaskActuallyConfirmedFive && activeTaskFive) {
        if(userRole === 'crypto'){
          await updateBonus(userID, activeTaskFive.reward / 150, activeTaskFive.taskID);
        }
        else{
          await updateBonus(userID, activeTaskFive.reward, activeTaskFive.taskID);
        }
      }

      // Notify success
      res.json({ success: true, message: 'Task Completed!' });
    } catch (error) {
      console.error('Error updating bonus:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else if (
    isTaskDeclined ||
    isTaskDeclinedTwo ||
    isTaskDeclinedThree ||
    isTaskDeclinedFour ||
    isTaskDeclinedFive
  ) {
    // Notify failure
    res.json({ success: false, message: 'Task Failed!' });
  } else {
    // No conditions met
    res.json({ success: false, message: 'No matching conditions' });
  }
});
// APPROVE TASK UI BACKEND
// fetch tasks
// Fetch all tasks
router.get('/getTasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// get pending deposits and transactions
router.get('/getBtcDeposits', async (req, res) => {
  try {
    const btcDeposits = await PaymentCallback.find({order_description: 'Crypto Deposit'});
    res.json(btcDeposits);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// handling crypto account activation
router.put('/updatePaymentStatusAndDelete/:transactionId', async (request, response) => {
  try {
    const { transactionId } = request.params;
    const { newStatus, userId } = request.body;

    // Update payment status in the database
    await Transaction.findOneAndUpdate(
      { paymentID: transactionId},
      { status: newStatus },
      { new: true }
    );

    if(newStatus === 'success'){
      const currentUser = await User.findOne({ userId });
      const currentUserReferrerId = currentUser.referredBy;
      const currentUserReferrer = await User.findOne({ userId: currentUserReferrerId });
      
  
      const currentUserIsActive = currentUser.isUserActive;
      const currentUserReferralRedeemed = currentUser.referralRedeemed;
      const currentUserReferrerTotalReferrals = currentUserReferrer ? currentUserReferrer.totalReferrals : null;
  
  
      // Check if the referral commission has been redeemed
      if (!currentUserReferralRedeemed && currentUserReferrerId !== 'none') {
        // Calculate commission based on referral tier
        let commissionRate = 0.17; // Default commission rate for tier 0
        if (currentUserReferrerTotalReferrals !== null) {
          if (currentUserReferrerTotalReferrals >= 9) commissionRate = 0.3;
          else if (currentUserReferrerTotalReferrals >= 6) commissionRate = 0.25;
          else if (currentUserReferrerTotalReferrals >= 3) commissionRate = 0.20;
        }
        // note that this commission is coming from a crypto account
        const commission = commissionRate * (currentUserReferrer.role === 'crypto' ? 20 : 14000);
        const revenueAdd = currentUserReferrer.role === 'crypto' ? 2 : 1333;
  
        // Update referrer's commission
        await User.updateOne(
          { userId: currentUserReferrerId },
          {
            $inc: { referralsCount: 1, totalReferrals: 1, referralsBalance: commission, referredUsers: -1, weeklyEarnings: commission, reserveAccountLimit: revenueAdd, dailyDropBalance: 15 }
          }
        );
      }
  
      // Update current user's account balance
      
      if (!currentUserIsActive) {
        // Update user's balance after account activation
        await User.updateOne(
          { userId },
          {
            $set: { isUserActive: true, referralRedeemed: true, hasPaid: true },
            $inc: { deposit: 20, dailyDropBalance: 10 }
          }
        );
      } else {
        // Update user's balance after account activation (without dailyDropBalance increment)
        await User.updateOne(
          { userId },
          {
            $set: { isUserActive: true, referralRedeemed: true, hasPaid: true },
            $inc: { deposit: 20 }
          }
        );
      }
  
    }
    // Delete the document
    await PaymentCallback.deleteOne({ payment_id : transactionId });

    response.sendStatus(200); // Respond with success status
  } catch (error) {
    console.error('Error updating payment status and deleting document:', error);
    response.status(500).send('Error updating payment status and deleting document');
  }
});



// Task acceptance endpoint
router.post('/acceptTask', async (req, res) => {
  const {taskId, description, userId} = req.body;

  try {
    const taskExists = await Task.findOne({ taskId, description, userId });
    // Implement logic to update the task status to 'confirmed' in your database
    // ...
    if(taskExists){
      const user = await Task.findOneAndUpdate(
        { description, taskId, userId },
        { confirmed: true,
          declined: false }
      );
  
      // Send a response indicating success
      res.json({ status: 'success', user });
    }
    else{
      res.json({status: 'failed'})
    }

  } catch (error) {
    console.error('Error accepting task:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// Task decline endpoint
router.post('/declineTask/', async (req, res) => {
  const {taskId, description, userId} = req.body;

  try {
    const taskExists = await Task.findOne({ taskId, description, userId });
    // Implement logic to update the task status to 'confirmed' in your database
    // ...
    if(taskExists){
      const user = await Task.findOneAndUpdate(
        { description, taskId, userId },
        { declined: true,
          confirmed: false }
      );
  
      // Send a response indicating success
      res.json({ status: 'success', user });
    }
    else{
      res.json({status: 'failed'})
    }

  } catch (error) {
    console.error('Error declining task:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});
// 
// 
// GET BTC FUNDING TX
// get pending deposits and transactions
router.get('/getBtcFundings', async (req, res) => {
  try {
    const btcDeposits = await PaymentCallback.find({order_description: 'Crypto Fund'});
    res.json(btcDeposits);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// handling crypto account activation
router.put('/updateUserBalance/:transactionId', async (request, response) => {
  try {
    const { transactionId } = request.params;
    const { newStatus, userId, price_amount } = request.body;

    // Update payment status in the database
    await Transaction.findOneAndUpdate(
      { paymentID: transactionId},
      { status: newStatus },
      { new: true }
    );

    // Update current user's account balance
      if(newStatus === 'success'){
        await User.updateOne(
          { userId },
          {
            $inc: { referralsBalance: price_amount, weeklyReferrals: price_amount }
          }
        );
      }
      

    // Delete the document
    await PaymentCallback.deleteOne({ payment_id : transactionId });

    response.sendStatus(200); // Respond with success status
  } catch (error) {
    console.error('Error updating user balance and deleting document:', error);
    response.status(500).send('Error updating user balance and deleting document');
  }
});


// // GET BTC WITHDRAWAL TX
// get pending deposits and transactions
router.get('/getBtcWithdrawals', async (req, res) => {
  try {
    const btcDeposits = await PaymentCallback.find({order_description: 'Crypto Withdrawal'});
    res.json(btcDeposits);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// handling crypto account activation
router.put('/updateUserWithdrawal/:transactionId', async (request, response) => {
  try {
    const { transactionId } = request.params;
    const { newStatus, userId, price_amount } = request.body;

    // Update payment status in the database
    await Transaction.findOneAndUpdate(
      { paymentID: transactionId},
      { status: newStatus },
      { new: true }
    );

    // Update current user's account balance
      if(newStatus === 'success'){
        await User.updateOne(
          { userId },
          {
            $inc: { referralsBalance: -price_amount }
          }
        );
      }
      

    // Delete the document
    await PaymentCallback.deleteOne({ payment_id : transactionId });

    response.sendStatus(200); // Respond with success status
  } catch (error) {
    console.error('Error updating user balance and deleting document:', error);
    response.status(500).send('Error updating user balance and deleting document');
  }
});

// ...
router.delete("/userDetail", async (request, response) => { 
  try {
    const users = await User.findByIdAndDelete('id');
    response.send(users);
  } catch (error) {
    response.status(500).send(error);
  }
});




module.exports = router;
