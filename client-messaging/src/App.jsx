import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, CssBaseline, AppBar, Toolbar, Typography, IconButton, Drawer, Grid, FormControl, InputLabel, Select, MenuItem, TextField, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import ConversationList from './components/ConversationList';
import MessageThread from './components/MessageThread';
import Login from './components/Login';
import LogoutButton from './components/LogoutButton';
import axios from 'axios';

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(isMobile);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
          console.log("localstorage", storedUser)

      setUser(JSON.parse(storedUser));
    }
  }, []);
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:3000/api/conversations', {
        params: { userId: user._id }
      });
      setConversations(response.data);
      // Select the first conversation by default
      if (response.data.length > 0) {
        setSelectedConversationId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  useEffect(() => {
    if(user)fetchConversations();
  }, [user, fetchConversations]);

  const handleLogin = async (user) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setMobileOpen(isMobile);

    try {
      const response = await axios.get('http://localhost:3000/api/conversations', {
        params: { userId: user._id }
      });
      setConversations(response.data);
      if (response.data.length > 0) {
        setSelectedConversationId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedConversationId(null);
    localStorage.removeItem('user');
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      if (filter === 'read') {
        return conversation.unreadCounts[user._id] === 0;
      } else if (filter === 'unread') {
        return conversation.unreadCounts[user._id] > 0;
      }
      return true;
    }).filter(conversation =>
      conversation.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      conversation.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, filter, user, searchTerm]);

  const sortedConversations = useMemo(() => {
    return filteredConversations.sort((a, b) => {
      if (sort === 'name') {
        const nameA = a.participants.find(p => p._id !== user._id).name.toLowerCase();
        const nameB = b.participants.find(p => p._id !== user._id).name.toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sort === 'recent') {
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      }
      return 0;
    });
  }, [filteredConversations, sort, user]);

  useEffect(() => {

  }, [filter, sort]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleConversationClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <div>
      <Box sx={{ padding: 2 }}>
        <Box sx={{ marginBottom: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <Box sx={{ marginBottom: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ marginBottom: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <MenuItem value="recent">Recent</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <ConversationList
        user={user}
        conversations={sortedConversations}
        setSelectedConversationId={handleConversationClick}
        selectedConversationId={selectedConversationId}
        searchTerm={searchTerm} // Pass the search term
      />
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Grid container justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
            <Grid item>
              <Typography variant="h6" noWrap component="div" sx={{ width: "fit-content" }}>
                Messaging App
              </Typography>
            </Grid>
            <Grid item>
              {user ? <LogoutButton onLogout={handleLogout} /> : null}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flex: 1, marginTop: '64px', overflow: 'hidden' }}>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <Box
              component="nav"
              sx={{ width: { sm: '33%' }, flexShrink: { sm: 0 } }}
              aria-label="mailbox folders"
            >
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true // Better open performance on mobile.
                }}
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '100%' , marginTop: '60px' }
                }}
              >
                {drawer}
              </Drawer>
              <Drawer
                variant="permanent"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '33%' , marginTop: '60px' }
                }}
                open
              >
                {drawer}
              </Drawer>
            </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {selectedConversationId && (
                  <MessageThread
                    conversationId={selectedConversationId}
                    user={user}
                    fetchConversations={fetchConversations}
                    searchTerm={searchTerm} // Pass the search term
                  />
                )}
              </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default App;
