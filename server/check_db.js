const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function manageDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    
    // Find all users
    let users = await User.find({}).lean();
    console.log("Current Users in DB:\n" + JSON.stringify(users, null, 2));

    // Delete test users
    const deleteResult = await User.deleteMany({ email: 'jane.doe.test123@example.com' });
    console.log(`Deleted ${deleteResult.deletedCount} test users.`);

    // Find again just to be sure
    users = await User.find({}).lean();
    console.log("Remaining Users in DB:\n" + JSON.stringify(users, null, 2));

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit(0);
  }
}
manageDb();
