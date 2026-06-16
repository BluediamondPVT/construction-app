"use client";

import { useState } from "react";
import { Lock, Mail, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(data.redirectUrl);
      } else {
        toast.error(data.message || "Login failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login request failed:", error);
      toast.error("Network error occurred. Please check your console.");
      setIsLoading(false);
    }
  };

  return (
    // 1. Full Screen Wrapper with Hidden Overflow for Background Blobs
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 dark:bg-[#0B1120] px-4 font-sans transition-colors duration-500">
      
      {/* --- MACBOOK STYLE BACKGROUND BLOBS --- */}
      {/* Top Left Blob */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-400/30 dark:bg-purple-600/20 mix-blend-multiply dark:mix-blend-screen blur-[128px] animate-pulse pointer-events-none"></div>
      {/* Bottom Right Blob */}
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-400/30 dark:bg-blue-600/20 mix-blend-multiply dark:mix-blend-screen blur-[128px] animate-pulse pointer-events-none" style={{ animationDelay: "2s" }}></div>
      {/* Center Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-300/20 dark:bg-indigo-900/20 mix-blend-multiply dark:mix-blend-screen blur-[128px] pointer-events-none"></div>

      {/* 2. THE GLASSMORPHISM CARD */}
      <div className="relative w-full max-w-md z-10">
        <div className="rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 sm:p-10 transition-all">
          
          <div className="text-center mb-10">
            <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 border border-white/20">
              <Fingerprint className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Authenticate to access the ERP system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                  <Mail className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 border border-white/40 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 backdrop-blur-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/80 dark:focus:bg-black/40 outline-none transition-all"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                  <Lock className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 border border-white/40 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 backdrop-blur-md focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/80 dark:focus:bg-black/40 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? "Authenticating..." : "Sign In securely"}
            </button>
          </form>
          
        </div>
        
        {/* Subtle Bottom Text */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6 font-medium tracking-wide">
          Enterprise Resource Planning v1.0
        </p>
      </div>
    </div>
  );
}