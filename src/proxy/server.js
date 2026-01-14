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

async function handleProxyRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${keys.proxy?.port || 3001}`);
    const segments = url.pathname.split('/').filter(Boolean); // [proxy, provider, type, ...]

    if (segments[0] !== 'proxy') {
        res.statusCode = 404;
        res.end('Not found');
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

        if (mediaType === 'movie') {
            const tmdbId = segments[3];
            streamUrl = await vidsrcService.resolveStream(providerSlug, 'movie', { tmdbId });
        } else if (mediaType === 'tv') {
            const tmdbId = segments[3];
            const season = segments[4];
            const episode = segments[5];
            streamUrl = await vidsrcService.resolveStream(providerSlug, 'tv', { tmdbId, season, episode });
        } else {
            respondJson(res, 400, { error: 'Unsupported media type' });
            return;
        }

        const format = url.searchParams.get('format') || 'redirect';
        if (format === 'json') {
            respondJson(res, 200, { url: streamUrl });
        } else {
            res.statusCode = 302;
            res.setHeader('Location', streamUrl);
            res.end();
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
