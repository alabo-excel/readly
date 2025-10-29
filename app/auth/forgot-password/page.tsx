"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "../components/AuthLayout";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/auth/reset-password",
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSuccess("Password reset email sent! Check your inbox.");
        }
    };

    return (
        <AuthLayout>
            <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center ">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Forgot Password</h2>
                    <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-lg border  "
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-semibold text-base border-none transition-all duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg cursor-pointer'}`}
                        >
                            {loading ? "Sending..." : "Send Reset Email"}
                        </button>
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        {success && <p className="text-green-500 text-center">{success}</p>}
                    </form>
                </div>
            </div>
        </AuthLayout>


    );
};

export default ForgotPassword;
