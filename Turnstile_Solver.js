const express = require('express');
const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 6767;
const POOL_SIZE = parseInt(process.env.POOL_SIZE || '30', 10);
const TIMEOUT = 30;

const HTML_UI = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turnstile Solver</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: "JetBrains Mono", monospace;
            background: #0d0d0d;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .wrap {
            background: #111;
            border: 1px solid #1e1e1e;
            border-radius: 8px;
            padding: 34px;
            width: 100%;
            max-width: 460px;
        }

        .hdr {
            border-bottom: 1px solid #1a1a1a;
            padding-bottom: 18px;
            margin-bottom: 24px;
        }

        .hdr h1 {
            color: #c084fc;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .hdr p {
            color: #383838;
            font-size: 11px;
            margin-top: 4px;
        }

        .field { margin-bottom: 14px; }

        .field label {
            display: block;
            color: #444;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .field input {
            width: 100%;
            padding: 11px 13px;
            background: #0a0a0a;
            border: 1px solid #1e1e1e;
            border-radius: 5px;
            color: #ddd;
            font-size: 12px;
            font-family: "JetBrains Mono", monospace;
            outline: none;
            transition: border-color 0.15s;
        }

        .field input:focus { border-color: #7c3aed; }
        .field input::placeholder { color: #2a2a2a; }

        .go-btn {
            width: 100%;
            padding: 12px;
            background: #7c3aed;
            border: none;
            border-radius: 5px;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            font-family: "JetBrains Mono", monospace;
            cursor: pointer;
            letter-spacing: 1px;
            text-transform: uppercase;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .go-btn:hover { background: #6d28d9; }
        .go-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .go-btn .sp {
            width: 13px;
            height: 13px;
            border: 2px solid rgba(255,255,255,0.25);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.65s linear infinite;
            display: none;
        }

        .go-btn.busy .sp { display: block; }
        .go-btn.busy .lbl { display: none; }

        @keyframes spin { to { transform: rotate(360deg); } }

        .out {
            margin-top: 18px;
            padding: 14px;
            background: #0a0a0a;
            border: 1px solid #1a1a1a;
            border-radius: 6px;
            display: none;
        }

        .out.show { display: block; }

        .out-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .badge.ok { background: rgba(134,239,172,0.08); color: #86efac; }
        .badge.fail { background: rgba(252,165,165,0.08); color: #fca5a5; }

        .el { color: #333; font-size: 11px; }

        .tok {
            background: #0d0d0d;
            border-radius: 4px;
            padding: 9px;
            position: relative;
        }

        .tok code {
            color: #a78bfa;
            font-size: 10px;
            font-family: "JetBrains Mono", monospace;
            word-break: break-all;
            display: block;
            max-height: 65px;
            overflow-y: auto;
        }

        .cp {
            position: absolute;
            top: 5px;
            right: 5px;
            padding: 3px 9px;
            background: #1a1a1a;
            border: none;
            border-radius: 3px;
            color: #555;
            font-size: 10px;
            font-family: "JetBrains Mono", monospace;
            cursor: pointer;
            transition: color 0.15s, background 0.15s;
        }

        .cp:hover { color: #ddd; background: #252525; }

        .err-txt { color: #fca5a5; font-size: 11px; }

        .metrics {
            display: flex;
            gap: 1px;
            margin-top: 18px;
            background: #181818;
            border-radius: 6px;
            overflow: hidden;
        }

        .m {
            flex: 1;
            padding: 11px;
            background: #111;
            text-align: center;
        }

        .m-val {
            color: #c084fc;
            font-size: 18px;
            font-weight: 700;
        }

        .m-lbl {
            color: #2e2e2e;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 3px;
        }

        .ep {
            margin-top: 14px;
            padding: 11px 13px;
            background: #0a0a0a;
            border: 1px solid #181818;
            border-radius: 5px;
        }

        .ep span {
            color: #3a3a3a;
            font-size: 10px;
            display: block;
        }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="hdr">
            <h1>// turnstile solver</h1>
            <p>cloudflare turnstile bypass</p>
        </div>

        <form id="f">
            <div class="field">
                <label>Target URL</label>
                <input type="url" id="url" placeholder="https://target.com" required>
            </div>

            <div class="field">
                <label>Site Key</label>
                <input type="text" id="sk" placeholder="0x4AAAAAAA..." required>
            </div>

            <button type="submit" class="go-btn" id="btn">
                <span class="sp"></span>
                <span class="lbl">run</span>
            </button>
        </form>

        <div class="out" id="out">
            <div class="out-row">
                <span class="badge" id="badge"></span>
                <span class="el" id="el"></span>
            </div>
            <div class="tok" id="tokBox">
                <code id="tok"></code>
                <button class="cp" onclick="cp()">copy</button>
            </div>
            <p class="err-txt" id="errTxt"></p>
        </div>

        <div class="metrics">
            <div class="m">
                <div class="m-val" id="cnt">0</div>
                <div class="m-lbl">solved</div>
            </div>
            <div class="m">
                <div class="m-val" id="avg">&#8212;</div>
                <div class="m-lbl">avg</div>
            </div>
            <div class="m">
                <div class="m-val" id="rate">&#8212;</div>
                <div class="m-lbl">rate</div>
            </div>
        </div>

        <div class="ep">
            <span>GET /solve?url=&lt;url&gt;&sitekey=&lt;key&gt;</span>
        </div>
    </div>

    <script>
        let s = { ok: 0, fail: 0, t: 0 };

        document.getElementById("f").addEventListener("submit", async e => {
            e.preventDefault();
            const btn = document.getElementById("btn");
            const out = document.getElementById("out");
            btn.classList.add("busy");
            btn.disabled = true;
            out.classList.remove("show");

            try {
                const r = await fetch("/solve?url=" + encodeURIComponent(document.getElementById("url").value) + "&sitekey=" + encodeURIComponent(document.getElementById("sk").value));
                const d = await r.json();
                out.classList.add("show");

                if (d.success) {
                    document.getElementById("badge").textContent = "ok";
                    document.getElementById("badge").className = "badge ok";
                    document.getElementById("el").textContent = d.time + "s";
                    document.getElementById("tok").textContent = d.token;
                    document.getElementById("tokBox").style.display = "block";
                    document.getElementById("errTxt").style.display = "none";
                    s.ok++;
                    s.t += d.time;
                } else {
                    document.getElementById("badge").textContent = "fail";
                    document.getElementById("badge").className = "badge fail";
                    document.getElementById("el").textContent = "";
                    document.getElementById("tokBox").style.display = "none";
                    document.getElementById("errTxt").textContent = d.err;
                    document.getElementById("errTxt").style.display = "block";
                    s.fail++;
                }

                upd();
            } catch (ex) {
                out.classList.add("show");
                document.getElementById("badge").textContent = "fail";
                document.getElementById("badge").className = "badge fail";
                document.getElementById("tokBox").style.display = "none";
                document.getElementById("errTxt").textContent = ex.message;
                document.getElementById("errTxt").style.display = "block";
                s.fail++;
                upd();
            }

            btn.classList.remove("busy");
            btn.disabled = false;
        });

        function upd() {
            const total = s.ok + s.fail;
            document.getElementById("cnt").textContent = s.ok;
            document.getElementById("avg").textContent = s.ok > 0 ? (s.t / s.ok).toFixed(1) + "s" : "—";
            document.getElementById("rate").textContent = total > 0 ? Math.round(s.ok / total * 100) + "%" : "—";
        }

        function cp() {
            navigator.clipboard.writeText(document.getElementById("tok").textContent);
            event.target.textContent = "done";
            setTimeout(() => event.target.textContent = "copy", 1400);
        }
    </script>
</body>
</html>`;

function buildPage(siteKey) {
    return `<!DOCTYPE html>
<html><head>
<script>
window.addEventListener("message",function(m){
if(m.origin!=="https://challenges.cloudflare.com"||!m.data)return;
if(m.data.event==="interactiveBegin")window.__ci=1;
});
</` + `script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></` + `script>
</head>
<body><div class="cf-turnstile" data-sitekey="${siteKey}"></div></body>
</html>`;
}

let browser;
const ctxPool = [];

async function grabCtx() {
    if (ctxPool.length > 0) return ctxPool.shift();
    return await browser.newContext({ viewport: null });
}

async function dropCtx(ctx) {
    if (ctxPool.length < POOL_SIZE) {
        ctxPool.push(ctx);
    } else {
        await ctx.close();
    }
}

function findPatchrightExe() {
    for (const py of ['python3', 'python']) {
        try {
            const out = execSync(
                `${py} -c "from patchright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()"`,
                { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
            ).trim();
            if (out && fs.existsSync(out)) return out;
        } catch {}
    }
    const searchDirs = [
        path.join(process.env.LOCALAPPDATA || '', 'ms-playwright'),
        path.join(process.env.HOME || '/root', '.cache', 'ms-playwright')
    ];
    for (const base of searchDirs) {
        try {
            if (!fs.existsSync(base)) continue;
            for (const d of fs.readdirSync(base)) {
                if (d.toLowerCase().includes('patchright') || d.toLowerCase().includes('chromium')) {
                    const winExe = path.join(base, d, 'chrome-win', 'chrome.exe');
                    const linuxExe = path.join(base, d, 'chrome-linux', 'chrome');
                    if (fs.existsSync(winExe)) return winExe;
                    if (fs.existsSync(linuxExe)) return linuxExe;
                }
            }
        } catch {}
    }
    return null;
}

async function solve(siteUrl, siteKey, timeout = TIMEOUT) {
    if (!siteUrl.endsWith('/')) siteUrl += '/';
    const t0 = Date.now();
    const ctx = await grabCtx();
    const pg = await ctx.newPage();
    let clicked = false;

    try {
        const html = buildPage(siteKey);
        await pg.route(siteUrl, r => r.fulfill({ body: html, status: 200 }));
        await pg.goto(siteUrl, { timeout: 15000 });

        while (Date.now() - t0 < timeout * 1000) {
            const [tok, ci] = await pg.evaluate(`[
                document.querySelector('[name=cf-turnstile-response]')?.value||null,
                window.__ci||0
            ]`);

            if (tok && tok.length > 50) {
                const elapsed = Math.round((Date.now() - t0) / 10) / 100;
                return { by: 'lol', time: elapsed, success: true, token: tok };
            }

            if (ci && !clicked) {
                clicked = true;
                setTimeout(async () => {
                    try {
                        const box = await pg.locator('.cf-turnstile').boundingBox();
                        if (!box) return;
                        const tx = box.x + 25, ty = box.y + box.height / 2;
                        await pg.mouse.move(tx + 55, ty + 18);
                        await new Promise(r => setTimeout(r, 100));
                        await pg.mouse.move(tx, ty, { steps: 5 });
                        await new Promise(r => setTimeout(r, 80));
                        await pg.mouse.click(tx, ty);
                    } catch {}
                }, 180);
            }

            await new Promise(r => setTimeout(r, 250));
        }

        return { success: false, err: 'timeout' };
    } catch (e) {
        return { success: false, err: e.message };
    } finally {
        await pg.close();
        await dropCtx(ctx);
    }
}

const app = express();

app.get('/', (req, res) => res.send(HTML_UI));

app.get('/solve', async (req, res) => {
    const { url, sitekey, timeout } = req.query;
    if (!url) return res.status(400).json({ success: false, err: 'missing url' });
    if (!sitekey) return res.status(400).json({ success: false, err: 'missing sitekey' });
    try {
        res.json(await solve(url, sitekey, timeout ? parseFloat(timeout) : TIMEOUT));
    } catch (e) {
        res.status(500).json({ success: false, err: e.message });
    }
});

app.get('/health', (req, res) => res.json({ ok: true, pool: ctxPool.length }));

async function main() {
    const exePath = findPatchrightExe();

    browser = await chromium.launch({
        executablePath: exePath || undefined,
        headless: process.env.HEADLESS !== 'false',
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--no-first-run',
            '--disable-blink-features=AutomationControlled',
        ]
    });

    for (let i = 0; i < POOL_SIZE; i++) {
        ctxPool.push(await browser.newContext({ viewport: null }));
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`  GET http://localhost:${PORT}/solve?url=<site>&sitekey=<key>`);
    });
}

main().catch(() => process.exit(1));
