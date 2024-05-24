import Message from "../models/Message.js";
const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji, user } = req.body;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.reactions.push({ emoji, user });
        await message.save();

        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { addReaction };
