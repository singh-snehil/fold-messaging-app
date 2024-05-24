import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [{
        emoji: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
