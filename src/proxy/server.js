/**
 * Lightweight proxy server to unwrap provider iframes
 * Returns a redirect to the innermost iframe URL or JSON when requested.
 */

const http = require('http');
const keys = require('../config/keys');
const vidsrcService = require('../services/vidsrc.service');

function respondJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}

function respondHtml(res, streamUrl) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <title>Streaming Player</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
        }
        #player-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
        #player {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
        /* Enable fullscreen on mobile */
        #player-container:-webkit-full-screen {
            width: 100%;
            height: 100%;
        }
        #player-container:-moz-full-screen {
            width: 100%;
            height: 100%;
        }
        #player-container:-ms-fullscreen {
            width: 100%;
            height: 100%;
        }
        #player-container:fullscreen {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="player-container">
        <iframe 
            id="player"
            src="${streamUrl.replace(/"/g, '&quot;')}"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
            allowfullscreen
            webkitallowfullscreen
            mozallowfullscreen
            msallowfullscreen
            scrolling="no"
            frameborder="0"
            referrerpolicy="no-referrer-when-downgrade">
        </iframe>
    </div>
    <script>
        // Enable fullscreen API support
        const container = document.getElementById('player-container');
        const player = document.getElementById('player');
        
        // Try to enter fullscreen on load (may require user interaction)
        function requestFullscreen() {
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(() => {});
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        }
        
        // Listen for fullscreen requests from iframe
        window.addEventListener('message', function(event) {
            if (event.data === 'requestFullscreen' || event.data.type === 'requestFullscreen') {
                requestFullscreen();
            }
        });
        
        // Auto-resize iframe to fill container
        function resizePlayer() {
            player.style.width = '100%';
            player.style.height = '100%';
        }
        
        window.addEventListener('resize', resizePlayer);
        resizePlayer();
    </script>
</body>
</html>`;
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.end(html);
}

async function handleProxyRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${keys.proxy?.port || 3001}`);
    const segments = url.pathname.split('/').filter(Boolean); // [proxy, provider, type, ...]

    // Simple health / root checks to satisfy platform probes
    if (segments.length === 0 || url.pathname === '/health') {
        respondJson(res, 200, { status: 'ok' });
        return;
    }

    if (segments[0] !== 'proxy') {
        respondJson(res, 404, { error: 'Not found' });
        return;
    }

    const providerSlug = segments[1];
    const mediaType = segments[2]; // movie | tv

    if (!providerSlug || !mediaType) {
        respondJson(res, 400, { error: 'Invalid proxy route' });
        return;
    }

    try {
        let streamUrl;

        // Check if a direct stream URL is provided (e.g., for Gojo, Cinetaro)
        const directUrl = url.searchParams.get('url');
        if (directUrl) {
            streamUrl = decodeURIComponent(directUrl);
        } else if (mediaType === 'movie') {
            const tmdbId = segments[3];
            if (!tmdbId) {
                respondJson(res, 400, { error: 'TMDB ID required' });
                return;
            }
            streamUrl = await vidsrcService.resolveStream(providerSlug, 'movie', { tmdbId });
        } else if (mediaType === 'tv') {
            const tmdbId = segments[3];
            const season = segments[4];
            const episode = segments[5];
            
            if (!tmdbId || !season || !episode) {
                respondJson(res, 400, { error: 'TMDB ID, season, and episode required' });
                return;
            }
            
            streamUrl = await vidsrcService.resolveStream(providerSlug, 'tv', { tmdbId, season, episode });
        } else {
            respondJson(res, 400, { error: 'Unsupported media type' });
            return;
        }

        const format = url.searchParams.get('format') || 'html';
        if (format === 'json') {
            respondJson(res, 200, { url: streamUrl });
        } else if (format === 'redirect') {
            res.statusCode = 302;
            res.setHeader('Location', streamUrl);
            res.end();
        } else {
            // Default: serve HTML wrapper for fullscreen support
            respondHtml(res, streamUrl);
        }
    } catch (error) {
        console.error('Proxy error:', error.message);
        respondJson(res, 502, { error: error.message });
    }
}

function start() {
    if (!keys.proxy?.enabled) {
        return null;
    }

    const port = keys.proxy?.port || 3001;
    const server = http.createServer((req, res) => {
        if (req.method !== 'GET') {
            respondJson(res, 405, { error: 'Method not allowed' });
            return;
        }

        handleProxyRequest(req, res);
    });

    server.listen(port, () => {
        const base = keys.proxy?.publicBaseUrl || `http://localhost:${port}`;
        console.log(`🔀 Proxy server running on ${base}`);
    });

    return server;
}

module.exports = { start };
