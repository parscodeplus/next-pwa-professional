// src/hoc/withPWA.tsx
import { NextRequest, NextResponse } from 'next/server';

interface PWAMiddlewareConfig {
  revalidationSecret?: string;
  sseEndpoint?: string;
  webhookPath?: string;
  offlineFallback?: string;
}

export function withPWA(
  originalMiddleware: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  config: PWAMiddlewareConfig = {}
) {
  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const url = request.nextUrl.pathname;
    
    // بررسی درخواست‌های مربوط به PWA
    if (url === '/api/pwa/revalidate') {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${config.revalidationSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      return NextResponse.json({ revalidated: true, now: Date.now() });
    }
    
    if (url === '/api/pwa/cache-events') {
      const response = new NextResponse();
      response.headers.set('Content-Type', 'text/event-stream');
      response.headers.set('Cache-Control', 'no-cache');
      response.headers.set('Connection', 'keep-alive');
      return response;
    }
    
    // اجرای middleware اصلی
    let response;
    try {
      response = await originalMiddleware(request);
    } catch (error) {
      console.error('Middleware error:', error);
      response = NextResponse.next();
    }
    
    // اضافه کردن هدرهای PWA
    response.headers.set('X-PWA-Enabled', 'true');
    response.headers.set('Service-Worker-Allowed', '/');
    
    return response;
  };
}