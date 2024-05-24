import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // You can change this to your desired primary color
            contrastText: '#ffffff', // White text for the primary color
        },
        secondary: {
            main: '#dc004e', // You can change this to your desired secondary color
            contrastText: '#ffffff', // White text for the secondary color
        },
        grey: {
            200: '#eeeeee', // Light grey for received messages
        },
        text: {
            primary: '#000000', // Black text for default text
        },
    },
});

export default theme;
