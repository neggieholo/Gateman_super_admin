"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react"; 
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";


interface TotpMfaSetupProps {
  onComplete: () => void;
}

export default function TotpMfaSetupComponent({ onComplete }: TotpMfaSetupProps) {
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // State from Backend response
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);

  // User Verification Input Code
  const [verificationCode, setVerificationCode] = useState("");

  // Step 1: Tell backend to generate a fresh secret
  const handleInitiateMfa = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/master/mfa/setup", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setTempSecret(data.secret);
        setQrCodeUri(data.qrCodeUri);
      } else {
        setError(data.message || "Failed to initialize MFA setup.");
        toast.error(data.message || "Failed to initialize MFA setup.");
      }
    } catch (err) {
      setError("Network connectivity error.");
      toast.error("Network connectivity error.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate the user's first generated app code
  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setVerificationLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/master/mfa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verificationCode,
          secret: tempSecret,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTempSecret(null);
        setQrCodeUri(null);

        onComplete();
      } else {
        setError(data.message || "Invalid code matrix mismatch.");
        toast.error(data.message || "Invalid code matrix mismatch.");
      }
    } catch (err) {
      setError("Verification failed.");
      toast.error("Verification failed.");
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-100/40">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-montserrat">
            Authenticator App
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Secure root terminal operations
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 p-3.5 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">MFA Activated Status</p>
            <p className="text-xs text-emerald-600/80">
              Google Authenticator is now successfully linked.
            </p>
          </div>
        </div>
      )}

      {!qrCodeUri && !success && (
        <button
          onClick={handleInitiateMfa}
          disabled={loading}
          className="w-full py-3.5 bg-gm-charcoal hover:bg-slate-800 text-white rounded-2xl font-semibold tracking-wide shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Enable App Authentication"
          )}
        </button>
      )}

      {qrCodeUri && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-center">
            {/* Render the scannable URI string as a clean vector QR image */}
            <QRCodeSVG
              value={qrCodeUri}
              size={200}
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed font-sans">
            <p>
              1. Open your Authenticator Application (Google Authenticator,
              Authy, etc.).
            </p>
            <p>
              2. Tap the scan button and clear focus on the code grid window
              image shown above.
            </p>
            <p>
              3. Enter the changing 6-digit confirmation key below to link
              settings variables.
            </p>
          </div>

          <form onSubmit={handleVerifyAndActivate} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              className="w-full tracking-widest text-center text-2xl font-bold bg-slate-50 border border-slate-100 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
            />

            <button
              type="submit"
              disabled={verificationLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold tracking-wide transition-all shadow-md flex items-center justify-center disabled:opacity-50"
            >
              {verificationLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Confirm & Save Configuration"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
