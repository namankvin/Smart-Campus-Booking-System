require('dotenv').config();
const connectDB = require('./config/database');
const { createAppServer } = require('./app');

const { server } = createAppServer();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});