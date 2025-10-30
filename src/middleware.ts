import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Create a response to modify its headers
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    try {
        // Refresh the session and get the latest state
        const {
            data: { session },
        } = await supabase.auth.getSession();

        const pathname = request.nextUrl.pathname;

        // If accessing auth pages while logged in, redirect to discover
        if (pathname.startsWith('/auth')) {
            if (session?.user) {
                console.log('Middleware: User is logged in, redirecting from auth page...');
                const redirectUrl = new URL('/discover', request.url);
                return NextResponse.redirect(redirectUrl);
            }
            return res;
        }

        return res;
    } catch (error) {
        console.error('Middleware error:', error);
        return res;
    }
}


// Configure which routes to apply middleware to
export const config = {
    matcher: [
        // Auth routes
        '/auth/:path*',
        // Protected routes (root and subpaths)
        '/discover',
        '/discover/:path*',
        '/profile',
        '/profile/:path*',
    ],
};
