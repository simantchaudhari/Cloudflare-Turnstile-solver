TOKEN SOLVER — Cloudflare Turnstile
=====================================
by lol


WHAT YOU NEED TO INSTALL FIRST
--------------------------------

1. Node.js
   Download from: https://nodejs.org
   Pick the "LTS" version. Install it, all default settings.

2. Python
   Download from: https://www.python.org/downloads
   During install, CHECK the box that says "Add Python to PATH".

3. Git (optional, only if you don't already have the files)
   Download from: https://git-scm.com


SETUP (do this once)
---------------------

Open a Command Prompt (press Windows key, type "cmd", hit Enter).

Step 1 — Install Python dependencies:

   pip install patchright
   patchright install chromium

   This downloads a patched browser. May take a few minutes.

Step 2 — Go to the folder where x.js is:

   cd "C:\path\to\turnstile"

   (Replace the path with wherever you actually put the folder)

Step 3 — Install Node.js dependencies:

   npm install


HOW TO RUN
-----------

In the same folder, run:

   node @YeatTheLegit_Turnstile_Solver.js

You'll see something like:

   token solver  |  lol
   GET http://localhost:6767/solve?url=<site>&sitekey=<key>

A browser window will also open in the background — that's normal, don't close it.


HOW TO USE
-----------

Option A — Web UI:
   Open your browser and go to:   http://localhost:6767
   Fill in the Target URL and Site Key, click Run.

Option B — API (for use in your own scripts/tools):
   GET http://localhost:6767/solve?url=<TARGET_URL>&sitekey=<SITE_KEY>

   Example:
   http://localhost:6767/solve?url=https://dashboard.proxyscrape.com/v2/login/&sitekey=0x4AAAAAAAFWUVCKyusT9T8r

   Response (success):
   {
     "success": true,
     "token": "0.xxxxxx...",
     "time": 3.2,
     "by": "lol"
   }

   Response (fail):
   {
     "success": false,
     "err": "timeout"
   }


TROUBLESHOOTING
----------------

"pip is not recognized"
   Python wasn't added to PATH. Uninstall Python and reinstall it,
   making sure to check "Add Python to PATH" during setup.

"node is not recognized"
   Node.js isn't installed. Download and install it from nodejs.org.

"patchright install chromium" fails
   Make sure pip install patchright completed without errors first.
   Try running the command prompt as Administrator.

Browser opens but nothing solves / always fails
   Make sure you're using the correct sitekey for that site.
   Some sites rotate sitekeys, so grab a fresh one.

Port 6767 already in use
   Another instance is already running. Close it first, or change
   PORT = 6767 to a different number at the top of x.js.
