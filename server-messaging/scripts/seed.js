import mongoose from 'mongoose';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

const connectDb = async () => {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({});

        // Create users
        const users = [];
        for (let i = 1; i <= 10; i++) {
            const user = new User({
                name: `User${i}`,
                email: `user${i}@example.com`,
            });
            users.push(user);
        }
        await User.insertMany(users);

        // Create conversations and messages
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const conversation = new Conversation({
                    participants: [users[i]._id, users[j]._id],
                    unreadCounts: new Map([
                        [users[i]._id.toString(), 0],
                        [users[j]._id.toString(), 0]
                    ]),
                });

                await conversation.save();

                const message1 = new Message({
                    conversationId: conversation._id,
                    sender: users[i]._id,
                    text: `Hello from ${users[i].name} to ${users[j].name}`,
                    readBy: [users[i]._id],
                });

                const message2 = new Message({
                    conversationId: conversation._id,
                    sender: users[j]._id,
                    text: `Hello from ${users[j].name} to ${users[i]}.name}`,
                    readBy: [users[j]._id],
                });

                await message1.save();
                await message2.save();

                conversation.lastMessage = message2._id;
                conversation.lastMessageAt = message2.timestamp;
                conversation.unreadCounts.set(users[i]._id.toString(), 1); // Mark message2 as unread for user i
                await conversation.save();
            }
        }

        console.log('Database seeded');
        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding database:', err);
        mongoose.connection.close();
        process.exit(1); // Exit process with failure
    }
};

const runSeed = async () => {
    await connectDb();
    await seedDatabase();
};

runSeed();
