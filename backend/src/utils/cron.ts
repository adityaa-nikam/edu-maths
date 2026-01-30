import { CronJob } from 'cron';
import https from 'https';
import http from 'http';

const job = new CronJob('*/1 * * * *', function () {
    // Detect if running on Render
    const isRender = process.env.RENDER === 'true';
    
    // Use external URL on Render, localhost locally
    // RENDER_EXTERNAL_URL already includes https://, so don't add it
    const url = isRender 
        ? process.env.RENDER_EXTERNAL_URL || 'https://edu-maths-dev.onrender.com'
        : 'http://localhost:3000';

    const healthUrl = `${url}/api/health`;
    const protocol = healthUrl.startsWith('https') ? https : http;

    console.log(`⏰ Keep-alive: Pinging ${healthUrl}...`);

    protocol
        .get(healthUrl, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ Keep-alive: Health check successful (${new Date().toLocaleString()})`);
            } else {
                console.log(`❌ Keep-alive: Health check failed with status ${res.statusCode}`);
            }
        })
        .on('error', (e) => {
            console.error('❌ Keep-alive: Error during health check:', e.message);
        });
});

export default job;
