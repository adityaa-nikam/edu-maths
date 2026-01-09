import 'dotenv/config'; // Must be first!
import app from './app.js';
import { testConnection } from './db/index.js';


const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);

  // Test database connection
  await testConnection();
});
