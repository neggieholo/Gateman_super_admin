/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { db } from "../services/database";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeClosed,
  Smartphone,
} from "lucide-react";
import { useUser } from "../UserContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { checkSession, sendOtpApi } from "../services/apis";
import toast from "react-hot-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useUser();
  const router = useRouter();
  const [mfaType, setMfaType] = useState<"EMAIL" | "TOTP" | "NONE">("NONE");
  // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [sessionLoading, setSessionLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [metadata, setMetadata] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  });

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    async function cSessionCheck() {
      const hasAttemptedLogout = sessionStorage.getItem("loggedOut") === "true";

      if (hasAttemptedLogout) {
        sessionStorage.removeItem("loggedOut");
        setSessionLoading(false);
        return;
      }

      try {
        const res = await checkSession();
        if (res.success) {
          setUser(res.user);
          window.location.replace("/home/dashboard");
        } else {
          setSessionLoading(false);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setSessionLoading(false);
      }
    }

    cSessionCheck();
  }, []);

  const validateEmail = (text: string) => {
    const cleanedEmail = text.trim();
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (reg.test(cleanedEmail)) {
      return true;
    }
    return false;
  };

  const handleRequestOtp = async () => {
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      alert("Invalid Email. Check your email format.");
      setLoading(false);
      return;
    }

    setError("");
    setRequestingOtp(true);

    try {
      const otpRes = await sendOtpApi(trimmedEmail);
      if (otpRes.success) {
        setMetadata(otpRes.metadata);
        setShowOtpInput(true);
      } else {
        setError(otpRes.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1); // Only last char
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Move focus forward
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const finalOtpString = newOtp.join("");
    if (finalOtpString.length === 6) {
      handleOtpVerify(finalOtpString);
    }
  };

  const handleOtpVerify = async (finalOtp: string) => {
    setOtpLoading(true);
    setError(null);

    try {
      // Both branches hit your unified login verification gate
      const response = await fetch("/api/master/verify-otp-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: finalOtp,
          target: email,
          type: mfaType === "TOTP" ? "totp" : "email",
          metadata: mfaType === "EMAIL" ? metadata : undefined,
          rememberMe: rememberMe,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        router.push("/home/dashboard");
        setShowOtpInput(false);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(data.message || "Verification failed. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Connection to verification engine failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Inside your component
  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]); // Reset the 6 boxes
    setError(""); // Clear any previous "Invalid Code" errors
    setShowOtpInput(false); // Close the modal
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isForgot) {
        const res = await db.forgotPassword(email, "superadmin");

        if (res.success) {
          toast.success("A Super Admin reset link has been sent!");
          setIsForgot(false);
          setIsLogin(true);
        } else {
          throw new Error(res.message || "Failed to send reset link");
        }
      } else {
        const data = await db.authenticate(email, password, rememberMe);
        if (
          !data ||
          (typeof data === "string" && data.includes("<!DOCTYPE html>"))
        ) {
          setError("Infrastructure error. Contact system dev.");
          return;
        }

        if (data.status === "PASSWORD_RESET_REQUIRED") {
          setLoading(false);

          toast.error(
            (t) => (
              <div className="flex flex-col gap-1.5 p-1">
                <p className="font-sans font-black text-slate-900 text-sm tracking-tight">
                  Administrative Account Lock
                </p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  An administrative password reset has been triggered for your
                  security profile. Please contact the{" "}
                  <strong>System Registrar</strong> to authorize and assign your
                  new login credentials.
                </p>
                <div className="flex justify-end mt-1">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-oswald font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity, // Prevents it from auto-vanishing so Simon can read it fully
              position: "top-center",
            },
          );
          return;
        }

        if (data.success && data.user && !data.user.email_verfied) {
          setUser(data.user);
          setMfaType("EMAIL");
          setLoading(false);

          await handleRequestOtp();
          return;
        }

        // CATCH EMAIL MFA INTERRUPTION
        if (data.status === "EMAIL_MFA_REQUIRED") {
          setUser(data.user);
          setMfaType("EMAIL");
          setLoading(false);

          // Fire off your native frontend OTP generator method automatically!
          await handleRequestOtp();
          return;
        }

        // CATCH TOTP AUTHENTICATOR APP INTERRUPTION
        if (data.status === "TOTP_MFA_REQUIRED") {
          setUser(data.user);
          setMfaType("TOTP");
          setShowOtpInput(true); // Open the entry boxes directly (no delivery cycle needed)
          setLoading(false);
          return;
        }

        if (data.success) {
          setUser(data.user);
          if (data.onboarding?.showPasswordWarningPopup) {
            localStorage.setItem("DASHBOARD_PASS_WARN", "true");
          }
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

  if (sessionLoading)
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Your Logo */}
          <Image
            src="/gmlogo_nobg.jpg"
            alt="GateMan Logo"
            width={80}
            height={80}
            priority
            className="object-contain"
          />

          {/* Rotating Spinner Ring */}
          <div className="absolute inset-0 border-4 border-slate-100 border-t-gm-charcoal rounded-full animate-spin" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex bg-[linear-gradient(to_bottom,#1C1C1E_50%,#f1f5f9_50%)]">
      {/* Left Side - Branding */}
      <div
        className="hidden lg:flex lg:w-2/3 bg-gm-charcoal relative overflow-hidden"
        style={{ borderRadius: "0px 0px 120px 0px" }}
      >
        <div className="absolute inset-0 mix-blend-multiply z-10" />
        <div className="relative z-20 flex flex-col justify-between items-start h-full p-16 text-white">
          <div className="relative w-full h-50 flex items-center overflow-hidden self-start">
            <Image
              src="/gmadminlogo.jpg"
              alt="GateMan Logo"
              fill
              priority
              className="object-contain object-left"
            />
          </div>

          <div className="space-y-6 max-w-lg">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-sans font-bold uppercase tracking-widest">
              System Control Center
            </div>
            <h1 className="text-5xl font-montserrat font-bold leading-tight">
              Platform
              <br />
              Administration.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-oswald">
              Manage global estate deployments, monitor system health, and
              oversee financial transactions across the GateMan ecosystem.
            </p>

            <div className="flex gap-4 pt-4">
              <div className="flex flex-col justify-center border-l-2 border-indigo-500 pl-4">
                <span className="font-montserrat text-sm tracking-wide">
                  GATE MAN HEADQUARTERS
                </span>
                <span className="text-xs font-sans text-slate-400">
                  Authorized Personnel Only
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-indigo-200/60 font-oswald">
            © 2026 Gateman Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-100"
        style={{ borderRadius: "120px 0px 0px 0px" }}
      >
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="text-center">
            <h2 className="text-3xl font-montserrat text-slate-900 tracking-tight mb-2">
              {isLogin ? "Super Admin Login" : "Master Reset"}
            </h2>
            <p className="text-slate-500 font-sans">
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
            {/* <div>
              <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
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
            </div> */}

            <div>
              <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                Email
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
                <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                    placeholder="••••••••"
                  />
                  {/* Moved to the right and added cursor-pointer */}
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {show ? <Eye size={20} /> : <EyeClosed size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* {isLogin && !isForgot && (
              <div className="flex items-center mt-4">
                <input
                  id="remember_me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setRememberMe(isChecked);
                    localStorage.setItem("rememberMe", String(isChecked));
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-700 font-sans"
                >
                  Remember me
                </label>
              </div>
            )} */}

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
                  className="text-sm font-oswald text-gm-gold hover:text-gm-gold/60 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white bg-gm-charcoal/60 hover:bg-gm-charcoal focus:ring-4 focus:ring-indigo-300 font-montserrat rounded-2xl text-lg px-5 py-4 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {requestingOtp || loading ? (
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
                className="text-sm font-oswald text-gm-gold hover:text-gm-gold/60"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
      {/* OTP MODAL OVERLAY */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl scale-in-center border border-slate-100">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {mfaType === "EMAIL" ? (
                  <Mail size={32} />
                ) : (
                  <Smartphone size={32} />
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {mfaType === "EMAIL"
                  ? "Verify your email"
                  : "Device Verification"}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {mfaType === "EMAIL" ? (
                  <>
                    We&apos;ve sent a 6-digit code to <br />
                    <span className="font-semibold text-slate-900">
                      {email}
                    </span>
                  </>
                ) : (
                  <>
                    Open your authenticator security application and enter{" "}
                    <br />
                    the changing{" "}
                    <span className="font-semibold text-slate-900">
                      6-digit token
                    </span>{" "}
                    linked to your terminal.
                  </>
                )}
              </p>
            </div>

            <div className="flex justify-between gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              ))}
            </div>

            <div
              className={`mb-4 ${error ? "bg-rose-50 border border-rose-100" : "bg-transparent"} text-rose-600 p-3 min-h-12 rounded-xl flex items-center gap-3 text-sm font-bold transition-all duration-300`}
            >
              {error && (
                <>
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="animate-in slide-in-from-left-1">
                    {error}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-4">
              {otpLoading && (
                <button
                  disabled
                  className="w-full py-4 bg-gm-charcoal text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center transition-all"
                >
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </button>
              )}

              <button
                onClick={handleCancelOtp}
                className="w-full py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Only display resend prompt for transactional emails */}
            {mfaType === "EMAIL" && (
              <p className="text-center text-xs text-slate-400 mt-6">
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleRequestOtp}
                  className="text-gm-charcoal font-bold hover:underline"
                >
                  Resend
                </button>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
