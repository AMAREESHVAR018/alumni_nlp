const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Question = require("../models/Question");
const { emitToUser } = require("../socket");
const { findSimilarQuestions } = require("../services/nlpService");
const { NLP_CONFIG } = require("../constants");
const logger = require("../utils/logger");

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

// @desc    Send a message (with NLP auto-reply for student queries)
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

    // Save the student/user message
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId,
      content: text,
      isAIResponse: false
    });

    await newMessage.populate("senderId", "name email profilePicture");

    // Update last message
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Emit to the intended receiver
    emitToUser(receiverId, "receive_message", newMessage);

    // --- NLP Knowledge Base Check (only for student senders) ---
    let aiMessage = null;
    const sender = await User.findById(senderId).select("role");

    if (sender?.role === "student") {
      try {
        // Fetch answered questions from knowledge base
        const answeredQuestions = await Question.find({
          isAnswered: true,
          answer_text: { $exists: true, $ne: null }
        })
          .select("question_text answer_text answered_by")
          .lean()
          .limit(500);

        if (answeredQuestions.length > 0) {
          const questionTexts = answeredQuestions.map(q => q.question_text);
          const result = await findSimilarQuestions(text, questionTexts, NLP_CONFIG.SIMILARITY_THRESHOLD);

          if (result.best_match && result.best_match.score >= NLP_CONFIG.SIMILARITY_THRESHOLD) {
            const matched = answeredQuestions[result.best_match.index];
            const score = result.best_match.score;

            logger.info(
              `[CHAT NLP] Auto-reply triggered. Score=${score.toFixed(3)} | Query="${text.substring(0, 60)}..."`
            );

            // Create AI response message — appears from the alumni side but flagged as AI-generated
            aiMessage = await Message.create({
              conversationId: conversation._id,
              senderId: receiverId,
              receiverId: senderId,
              content: matched.answer_text,
              isAIResponse: true
            });

            await aiMessage.populate("senderId", "name email profilePicture");

            // Update conversation to show AI reply as the latest message
            conversation.lastMessage = aiMessage._id;
            await conversation.save();

            // Deliver AI reply to the student
            emitToUser(senderId, "receive_message", aiMessage);
          }
        }
      } catch (nlpError) {
        // NLP failures are non-critical — chat still works without auto-reply
        logger.warn(`[CHAT NLP] Knowledge base check failed (non-critical): ${nlpError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      data: newMessage,
      aiResponse: aiMessage || null
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

    // Mark all unread messages sent TO this user as read
    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};
