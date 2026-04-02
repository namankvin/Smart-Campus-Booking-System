require('dotenv').config();
const connectDB = require('./config/database');
const { createAppServer } = require('./app');

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    process.exit(1);
  }

  const { server } = createAppServer();

  await connectDB();

  const PORT = Number(process.env.PORT || 5000);
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});