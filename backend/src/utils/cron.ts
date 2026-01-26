import { CronJob } from 'cron';
import https from 'https';
import http from 'http';

const job = new CronJob('*/14 * * * *', function () {
    // Use RENDER_EXTERNAL_URL (provided by Render) or API_URL from .env
    const url = process.env.RENDER_EXTERNAL_URL || process.env.API_URL;

    if (!url) {
        console.warn('⚠️ Keep-alive: No API_URL or RENDER_EXTERNAL_URL found. Skipping health check.');
        return;
    }

    // Construct health check URL
    const healthUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;
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
