import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

const app = express();
const port = 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.id} left conversation ${conversationId}`);
    });

    socket.on('typing', ({ conversationId, user }) => {
        console.log(`${user} is typing in conversation ${conversationId}`);
        socket.to(conversationId).emit('typing', user);
    });

    socket.on('stopTyping', ({ conversationId, user }) => {
        console.log(`${user} stopped typing in conversation ${conversationId}`);
        socket.to(conversationId).emit('stopTyping', user);
    });

    // Inside the existing io.on('connection', ...) block
    socket.on('reaction', async ({ conversationId, messageId, reaction }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.reactions = message.reactions || [];
                message.reactions.push(reaction);
                await message.save();
                io.to(conversationId).emit('reaction', { messageId, reaction });
            }
        } catch (err) {
            console.error('Error handling reaction:', err);
        }
    });
});


app.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.get('/conversations', async (req, res) => {
    const userId = req.query.userId; // Assuming user ID is sent as a query parameter

    try {
        const conversations = await Conversation.find({ participants: userId })
            .populate('participants')
            .populate('lastMessage');
        res.json(conversations);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.get('/api/conversations/:conversationId/messages', async (req, res) => {
    const { conversationId } = req.params;
    try {
        const messages = await Message.find({ conversationId });
        res.json(messages);
    } catch (error) {
        res.status(404).json({ error: 'Messages not found' });
    }
});

app.post('/api/conversations/:conversationId/read', async (req, res) => {
    const { conversationId } = req.params;
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        conversation.unreadCounts.set(user._id.toString(), 0);
        await conversation.save();
        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/messages', async (req, res) => {
    console.log('Received POST /api/messages');
    const { conversationId, sender, text } = req.body;
    try {
        const senderUser = await User.findById(sender._id);
        if (!senderUser) {
            return res.status(404).json({ error: 'Sender not found' });
        }
        const newMessage = new Message({
            conversationId,
            sender: sender._id,
            text
        });
        const savedMessage = await newMessage.save();
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: savedMessage._id,
            lastMessageAt: savedMessage.timestamp
        });
        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/messages/:id', async (req, res) => {
    try {
        const { text } = req.body;
        const updatedMessage = await Message.findByIdAndUpdate(req.params.id, { text }, { new: true }).populate('sender');

        // Broadcast the edited message
        io.to(updatedMessage.conversationId.toString()).emit('editMessage', updatedMessage);

        res.json(updatedMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/messages/:id', async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        // Broadcast the deleted message
        io.to(message.conversationId.toString()).emit('deleteMessage', message._id);

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/conversations', async (req, res) => {
    try {
        const { participants } = req.body;
        const unreadCounts = {};
        participants.forEach(participant => {
            unreadCounts[participant] = 0;
        });

        const conversation = new Conversation({ participants, unreadCounts });
        await conversation.save();
        res.status(201).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages/:messageId/reactions', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji, user } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            console.log(`Message with ID ${messageId} not found`);

            return res.status(404).send({ error: 'Message not found' });
        }

        message.reactions.push({ emoji, user });
        await message.save();

        res.status(200).send(message);
    } catch (error) {
        console.error('Error adding reaction:', error);

        res.status(500).send({ error: 'Failed to add reaction' });
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
