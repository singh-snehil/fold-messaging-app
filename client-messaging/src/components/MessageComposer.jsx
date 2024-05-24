import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, Button } from '@mui/material';

const MessageComposer = ({ onSendMessage, onTyping, onStopTyping }) => {
    const [text, setText] = useState('');
    const typingTimeoutRef = useRef(null);

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text);
            setText('');
            clearTimeout(typingTimeoutRef.current); // Clear the timeout
            onStopTyping(); // Emit stopTyping when message is sent
        }
    };

    const handleChange = (event) => {
        setText(event.target.value);
        if (event.target.value.trim()) {
            onTyping();
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                onStopTyping();
            }, 3000); // Set the timeout for 3 seconds
        } else {
            clearTimeout(typingTimeoutRef.current);
            onStopTyping();
        }
    };

    return (
        <Box sx={{ display: 'flex', padding: 1 }}>
            <TextField
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={text}
                onChange={handleChange}
                placeholder="Type a message..."
            />
            <Button variant="contained" color="primary" onClick={handleSend}>
                Send
            </Button>
        </Box>
    );
};

MessageComposer.propTypes = {
    onSendMessage: PropTypes.func.isRequired,
    onTyping: PropTypes.func.isRequired,
    onStopTyping: PropTypes.func.isRequired,
};

export default MessageComposer;
