cd server

# =========================
# models/JobPost.js
# =========================
@"
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  alumni_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  company: String,
  description: String,
  skills_required: [String],
  deadline: Date
}, { timestamps: true });

module.exports = mongoose.model("JobPost", jobSchema);
"@ | Set-Content models\JobPost.js


# =========================
# routes/jobRoutes.js
# =========================
@"
const router = require("express").Router();
const auth = require("../middleware/auth");
const JobPost = require("../models/JobPost");

router.post("/", auth, async (req, res) => {
  const job = await JobPost.create({
    ...req.body,
    alumni_id: req.user.id
  });
  res.json(job);
});

router.get("/", async (req, res) => {
  const jobs = await JobPost.find().populate("alumni_id", "name email");
  res.json(jobs);
});

module.exports = router;
"@ | Set-Content routes\jobRoutes.js

cd ..

# =========================
# docker-compose.yml
# =========================
@"
version: '3.8'

services:
  mongo:
    image: mongo
    container_name: alumni_mongo
    ports:
      - "27017:27017"

  backend:
    build: ./server
    container_name: alumni_backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/alumni_chat
      - JWT_SECRET=supersecretkey
    depends_on:
      - mongo
"@ | Set-Content docker-compose.yml

Write-Host "Missing files created successfully"