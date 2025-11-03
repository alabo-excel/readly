"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    window.location.href = '/auth/login';
                }
            } catch (error) {
                console.error('Session check error:', error);
                window.location.href = '/auth/login';
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth/login';
    };

    const isPathActive = (path: string) => {
        // Exact match or starts with the path (for sub-routes)
        return pathname === path || pathname.startsWith(path + '/');
    };

    const navItems = [
        {
            name: 'Discover',
            path: '/discover',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
        },
        {
            name: 'Library',
            path: '/library',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        // {
        //     name: 'Profile',
        //     path: '/profile',
        //     icon: (
        //         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        //         </svg>
        //     ),
        // },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <div className="hidden md:fixed md:top-0 md:left-0 md:h-screen md:w-[20%] md:bg-black md:block">
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <Link href="/discover" className="flex items-center space-x-2">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Readly</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${isPathActive(item.path)
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Logout button */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="md:max-w-[80%] md:ml-auto flex-1 bg-gray-50 dark:bg-gray-950 min-h-screen pb-20 md:pb-0">
                {children}
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-200 dark:border-gray-800">
                <nav className="flex items-center justify-around p-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isPathActive(item.path)
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {item.icon}
                            <span className="text-xs mt-1">{item.name}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-xs mt-1">Logout</span>
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default DashboardLayout;