import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
    unreadCounts: { type: Map, of: Number },
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
