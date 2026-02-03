const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;

// 1. DISGUISE: Serves the tutoring portal
app.use(express.static(path.join(__dirname, 'public')));

// 2. SECRET DOOR: Serves your proxy UI
app.get('/dashboard', (req, res) => {
    const rootPath = path.join(__dirname, 'proxy.html');
    if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send("Error: proxy.html not found.");
    }
});

// 3. GAME TUNNEL: Optimized for assets and media
app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("No URL provided.");

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        autoRewrite: true,
        onProxyReq: (proxyReq) => {
            // Disguise as a high-end Gaming PC
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        },
        onProxyRes: (proxyRes) => {
            // STRIP SECURITY: Essential for Dashmetry/Geometry Dash clones
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['content-security-policy-report-only'];
            delete proxyRes.headers['x-frame-options'];
            
            // CORS FIX: Allows the game to load levels/music from other servers
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            
            // COOKIE FIX
            if (proxyRes.headers['set-cookie']) {
                proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(c => 
                    c.replace(/SameSite=(Lax|Strict)/gi, 'SameSite=None') + '; Secure'
                );
            }
        },
        onError: (err
