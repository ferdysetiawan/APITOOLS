import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload || !payload.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!payload.method) {
      return NextResponse.json({ error: 'Method is required' }, { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = new URL(payload.url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const transport = targetUrl.protocol === 'https:' ? https : http;
    const requestHeaders = payload.headers || {};
    let requestBody = null;

    if (payload.body && payload.method !== 'GET' && payload.method !== 'HEAD') {
      requestBody = typeof payload.body === 'object' ? JSON.stringify(payload.body) : String(payload.body);
      if (!requestHeaders['content-length'] && !requestHeaders['Content-Length']) {
        requestHeaders['Content-Length'] = Buffer.byteLength(requestBody).toString();
      }
    }

    const defaultPort = targetUrl.protocol === 'https:' ? 443 : 80;
    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || defaultPort,
      path: targetUrl.pathname + targetUrl.search,
      method: payload.method,
      headers: requestHeaders,
      timeout: 25000,
      rejectUnauthorized: false
    };

    return new Promise<NextResponse>((resolve) => {
      const startTime = process.hrtime();

      const proxyReq = transport.request(options, (proxyRes) => {
        const chunks: Buffer[] = [];
        proxyRes.on('data', (chunk) => { chunks.push(chunk); });
        proxyRes.on('end', () => {
          const elapsed = process.hrtime(startTime);
          const durationMs = Math.round(elapsed[0] * 1000 + elapsed[1] / 1000000);
          const responseBuffer = Buffer.concat(chunks);
          const responseBody = responseBuffer.toString('utf-8');

          resolve(NextResponse.json({
            status: proxyRes.statusCode,
            statusText: proxyRes.statusMessage,
            headers: proxyRes.headers,
            body: responseBody,
            time: durationMs,
            size: responseBuffer.length
          }));
        });
      });

      proxyReq.on('error', (err: any) => {
        const elapsed = process.hrtime(startTime);
        const durationMs = Math.round(elapsed[0] * 1000 + elapsed[1] / 1000000);
        resolve(NextResponse.json({
          error: err.message,
          code: err.code,
          time: durationMs
        }, { status: 502 }));
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        resolve(NextResponse.json({ error: 'Request timed out after 25 seconds' }, { status: 504 }));
      });

      if (requestBody) {
        proxyReq.write(requestBody);
      }

      proxyReq.end();
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
