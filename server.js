const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Waizender Proxy</title>
            <style>
                body { background-color: #121212; color: #00ff88; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1e1e1e; padding: 40px; border-radius: 15px; border: 1px solid #333; }
                input { padding: 15px; width: 300px; border-radius: 5px; border: 1px solid #444; background: #000; color: #fff; }
                button { padding: 15px; border-radius: 5px; border: none; background: #00ff88; color: #000; font-weight: bold; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Waizender Proxy</h1>
            <div class="box">
                <form action="/proxy">
                    <input name="url" placeholder="https://google.com" required>
                    <button type="submit">Launch</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.redirect('/');
    try {
        const response = await axios.get(targetUrl);
        let html = response.data;
        const baseUrl = new URL(targetUrl).origin;
        html = html.replace('<head>', '<head><base href="' + baseUrl + '">');
        res.send(html);
    } catch (err) {
        res.status(500).send("Error: Make sure the URL starts with https://");
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
