# Messaging App

This is a comprehensive messaging application built with React, Material-UI, Node.js, Express, and MongoDB. The app features real-time messaging, user authentication, and a responsive design.

## Features

- Real-time messaging using WebSockets
- Responsive design for mobile, tablet, and desktop views
- Conversations with unread message indicators
- Message thread view with read receipts
- Emoji reactions to messages
- Message editing and deletion
- Filtering and sorting of conversations
- Search functionality within conversations

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (local instance or MongoDB Atlas)

## Getting Started

Follow these steps to set up and run the project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/singh-snehil/fold-messaging-app.git
cd fold-messaging-app
```

### 2. Set up Server
cd server-messaging
npm install


### 3. Set Up MongoDB
Option 1: Local MongoDB Instance
Make sure you have MongoDB installed and running on your local machine. You can follow the official MongoDB installation guide for your operating system.

Update the .env file with your MongoDB connection string. Create a .env file in the server-messaging directory:
            `touch .env`

Add the following content to the .env file:

MONGODB_URI=mongodb://localhost:27017/messaging-app
PORT=3000

Option 2: MongoDB Atlas
Go to MongoDB Atlas and create a free cluster.
Create a database user with username and password.
Whitelist your IP address.
Get the connection string from the MongoDB Atlas dashboard.
Update the .env file with your MongoDB Atlas connection string:

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/messaging-app?retryWrites=true&w=majority
PORT=3000

### 4. Seed the Database
Seed the database with initial data. Run the following command in the server-messaging directory:
                npm run seed

### 5. Set Up the Client
Navigate to the client-messaging directory and install the dependencies.

cd ../client-messaging
npm install

### 7. Run the Application
cd ..
npm install
npm run dev

### 8. Access the Application
Open your browser and navigate to http://localhost:5173. You should see the login screen. Select a user to log in and start using the messaging app.


Scripts
npm run dev: Runs both the client and server in development mode.
npm run seed: Seeds the MongoDB database with initial data (run in server-messaging directory).
npm run client: Runs the client only.
npm run server: Runs the server only.


Project Structure
client-messaging: Contains the React front-end application.
server-messaging: Contains the Node.js back-end application.
scripts: Contains database seeding scripts.


Troubleshooting
Make sure MongoDB is running on your local machine or that your MongoDB Atlas credentials are correct.
Ensure that the .env files in both the client and server directories are correctly configured.
Check the browser console and server logs for any error messages.
