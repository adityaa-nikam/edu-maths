import 'dotenv/config'; // Must be first!
import app from './app.js';
import { testConnection } from './db/index.js';
import { getRedisClient } from './db/redis.js';
import healthJob from './utils/cron.js';


const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);

  // Start the keep-alive cron job
  healthJob.start();
  console.log('⏰ Keep-alive cron job started (runs every 14 mins)');

  // Test database connection
  await testConnection();

  // Initialize Redis (optional - system works without it)
  getRedisClient();
});
