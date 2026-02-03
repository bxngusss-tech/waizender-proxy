const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;

// 1. DISGUISE: Serves the tutoring page from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. SECRET DOOR: Serves your proxy UI
app.get('/dashboard', (req, res) => {
    const rootPath = path.join(__dirname, 'proxy.html');
    if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send("Error: proxy.html not found in the main folder.");
    }
});

// 3. THE TUNNEL: High-performance proxy engine with link fixing
app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("No URL provided.");

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        autoRewrite: true,
        // Pretend to be a real Chrome browser to avoid blocks
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
        pathRewrite: { '^/service': '' },
        onProxyRes: function (proxyRes, req, res) {
            // Remove security headers that prevent sites from loading in frames/proxies
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy-report-only'];

            // Fix cookies to prevent login loops
            if (proxyRes.headers['set-cookie']) {
                proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie =>
                    cookie.replace(/Domain=[^;]+;?/, '').replace(/SameSite=Lax|SameSite=Strict/g, 'SameSite=None')
                );
            }
        },
        onError: (err, req, res) => {
            res.status(500).send("Proxy Error: Could not reach the destination. Make sure the URL starts with https://");
        }
    })(req, res, next);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
