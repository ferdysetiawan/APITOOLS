const express = require('express');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const REQUEST_TIMEOUT = 30000;

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: 'text/*' }));
app.use(express.static(path.join(__dirname)));

app.get('/health', function(req, res) {
  res.json({ status: 'ok', proxy: true, version: '1.0.0' });
});

app.post('/proxy', function(req, res) {
  var payload = req.body;

  if (!payload || !payload.url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  if (!payload.method) {
    res.status(400).json({ error: 'Method is required' });
    return;
  }

  var targetUrl;
  try {
    targetUrl = new URL(payload.url);
  } catch (e) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  var transport = targetUrl.protocol === 'https:' ? https : http;
  var requestHeaders = payload.headers || {};
  var requestBody = null;

  if (payload.body && payload.method !== 'GET' && payload.method !== 'HEAD') {
    requestBody = typeof payload.body === 'object' ? JSON.stringify(payload.body) : String(payload.body);
    if (!requestHeaders['content-length'] && !requestHeaders['Content-Length']) {
      requestHeaders['Content-Length'] = Buffer.byteLength(requestBody);
    }
  }

  var defaultPort = targetUrl.protocol === 'https:' ? 443 : 80;
  var options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || defaultPort,
    path: targetUrl.pathname + targetUrl.search,
    method: payload.method,
    headers: requestHeaders,
    timeout: REQUEST_TIMEOUT,
    rejectUnauthorized: false
  };

  var startTime = process.hrtime();

  var proxyReq = transport.request(options, function(proxyRes) {
    var chunks = [];
    proxyRes.on('data', function(chunk) { chunks.push(chunk); });
    proxyRes.on('end', function() {
      var elapsed = process.hrtime(startTime);
      var durationMs = Math.round(elapsed[0] * 1000 + elapsed[1] / 1000000);
      var responseBuffer = Buffer.concat(chunks);
      var responseBody = responseBuffer.toString('utf-8');

      res.json({
        status: proxyRes.statusCode,
        statusText: proxyRes.statusMessage,
        headers: proxyRes.headers,
        body: responseBody,
        time: durationMs,
        size: responseBuffer.length
      });
    });
  });

  proxyReq.on('error', function(err) {
    var elapsed = process.hrtime(startTime);
    var durationMs = Math.round(elapsed[0] * 1000 + elapsed[1] / 1000000);
    res.status(502).json({
      error: err.message,
      code: err.code,
      time: durationMs
    });
  });

  proxyReq.on('timeout', function() {
    proxyReq.destroy();
    res.status(504).json({ error: 'Request timed out after ' + (REQUEST_TIMEOUT / 1000) + ' seconds' });
  });

  if (requestBody) {
    proxyReq.write(requestBody);
  }

  proxyReq.end();
});

app.listen(PORT, function() {
  console.log('');
  console.log('  ANTARAPI Server');
  console.log('  ──────────────────────────────');
  console.log('  Local:  http://localhost:' + PORT);
  console.log('  Proxy:  Enabled');
  console.log('  ──────────────────────────────');
  console.log('');
});
