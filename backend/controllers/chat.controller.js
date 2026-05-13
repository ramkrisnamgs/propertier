import Chat from "../models/chat.model.js";

// Start chat
export const startChat = async (req, res) => {
    try {
        const { propertyId, buyerId: provideBuyerId, sellerId } = req.body;
        let buyerId, finalSellerId;

        if(req.user.role === "seller") {
            buyerId: provideBuyerId;
            finalSellerId: req.user._id
        } else {
            buyerId: req.user._id;
            finalSellerId: sellerId;
        }

        if(!buyerId || finalSellerId) return res.status(400).json({
            message: "Missing buyer or seller Id"
        });

        // check for an existing chat
        let chat = await Chat.findOne({
            buyer: buyerId,
            seller: finalSellerId
        });

        if(!chat) {
            chat = await Chat.create({
                property: propertyId,  // initial property context
                buyerId: buyerId,
                seller: finalSellerId,
                message: []
            })
        }

        chat = await Chat.findById(chat._id)
        .populate("buyer", "name email profilePic")
        .populate("seller", "name email profilePic")
        .populate("property", "title price images");

        res.json(chat);

    } catch (error) {
        res.status(500).json({
            message: "Error creating chat or getting previous one",
            error: error.message
        })
    }
}

// send message
export const sendMessage = async (req, res) => {
    try {
        const {chatId, text, image} = req.body;
        const userId = req.user.id;

        const chat = await Chat.findById(chatId);
        if(!chat) return res.status(404).json({
            message: "Chat not found!"
        });

        // ensure sender is part of this chat
        if(chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
            return res.status(403).json({
                message: "Not authorized to send messages in this chat"
            });
        }

        const newMessage = {
            sender: userId,
            text,
            image,
            createdAt: new Date()
        };
        chat.messages.push(newMessage);
        await chat.save();

        const saveMessage = chat.messages[chat.messages.length - 1];
        res.json({ chat, newMessage: saveMessage });
    } catch (error) {
        res.status(500).json({
            message: "Error sending message",
            error: error.message
        });
    }
}


// Get chats for user
export const getChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({
            $or: [{ buyer: userId }, { seller: userId }]
        })
        .populate("buyer", "name email profilePic")
        .populate("seller", "name email profilePic")
        .populate("property", "title price images")
        .sort({ updatedAt: -1 });

        res.json(chats);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user chats",
            error: error.message
        });
    }
}

// Get chat messages
export const getChatMessages = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
        .populate("message.sender", "name profilePic");

        if(!chat) return res.status(404).json({message: "Chat not found!"});
        if(chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized" });
        }

        res.json(chat);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching messages",
            error: error.message
        });
    }
}


// Delete an entire chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const chat = await Chat.findById(req.params.chatId);

        if(!chat) return res.status(404).json({ message: "Chat not found!"});

        if(chat.buyer.toString() !== userId.toString() && chat.seller.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }
        
        await Chat.findOneAndDelete(req.params.chatId);
        res.json({ message: "Chat deleted successfully!" });
    } catch (error) {
        res.status(500).json({
            message: "Error in deleting chat",
            error: error.message
        });
    }
}

// Delete a specific message
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const chat = await Chat.findById(req.params.chatId);

        if(!chat) return res.status(404).json({ message: "Chat not found!"});

        const message = chat.message.id(req.params.messageId);
        if(!message) return res.status(404).json({ message: "Message not found! "});

        // only sender can delete their message
        if(message.sender.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Not authorized to delete this message"
            });
        }

        chat.messages.pull(req.params.messageId);
        await chat.save();
        res.json({ message: "Message deleted successfully!" });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting message",
            error: error.message
        });
    }
}