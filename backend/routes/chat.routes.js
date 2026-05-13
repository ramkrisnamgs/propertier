import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { deleteChat, deleteMessage, getChat, getChatMessages, sendMessage, startChat } from '../controllers/chat.controller.js';

const chatRouter = express.Router();

chatRouter.use(protect)

// start message
chatRouter.post("/", startChat)

// Send message
chatRouter.post("/send", sendMessage)

// Get chats for user
chatRouter.get("/user", getChat)

// Get chat messages
chatRouter.get("/:chatId", getChatMessages)

// Delete an entire chat
chatRouter.delete("/:chatId", deleteChat)

// Delete a specific message
chatRouter.delete("/:chatId/message/:messageId", deleteMessage)

export default chatRouter;