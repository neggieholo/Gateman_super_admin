/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { db } from "../services/database";
import {
  Mail,
  Lock,
  ShieldCheck, // Swapped UserIcon for ShieldCheck
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useUser } from "../UserContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useUser();
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isForgot) {
        // Explicitly targeting 'superadmin' role in your database service
        const res = await db.forgotPassword(email, "superadmin");

        if (res.success) {
          alert("A Super Admin reset link has been sent!");
          setIsForgot(false);
          setIsLogin(true);
        } else {
          throw new Error(res.message || "Failed to send reset link");
        }
      } else {
        const data = await db.authenticate(email, password, name);
        if (
          !data ||
          (typeof data === "string" && data.includes("<!DOCTYPE html>"))
        ) {
          setError("Infrastructure error. Contact system dev.");
          return;
        }
        if (data.success) {
          setUser(data.user);
          router.push("/home/dashboard");
        } else {
          const errorMessage =
            data.error || data.message || "Authentication failed";

          if (
            errorMessage.includes("Unexpected token") ||
            errorMessage.includes("fetch")
          ) {
            setError("The core server is rebooting. Stand by.");
          } else {
            setError(errorMessage);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "A system error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 mix-blend-multiply z-10" />
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          alt="Corporate Building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-16 text-white">
          <div className="relative w-full h-32 rounded-2xl flex items-center overflow-hidden">
            <Image
              src="/gateman_w_nobg_cropped.png"
              alt="GateMan Logo"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-widest">
              System Control Center
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Platform
              <br />
              Administration.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Manage global estate deployments, monitor system health, and
              oversee financial transactions across the GateMan ecosystem.
            </p>

            <div className="flex gap-4 pt-4">
              <div className="flex flex-col justify-center border-l-2 border-indigo-500 pl-4">
                <span className="font-bold text-sm tracking-wide">
                  GATE MAN HEADQUARTERS
                </span>
                <span className="text-xs text-slate-400">
                  Authorized Personnel Only
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500 font-medium">
            © 2026 Gateman Inc. • Internal Super Admin Terminal
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {isLogin ? "Super Admin Login" : "Master Reset"}
            </h2>
            <p className="text-slate-500">
              {isLogin
                ? "Enter credentials to access root controls"
                : "Enter registered email to reset master access"}
            </p>
          </div>

          <div
            className={`${error ? "bg-rose-50" : "bg-white"} text-rose-600 p-2 h-12 rounded-xl flex items-center gap-3 text-sm font-bold ${error && "border border-rose-100"}`}
          >
            {error && (
              <>
                <AlertCircle size={18} />
                {error}
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                Admin Signature / Name
              </label>
              <div className="relative">
                <ShieldCheck
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                  placeholder="Simon"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                  placeholder="admin@gateman.co"
                />
              </div>
            </div>

            {isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                  Master Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(true);
                    setIsLogin(false);
                    setError(null);
                    setEmail("");
                  }}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white bg-slate-900 hover:bg-black focus:ring-4 focus:ring-slate-300 font-bold rounded-2xl text-lg px-5 py-4 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Authenticate" : "Generate Reset Link"}
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>

          {isForgot && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  setIsLogin(true);
                  setError(null);
                }}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
              >
                Return to Master Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
