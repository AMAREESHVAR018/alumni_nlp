const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { emitToUser } = require("../socket");

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate("participants", "name email profilePicture role")
    .populate({
      path: "lastMessage",
      populate: { path: "senderId", select: "name email profilePicture" }
    })
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/chat/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    // ObjectId vs string: use .toString() comparison
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: "Not authorized to view these messages" });
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate("senderId", "name email profilePicture")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversationId })
    ]);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !text) {
      return res.status(400).json({ success: false, message: "Receiver ID and text are required" });
    }
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      content: text
    });

    // Populate sender info for response and real-time delivery
    await newMessage.populate("senderId", "name email profilePicture");

    // Update last message
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Emit only to the intended receiver — NOT to all connected clients
    emitToUser(receiverId, "receive_message", newMessage);

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages in a conversation as read
// @route   PUT /api/chat/:conversationId/read
// @access  Private
exports.markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is a participant before marking messages
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Mark all unread messages sent TO this user as seen
    await Message.updateMany(
      { conversationId, receiverId: userId, seen: false },
      { $set: { seen: true } }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};
