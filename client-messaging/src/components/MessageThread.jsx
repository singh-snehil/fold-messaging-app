import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper, TextField, IconButton, Menu, MenuItem, useTheme } from '@mui/material';
import { MoreVert, Edit, Delete, Save, Cancel, EmojiEmotions } from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';
import MessageComposer from './MessageComposer';
import Picker from "emoji-picker-react";

const socket = io('http://localhost:3000');

const MessageThread = ({ conversationId, user, fetchConversations, searchTerm }) => {
    const theme = useTheme();
    const [messages, setMessages] = useState([]);
    const [typing, setTyping] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const [selectedMessageForEmoji, setSelectedMessageForEmoji] = useState(null);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

    const isUserMessage = (message) => message.sender === user._id;

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/conversations/${conversationId}/messages`);
                setMessages(response.data);

                // Mark messages as read
                await axios.post(`http://localhost:3000/api/conversations/${conversationId}/read`, { email: user.email });
                fetchConversations();
                socket.emit('joinConversation', conversationId);
                console.log(`Joined conversation ${conversationId}`);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };


        fetchMessages();

        const handleNewMessage = (message) => {
            setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg._id === message._id)) {
                    return [...prevMessages, message];
                }
                return prevMessages;
            });
            console.log('Received new message:', message);
        };

        const handleEditMessage = (updatedMessage) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    (message._id === updatedMessage._id ? updatedMessage : message)
                )
            );
            console.log('Message edited:', updatedMessage);
        };

        const handleDeleteMessage = (messageId) => {
            setMessages((prevMessages) =>
                prevMessages.filter((message) => message._id !== messageId)
            );
            console.log('Message deleted:', messageId);
        };

        const handleTyping = (typingUser) => {
            if (typingUser !== user) {
                setTyping(typingUser);
                console.log(`${typingUser} is typing...`);
            }
        };

        const handleStopTyping = (typingUser) => {
            if (typingUser === typing) {
                setTyping(null);
                console.log(`${typingUser} stopped typing.`);
            }
        };

        const handleReaction = ({ messageId, reaction }) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    (message._id === messageId
                        ? { ...message, reactions: [...(message.reactions || []), reaction] }
                        : message)
                )
            );
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('editMessage', handleEditMessage);
        socket.on('deleteMessage', handleDeleteMessage);
        socket.on('typing', handleTyping);
        socket.on('stopTyping', handleStopTyping);
        socket.on('reaction', handleReaction);

        return () => {
            socket.emit('leaveConversation', conversationId);
            console.log(`Left conversation ${conversationId}`);
            socket.off('newMessage', handleNewMessage);
            socket.off('editMessage', handleEditMessage);
            socket.off('deleteMessage', handleDeleteMessage);
            socket.off('typing', handleTyping);
            socket.off('stopTyping', handleStopTyping);
            socket.off('reaction', handleReaction);
        };
    }, [conversationId, user, fetchConversations]);

    const handleSendMessage = async (text) => {
        try {
            console.log("inside handler:", user);
            const newMessage = {
            conversationId,
            sender: user,
            text
            };

            const response = await axios.post('http://localhost:3000/api/messages', newMessage);
            setMessages((prevMessages) => {
            if (!prevMessages.some((msg) => msg._id === response.data._id)) {
                return [...prevMessages, response.data];
            }
            return prevMessages;
            });

            socket.emit('stopTyping', { conversationId, user: user.email });
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        socket.emit('typing', { conversationId, user });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { conversationId, user });
        }, 3000); // 3 seconds of no typing to stop typing indicator
    };

    const handleStopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket.emit('stopTyping', { conversationId, user });
    };

    useEffect(() => {
        const handleTypingEvent = (typingUser) => {
            if (typingUser !== user) {
                setTyping(typingUser);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setTyping(null);
                }, 3000); // Hide typing indicator after 3 seconds of no typing
            }
        };

        socket.on('typing', handleTypingEvent);
        socket.on('stopTyping', (typingUser) => {
            if (typingUser === typing) {
                setTyping(null);
            }
        });

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            socket.off('typing', handleTypingEvent);
            socket.off('stopTyping');
        };
    }, [user, conversationId]);

    const handleEditMessage = (messageId, text) => {
        setEditingMessageId(messageId);
        setEditingText(text);
        setMenuAnchorEl(null); // Close the menu
    };

    const handleSaveEdit = async (messageId) => {
        try {
            const updatedMessage = { text: editingText };
            const response = await axios.put(`http://localhost:3000/messages/${messageId}`, updatedMessage);
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message._id === messageId ? response.data : message
                )
            );
            socket.emit('editMessage', { conversationId, message: response.data });
            setEditingMessageId(null);
            setEditingText('');
        } catch (error) {
            console.error('Error editing message:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditingText('');
    };

    const handleMenuClick = (event, messageId) => {
        setSelectedMessageId(messageId);
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`http://localhost:3000/messages/${messageId}`);
            setMessages((prevMessages) =>
                prevMessages.filter((message) => message._id !== messageId)
            );
            socket.emit('deleteMessage', { conversationId, messageId });
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const handleAddReaction = async (emoji, messageId) => {
        try {
            const reaction = { emoji, user: user._id };
            const response = await axios.post(`http://localhost:3000/api/messages/${messageId}/reactions`, reaction);
            socket.emit('reaction', { conversationId, messageId, reaction });
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };


    const handleEmojiClick = (event, emojiObject) => {
        if (selectedMessageForEmoji) {
            handleAddReaction(emojiObject.emoji, selectedMessageForEmoji);
            setSelectedMessageForEmoji(null);
            setEmojiPickerVisible(false);
        }
    };

    const groupedMessages = messages.reduce((acc, message) => {
        const date = new Date(message.timestamp).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(message);
        return acc;
    }, {});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const highlightText = (text, highlight) => {
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return <span>{parts.map((part, index) => part.toLowerCase() === highlight.toLowerCase() ? <mark key={index}>{part}</mark> : part)}</span>;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flexGrow: 1, padding: 2, overflowY: 'auto' }}>
                {Object.keys(groupedMessages).map((date) => (
                    <React.Fragment key={date}>
                        <Typography variant="h6" sx={{ margin: 2, textAlign: 'center' }}>
                            {date}
                        </Typography>
                        {groupedMessages[date].map((message) => (
                            <Box
                                key={message._id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: isUserMessage(message) ? 'flex-end' : 'flex-start',
                                    margin: 1,
                                }}
                            >
                                <Paper
                                    sx={{
                                        padding: 2,
                                        backgroundColor: isUserMessage(message) ? theme.palette.primary.main : theme.palette.grey[200],
                                        color: isUserMessage(message) ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        maxWidth: '60%',
                                        position: 'relative',
                                    }}
                                >
                                    {editingMessageId === message._id ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                fullWidth
                                            />
                                            <IconButton onClick={() => handleSaveEdit(message._id)} color="primary">
                                                <Save />
                                            </IconButton>
                                            <IconButton onClick={handleCancelEdit} color="secondary">
                                                <Cancel />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                            <Box>
                                                <Typography sx={{ marginTop: '1em'}}>{highlightText(message.text, searchTerm)}</Typography>
                                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </Typography>
                                            {isUserMessage(message) && (
                                                <>
                                                    <IconButton
                                                        onClick={(event) => handleMenuClick(event, message._id)}
                                                        size="small"
                                                        sx={{ color: 'white', position: 'absolute', top: 0, right: 0 }}
                                                    >
                                                        <MoreVert fontSize="small" />
                                                    </IconButton>
                                                    <Menu
                                                        anchorEl={menuAnchorEl}
                                                        open={Boolean(menuAnchorEl) && selectedMessageId === message._id}
                                                        onClose={handleMenuClose}
                                                    >
                                                        <MenuItem onClick={() => handleEditMessage(message._id, message.text)}>
                                                            <Edit fontSize="small" />
                                                            Edit
                                                        </MenuItem>
                                                        <MenuItem onClick={() => handleDeleteMessage(message._id)}>
                                                            <Delete fontSize="small" />
                                                            Delete
                                                        </MenuItem>
                                                    </Menu>
                                                </>
                                            )}
                                                {!isUserMessage(message) ? (
                                                    <IconButton
                                                        onClick={() => {
                                                            setSelectedMessageForEmoji(message._id);
                                                            setEmojiPickerVisible(!emojiPickerVisible);
                                                        }}
                                                        size="small"
                                                        sx={{ color: 'white', position: 'absolute', bottom: 0, right: 0 }}
                                                    >
                                                        <EmojiEmotions fontSize="small" />
                                                    </IconButton>
                                            ) : null}
                                            {emojiPickerVisible && selectedMessageForEmoji === message._id && (
                                                <Picker onEmojiClick={handleEmojiClick} />
                                            )}
                                            <Box sx={{ display: 'flex', flexDirection: 'row', marginTop: 1 }}>
                                                {message.reactions &&
                                                    message.reactions.map((reaction, index) => (
                                                        <Typography key={index} sx={{ marginRight: 1 }}>
                                                            {reaction.emoji}
                                                        </Typography>
                                                    ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        ))}

                    </React.Fragment>
                ))}
                {typing && (
                    <Typography variant="caption" sx={{ margin: 2, textAlign: 'center', color: 'grey.500' }}>
                        {typing} is typing...
                    </Typography>
                )}
                <div ref={messagesEndRef} />
            </Box>
            <MessageComposer onSendMessage={handleSendMessage} onTyping={handleTyping} onStopTyping={handleStopTyping} />
        </Box>
    );
};

    MessageThread.propTypes = {
        conversationId: PropTypes.string.isRequired,
        user: PropTypes.object.isRequired,
        fetchConversations: PropTypes.func.isRequired,
        searchTerm: PropTypes.string,
    };

    export default MessageThread;