import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { Send, Users, Circle, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const scrollRef = useRef();

  // Initialize socket
  useEffect(() => {
    if (token) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => console.log('Connected to chat server'));

      newSocket.on('receive_message', (message) => {
        setMessages((prev) => [...prev, message]);
        // Also update last message in conversation list
        setConversations(prev => prev.map(c => 
          c._id === message.conversationId ? { ...c, lastMessage: message, updatedAt: new Date() } : c
        ));
      });

      newSocket.on('user_status', ({ userId, status }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          if (status === 'online') next.add(userId);
          else next.delete(userId);
          return next;
        });
      });

      newSocket.on('user_typing', ({ userId, conversationId }) => {
        setTypingUsers(prev => {
          const next = new Map(prev);
          // Clear existing timeout for this user
          if (next.has(userId)) clearTimeout(next.get(userId).timeout);
          const timeout = setTimeout(() => {
            setTypingUsers(m => {
              const updated = new Map(m);
              updated.delete(userId);
              return updated;
            });
          }, 3000);
          next.set(userId, { conversationId, timeout });
          return next;
        });
      });

      newSocket.on('stop_typing', ({ userId }) => {
        setTypingUsers(prev => {
          const next = new Map(prev);
          if (next.has(userId)) clearTimeout(next.get(userId).timeout);
          next.delete(userId);
          return next;
        });
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [token]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await chatAPI.getConversations();
        setConversations(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
        toast.error('Failed to load conversations');
      }
    };
    if (token) fetchConversations();
  }, [token]);

  // Fetch messages when chat selected; also join the socket room for real-time updates
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const res = await chatAPI.getMessages(selectedChat._id);
        setMessages(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch messages", err);
        toast.error('Failed to load messages');
      }
    };
    fetchMessages();

    // Join the conversation room so we receive scoped socket events
    if (socket && selectedChat) {
      socket.emit('join_conversation', { conversationId: selectedChat._id });
    }
  }, [selectedChat, token, socket]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Use _id (MongoDB) — user.id is undefined for MongoDB documents
    const receiverId = selectedChat.participants.find(p => p._id !== user._id)?._id;
    if (!receiverId) return;

    try {
      const res = await chatAPI.sendMessage({ receiverId, text: newMessage });

      const sentMsg = res.data.data;
      setMessages(prev => [...prev, sentMsg]);
      setConversations(prev => prev.map(c => 
        c._id === selectedChat._id ? { ...c, lastMessage: sentMsg, updatedAt: new Date() } : c
      ));

      // The backend already emits receive_message to the recipient via Socket.IO.
      // No need to emit send_message from here to avoid duplicate delivery.
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && selectedChat) {
      socket.emit('typing', { conversationId: selectedChat._id, userId: user._id });
    }
  };

  const getOtherUser = (conversation) => {
    return conversation.participants.find(p => p._id !== user._id);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 md:w-1/4 min-w-[300px] border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-xl font-bold font-heading">Messages</h2>
          <button className="p-2 hover:bg-muted rounded-full transition-colors"><MoreVertical size={20} className="text-muted-foreground" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {conversations && conversations.length > 0 ? conversations.map((chat) => {
            const partner = getOtherUser(chat);
            return (
              <motion.div 
                whileHover={{ backgroundColor: 'var(--muted)' }}
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-border cursor-pointer transition-colors flex items-center gap-3 ${selectedChat?._id === chat._id ? 'bg-muted' : ''}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                    {partner?.name?.charAt(0) || 'U'}
                  </div>
                  {onlineUsers.has(partner?._id) && (
                    <Circle size={12} className="absolute bottom-0 right-0 fill-green-500 text-green-500 bg-card rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-foreground truncate">{partner?.name}</h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(chat.lastMessage.createdAt), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage ? chat.lastMessage.text : 'No messages yet'}
                  </p>
                </div>
              </motion.div>
            );
          }) : (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Users size={48} className="mb-4 opacity-20" />
              <p>No conversations yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-background">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                {getOtherUser(selectedChat)?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{getOtherUser(selectedChat)?.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {onlineUsers.has(getOtherUser(selectedChat)?._id) ? 'Active now' : getOtherUser(selectedChat)?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                // Support both senderId (string) and populated sender object
                const senderId = msg.senderId?._id || msg.senderId;
                const isMe = senderId === user._id;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg._id || index}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-muted text-foreground rounded-bl-sm border border-border'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                      <span className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                        {isMe && (
                          <span title={msg.seen ? 'Read' : 'Sent'}>
                            {msg.seen ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {/* Typing Indicator */}
            {selectedChat && [...typingUsers.entries()].some(([uid, data]) => uid !== user._id && data.conversationId === selectedChat._id) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex justify-start"
              >
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-muted border border-border flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      className="w-2 h-2 rounded-full bg-muted-foreground block"
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Message..."
                className="flex-1 bg-background border border-border rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-shadow"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-primary text-primary-foreground p-3 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-background/50">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-6">
            <Send size={32} className="text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Messages</h2>
          <p className="text-muted-foreground">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default Chat;
