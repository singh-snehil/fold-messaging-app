import io from "socket.io-client";
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  socket.emit('joinConversation', 'test-conversation');

  socket.on('newMessage', (message) => {
    console.log('New message:', message);
  });

  socket.on('typing', (user) => {
    console.log(`${user} is typing...`);
  });

  socket.on('stopTyping', (user) => {
    console.log(`${user} stopped typing.`);
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
