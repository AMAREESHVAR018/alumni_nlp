const express = require("express");
const { getConversations, getMessages, sendMessage, markRead } = require("../controllers/chatController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.route("/")
  .post(sendMessage);

router.route("/conversations")
  .get(getConversations);

router.route("/:conversationId")
  .get(getMessages);

router.route("/:conversationId/read")
  .put(markRead);

module.exports = router;
