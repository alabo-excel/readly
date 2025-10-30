import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    try {
        // Check auth status
        const { data: { session } } = await supabase.auth.getSession();

        // Get the pathname of the request
        const pathname = request.nextUrl.pathname;

        // Handle auth routes (login, signup, etc.)
        if (pathname.startsWith('/auth')) {
            if (session) {
                // If user is already logged in, redirect to discover page
                return NextResponse.redirect(new URL('/discover', request.url));
            }
            // Allow access to auth pages for non-authenticated users
            return res;
        }

        // Handle protected routes
        // if (pathname.startsWith('/discover') || pathname.startsWith('/profile')) {
        //     if (!session) {
        //         // If user is not logged in, redirect to login page
        //         return NextResponse.redirect(new URL('/auth/login', request.url));
        //     }
        //     // Allow access to protected routes for authenticated users
        //     return res;
        // }

        // For all other routes, allow access
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
