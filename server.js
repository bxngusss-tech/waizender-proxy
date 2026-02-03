const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;

// 1. Serve the "Tutoring" disguise from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. Secret route to the Proxy UI (proxy.html)
app.get('/dashboard', (req, res) => {
    // We check the main folder first, then the public folder as a backup
    const rootPath = path.join(__dirname, 'proxy.html');
    const publicPath = path.join(__dirname, 'public', 'proxy.html');

    if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else {
        res.status(404).send("<h1>File Not Found</h1><p>Ensure proxy.html is in your main GitHub folder.</p>");
    }
});

// 3. The Proxy Engine
app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("No URL provided.");

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        pathRewrite: { '^/service': '' },
        onProxyRes: function (proxyRes) {
            // These lines help unblock sites that try to prevent being proxied
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy-report-only'];
        },
        onError: (err, req, res) => {
            res.status(500).send("Proxy Error: Check if the URL starts with https://");
        }
    })(req, res, next);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Disguise Portal active on port ${PORT}`);
});
