
"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "../../../components/AuthLayout";
import Link from "next/link";


const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username },
            },
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSuccess("Signup successful!");
        }
    };

    return (
        <AuthLayout>
            <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Sign Up</h2>
                    <form onSubmit={handleSignup} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200  "
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200  "
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-semibold text-base border-none transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg cursor-pointer'}`}
                        >
                            {loading ? "Signing up..." : "Sign Up"}
                        </button>
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        {success && <p className="text-green-500 text-center">{success}</p>}
                    </form>
                    <p className="mt-4">Already have an account? <Link className="text-blue-500" href={'/auth/login'}>Log In</Link></p>

                </div>
            </div>
        </AuthLayout>
    );
};

export default Signup;