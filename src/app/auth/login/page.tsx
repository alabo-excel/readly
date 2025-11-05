
"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "../../../components/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleAuthSession } from "@/lib/utils/auth";

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // useEffect(() => {
    //     const checkAuth = async () => {
    //         const { data: { session } } = await supabase.auth.getSession();
    //         console.log('Current session:', session);
    //         if (session?.user?.id) {
    //             console.log('Redirecting to discover...');
    //             window.location.href = '/discover';
    //         }
    //     };
    //     checkAuth();
    // }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else if (data?.session?.user) {
                setSuccess("Login successful!");
                console.log('Login successful, redirecting...');
                // Set a small delay to ensure the session is properly set
                setTimeout(() => {
                    window.location.href = '/discover';
                }, 500);
            } else {
                setError("No session created. Please try again.");
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
                            className={`w-full py-3 rounded-lg bg-blue-500 dark:bg-blue-500 text-white font-semibold text-base border-none transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-500 hover:shadow-lg cursor-pointer'}`}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        {success && <p className="text-green-500 text-center">{success}</p>}
                    </form>
                    <div className="md:flex gap-4 justify-between">
                        <p className="mt-4">Don't have an account? <Link className="text-blue-500" href={'/auth/signup'}>Sign Up</Link></p>
                        <p className="mt-4"><Link href={'/auth/forgot-password'}>Forgot your password? </Link></p>
                    </div>
                </div>
            </div>
        </AuthLayout>


    );
};

export default Login;