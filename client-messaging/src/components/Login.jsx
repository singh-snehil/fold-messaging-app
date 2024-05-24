import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Box, Select, MenuItem, Button, Typography, FormControl, InputLabel } from '@mui/material';

const Login = ({ onLogin }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:3000/users');
                setUsers(response.data);
                console.log("Users:", response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleLogin = () => {
        const user = users.find((u) => u._id === selectedUser);
        if (user) {
            onLogin(user);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: '80vw', sm: '60vw', md: '40vw', lg: '30vw' },
                height: { xs: '60vh', sm: '50vh', md: '40vh', lg: '35vh' },
                margin: 'auto',
                padding: 2,
                boxShadow: 3,
                borderRadius: 2,
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ width: '90%' }}>
                Select User to Login
            </Typography>
            <FormControl fullWidth sx={{ marginBottom: 2, width: '90%' }}>
                <InputLabel>User</InputLabel>
                <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="User"
                >
                    {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                            {user.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={handleLogin} sx={{ width: '90%' }}>
                Login
            </Button>
        </Box>
    );
};

Login.propTypes = {
    onLogin: PropTypes.func.isRequired,
};

export default Login;
