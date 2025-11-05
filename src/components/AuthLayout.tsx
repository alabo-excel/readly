import React, { useState } from 'react';
import { readingQuotes } from "../app/auth/reading-quotes";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const [quote] = useState(() => {
        const idx = Math.floor(Math.random() * readingQuotes.length);
        return readingQuotes[idx];
    });
    return (

        <div className="min-h-screen flex">
            <div className="flex-1 flex">
                {children}
                <div className="hidden md:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
                    <div className="relative z-10 max-w-xl text-center px-8">
                        <svg className="mx-auto mb-8 text-blue-500" width="64" height="64" fill="none" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M6 4v16h12V4H6zm2 2h8v12H8V6zm2 2v8h4V8h-4z" />
                        </svg>
                        <p className="text-2xl italic text-gray-800 dark:text-gray-100 mb-4 leading-relaxed">"{quote.quote}"</p>
                        <p className="text-base text-gray-500 dark:text-gray-400">— {quote.author}</p>
                    </div>
                    <div className="absolute inset-0 bg-black"></div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;