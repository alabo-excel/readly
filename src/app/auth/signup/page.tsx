
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "../../../components/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleAuthSession } from "@/lib/utils/auth";


const Signup = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        // Check if user is already logged in
        handleAuthSession();
    }, []);
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Basic validation
        if (!username.trim()) {
            setError("Username is required");
            setLoading(false);
            return;
        }

        if (!email.trim()) {
            setError("Email is required");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                    emailRedirectTo: `${window.location.origin}/auth/login`
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess("Signup successful! Please check your email for confirmation.");
                // If email confirmation is not required, handle immediate login
                if (data.session) {
                    router.push('/discover');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
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