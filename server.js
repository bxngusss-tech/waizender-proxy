const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

// Use the port Render/Railway gives us, or 10000 for local testing
const PORT = process.env.PORT || 10000;

/**
 * 1. THE DISGUISE
 * Serves your "Tutoring" site from the 'public' folder.
 * This is what people see when they visit the main URL.
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 2. THE SECRET DOOR
 * Serves your secret proxy interface.
 */
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'proxy-dash.html'));
});

/**
 * 3. THE PROXY ENGINE
 * This handles the heavy lifting of loading websites.
 * It rewrites headers so sites don't block you.
 */
app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Please provide a URL in the query string.");
    }

    // This creates a tunnel to the target website
    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        // This removes '/service' from the URL before sending it to the target
        pathRewrite: {
            '^/service': '',
        },
        // Security Bypass: Removes headers that sites use to block being proxied
        onProxyRes: function (proxyRes) {
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy-report-only'];
        },
        // Error handling if the site is down or URL is bad
        onError: (err, req, res) => {
            res.status(500).send("Proxy Error: Could not connect to the site. Ensure the URL starts with https://");
        }
    })(req, res, next);
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is active on port ${PORT}`);
});
