import React from 'react';
import PropTypes from 'prop-types';
import { List, ListItemButton, ListItemText, Badge } from '@mui/material';

const ConversationList = ({ user, conversations, selectedConversationId,setSelectedConversationId, searchTerm }) => {
    const handleConversationClick = (conversationId) => {
        setSelectedConversationId(conversationId);
    };

    const highlightText = (text, highlight) => {
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return <span>{parts.map((part, index) => part.toLowerCase() === highlight.toLowerCase() ? <mark key={index}>{part}</mark> : part)}</span>;
    };

    return (
        <List sx={{ borderRight: '1px solid #ccc', overflowY: 'auto' }}>
            {conversations.map((conversation) => {
                const otherParticipant = conversation.participants.find(p => p.email !== user.email);
                const lastMessageText = conversation.lastMessage ? conversation.lastMessage.text : 'No messages yet';
                return (
                    <ListItemButton
                        key={conversation._id}
                        onClick={() => handleConversationClick(conversation._id)}
                        selected={selectedConversationId === conversation._id}
                    >
                        <ListItemText
                            primary={highlightText(otherParticipant ? otherParticipant.name : 'Unknown', searchTerm)}
                            secondary={highlightText(lastMessageText, searchTerm)}
                        />
                        {conversation.unreadCounts[user._id] > 0 && (
                            <Badge badgeContent={conversation.unreadCounts[user._id]} color="primary" />
                        )}
                    </ListItemButton>
                );
            })}
        </List>
    );
};

ConversationList.propTypes = {
    user: PropTypes.object.isRequired,
    conversations: PropTypes.array.isRequired,
    selectedConversationId: PropTypes.string.isRequired,
    setSelectedConversationId: PropTypes.func.isRequired,
    searchTerm: PropTypes.string,
};

export default ConversationList;
