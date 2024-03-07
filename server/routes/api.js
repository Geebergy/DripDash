// my-app/server/routes/api.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../model');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://TheGilo:Gilo1411@dripdashcluster.khr3xz4.mongodb.net/userData?retryWrites=true&w=majority&appName=DripDashCluster";

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {

    
    console.error('Error connecting to MongoDB', error);
  }
}

connectToMongoDB();

// Sample endpoint to fetch data
router.get('/getData', async (req, res) => {
  // const db = client.db('userTest');
  // const collection = db.collection('people');
  
  // try {
  //   const data = await collection.find({}).toArray();
  //   res.json(data);
  //   console.log(`this is the user data: ${res.json(data)}`)
  // } catch (error) {
  //   console.error('Error fetching data', error);
  //   res.status(500).json({ error: 'Internal Server Error' });
  // }
  res.send('user data')
});

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

        const amount = 4500;

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
  
          const amount = 4500;
  
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

        const amount = 4500;

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
          { $inc: { referredUsers: 1 } }
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
          accountLimit } }
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
              hasPaid: true,} }
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
              accountLimit} }
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
    const doesDataExist = await User.findOne({ userId: userId });

    // Example 2: Incrementing referredUsers field
    if (doesDataExist) {
      await User.updateOne(
        { userId: userId },
        {
          $set: {
            balance,
            referralsCount,
            totalReferrals,
            referralsBalance,
          },
          $inc: { referredUsers: -1 }, // Decrement referredUsers by 1
        }
      );

      response.send({ status: "successful", referrerData: doesDataExist });
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

const updateBonus = async (userId, reward, taskID) => {
  // Your bonus update logic here...
  const doesDataExist = await User.findOne({ userId: userId});
  
  if (doesDataExist) {
    await User.updateOne(
      { userId: userId },
      { $inc: {
          referralsBalance: reward, // Increment by 1 or change as needed
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
        await updateBonus(userID, activeTaskOne.reward, activeTaskOne.taskID);
      }

      // task two confirmed
      if (isTaskActuallyConfirmedTwo && activeTaskTwo) {
        await updateBonus(userID, activeTaskTwo.reward, activeTaskTwo.taskID);
      }

      // task three confirmed
      if (isTaskActuallyConfirmedThree && activeTaskThree) {
        await updateBonus(userID, activeTaskThree.reward, activeTaskThree.taskID);
      }

      // task four confirmed
      if (isTaskActuallyConfirmedFour && activeTaskFour) {
        await updateBonus(userID, activeTaskFour.reward, activeTaskFour.taskID);
      }

      // task five confirmed
      if (isTaskActuallyConfirmedFive && activeTaskFive) {
        await updateBonus(userID, activeTaskFive.reward, activeTaskFive.taskID);
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
router.delete("/userDetail", async (request, response) => { 
  try {
    const users = await User.findByIdAndDelete('id');
    response.send(users);
  } catch (error) {
    response.status(500).send(error);
  }
});




module.exports = router;
