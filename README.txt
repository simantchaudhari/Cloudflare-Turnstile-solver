Cloudflare Turnstile Solver
===========================

Fast, high-performance automated Cloudflare Turnstile token resolver.

Features:
- Sub-2-second token resolution using target origin route interception.
- Automated Cloudflare interactive challenge detection & human-like click dispatch.
- Pre-warmed browser context pooling with automatic cookie recycling.
- Built-in web UI dashboard and REST API endpoint.

Getting Started:
---------------
Install dependencies:
    npm install

Start the solver server:
    npm start
    # or with virtual display (headless screen without desktop popups):
    npm run start:xvfb
    # or manually:
    xvfb-run -a --server-args="-screen 0 1920x1080x24 -ac" node Turnstile_Solver.js

Configuration:
--------------
You can configure the server via CLI flags, environment variables, or ecosystem.config.js:

1. CLI Flags:
   node Turnstile_Solver.js --pool 10 --port 6767
   ./start.sh --pool 10

2. Environment Variables:
   PORT        Port to listen on (default: 6767)
   POOL_SIZE   Number of pre-warmed browser contexts (default: 5)
   HEADLESS    Set to "true" to force headless mode (default: false)

3. PM2 Ecosystem File:
   Edit `POOL_SIZE` inside `ecosystem.config.js`.

API Usage:
----------
GET /solve?url=<TARGET_URL>&sitekey=<SITE_KEY>&timeout=<TIMEOUT_IN_SECONDS>

Example:
curl "http://localhost:6767/solve?url=https://dashboard.proxyscrape.com/v2/login&sitekey=0x4AAAAAAAFWUVCKyusT9T8r"

Response:
{
  "success": true,
  "token": "1.R7ndzAHG4U-ldk...",
  "time": 1.98
}

Ubuntu Server Deployment (CLI / No GUI):
----------------------------------------
On a headless Ubuntu Server without any desktop/GUI:

1. Install Xvfb and browser dependencies:
   sudo apt-get update && sudo apt-get install -y xvfb
   npx playwright install-deps

2. Run with xvfb:
   npm run start:xvfb

3. Run in background with PM2:
   sudo npm install -g pm2
   pm2 start ecosystem.config.js

   # Useful PM2 commands:
   pm2 logs turnstile-solver
   pm2 restart turnstile-solver
   pm2 stop turnstile-solver

