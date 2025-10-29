
"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { readingQuotes } from "../reading-quotes";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [quote] = useState(() => {
        const idx = Math.floor(Math.random() * readingQuotes.length);
        return readingQuotes[idx];
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSuccess("Login successful!");
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex">
                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Login</h2>
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border  "
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-semibold text-base border-none transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg cursor-pointer'}`}
                            >
                                {loading ? "Logging in..." : "Login"}
                            </button>
                            {error && <p className="text-red-500 text-center">{error}</p>}
                            {success && <p className="text-green-500 text-center">{success}</p>}
                        </form>
                    </div>
                </div>
                <div className="hidden md:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
                    <div className="relative z-10 max-w-xl text-center px-8">
                        <svg className="mx-auto mb-8 text-blue-500 dark:text-blue-400" width="64" height="64" fill="none" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M6 4v16h12V4H6zm2 2h8v12H8V6zm2 2v8h4V8h-4z" />
                        </svg>
                        <p className="text-2xl italic text-gray-800 dark:text-gray-100 mb-4 leading-relaxed">"{quote.quote}"</p>
                        <p className="text-base text-gray-600 dark:text-gray-400">— {quote.author}</p>
                    </div>
                    <div className="absolute inset-0 bg-black"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;