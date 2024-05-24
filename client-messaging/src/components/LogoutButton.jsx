import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';

const LogoutButton = ({ onLogout }) => {
    return (
        <Button variant="contained" color="secondary" onClick={onLogout}>
            Logout
        </Button>
    );
};

LogoutButton.propTypes = {
    onLogout: PropTypes.func.isRequired,
};

export default LogoutButton;
