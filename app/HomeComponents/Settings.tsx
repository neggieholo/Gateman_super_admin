/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Lock,
  AlertCircle,
  Mail,
  CheckCircle2,
  ChevronRight,
  User,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  ArrowLeft,
  Camera,
} from "lucide-react";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { useUser } from "../UserContext";
import { getCloudinaryUrl, sendPofileChangeOtpApi } from "../services/apis";
import TotpMfaSetupComponent from "./AuthenticatorSetup";
import toast from "react-hot-toast";

interface MfaSetupProps {
  onBack: () => void;
  onSuccess: () => void;
}

function MfaSetupComponent({ onBack, onSuccess }: MfaSetupProps) {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-sans font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
      >
        <ArrowLeft size={16} /> Back to Security Selection
      </button>
      <TotpMfaSetupComponent onComplete={onSuccess} />
    </div>
  );
}

export default function Settings() {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [metadata, setMetadata] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyingField, setVerifyingField] = useState<
    "email" | "phone" | "mfa_email" | null
  >(null);

  // Multi-Factor Authentication Layout Controls
  const [activeMfaMode, setActiveMfaMode] = useState<
    "NONE" | "EMAIL" | "TOTP" | "SMS"
  >(
    (user?.mfa_type?.toUpperCase() as "NONE" | "EMAIL" | "TOTP" | "SMS") ||
      "NONE",
  );
  const [mfaEmailEnabled, setMfaEmailEnabled] = useState(false);
  const [mfaTotpEnabled, setMfaTotpEnabled] = useState(false);
  const [mfaSmsEnabled, setMfaSmsEnabled] = useState(false);
  const [displayTotpActivator, setDisplayTotpActivator] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.full_name || "Not set",
    email: user?.email || "Not set",
    phone: user?.phone_number || undefined,
    mfa_enabled: user?.mfa_enabled,
    mfa_type: user?.mfa_type,
    phone_verified: false,
    email_verified: false,
    avatarUrl: user?.avatar_url || undefined,
  });

  // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const hasChanges =
    profile.name !== (user?.full_name || "") ||
    profile.email !== (user?.email || "") ||
    profile.phone !== (user?.phone_number || "") ||
    profile.mfa_enabled !== user?.mfa_enabled ||
    profile.mfa_type !== user?.mfa_type ||
    profile.avatarUrl !== (user?.avatar_url || "");

  useEffect(() => {
    if (user) {
      const normalizedMfa =
        (user.mfa_type?.toUpperCase() as "NONE" | "EMAIL" | "TOTP" | "SMS") ||
        "NONE";

      setActiveMfaMode(normalizedMfa);

      if (user.mfa_enabled) {
        setMfaEmailEnabled(normalizedMfa === "EMAIL");
        setMfaTotpEnabled(normalizedMfa === "TOTP");
        setMfaSmsEnabled(normalizedMfa === "SMS");
      }
      setProfile({
        name: user.full_name || (isEditing ? "" : "Not set"),
        email: user.email || (isEditing ? "" : "Not set"),
        phone: user.phone_number || (isEditing ? "" : undefined),
        mfa_enabled: user.mfa_enabled,
        mfa_type: user.mfa_type,
        phone_verified: user.phone_verified,
        email_verified: user.email_verified,
        avatarUrl: user?.avatar_url || undefined,
      });
    }
  }, [user, isEditing]);

  const handleFieldChange = (field: "email" | "name", value: string) => {
    setProfile((prev) => {
      let isVerified = false;
      if (field === "email") isVerified = value === user?.email;

      return {
        ...prev,
        [field]: value,
        [`${field}_verified`]: isVerified,
      };
    });
  };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || "";
    setProfile((prev) => {
      const originalPhone = user?.phone_number || "";
      const isVerified = phoneValue === originalPhone;

      return {
        ...prev,
        phone: phoneValue,
        phone_verified: isVerified,
      };
    });
  };

  const handleRequestOtp = async (
    target: string,
    type: "email" | "phone" | "mfa_email",
  ) => {
    if (type === "phone" && target && !isValidPhoneNumber(target)) {
      alert("Invalid phone number format.");
      return;
    }
    setVerifyingField(type);
    setOtpLoading(true);
    setError(null);
    try {
      // Map mfa_email target parsing hooks to standard email API rules
      const apiType = type === "mfa_email" ? "email" : type;
      const otpRes = await sendPofileChangeOtpApi(target, apiType);
      if (otpRes.success) {
        setMetadata(otpRes.metadata);
        setShowOtpInput(true);
      } else {
        toast.error(otpRes.message);
        setError(otpRes.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const finalOtpString = newOtp.join("");
    if (finalOtpString.length === 6) {
      handleOtpVerify(finalOtpString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async (finalOtp: string) => {
    setOtpLoading(true);
    try {
      const targetValue =
        verifyingField === "mfa_email" || verifyingField === "email"
          ? profile.email
          : profile.phone;
      const apiType = verifyingField === "mfa_email" ? "email" : verifyingField;

      const res = await fetch("/api/admin/verify-otp-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: finalOtp,
          metadata: metadata,
          target: targetValue,
          type: apiType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (verifyingField === "mfa_email") {
          setMfaEmailEnabled(true);
          setActiveMfaMode("EMAIL");
          setProfile((prev) => ({
            ...prev,
            mfa_enabled: true,
            mfa_type: "email",
          }));
        } else if (verifyingField) {
          setProfile((prev) => ({
            ...prev,
            [`${verifyingField}_verified`]: true,
          }));
        }
        setShowOtpInput(false);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(data.message || "Invalid Code");
      }
    } catch (err) {
      console.log(err);
      setError("Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    setShowOtpInput(false);
    setVerifyingField(null);
  };

  const handleSaveConfig = async () => {
    if (!hasChanges) {
      alert("No changes detected to save.");
      return;
    }
    if (profile.email !== user?.email && !profile.email_verified) {
      alert("Please verify your new email address before saving.");
      return;
    }
    if (profile.phone !== user?.phone_number && !profile.phone_verified) {
      alert("Please verify your new phone number before saving.");
      return;
    }
    setSaving(true);
    const payload = {
      config: {
        admin_name: profile.name,
        email: profile.email,
        phone_number: profile.phone,
        mfa_enabled: profile.mfa_enabled,
        mfa_type: profile.mfa_type,
        avatar_url: profile.avatarUrl,
      },
    };

    try {
      const res = await fetch("/api/master/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        window.location.reload();
        setIsEditing(false);
        toast.success("Configuration saved!");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);

    setProfile((prev) => ({
      ...prev,
      avatarUrl: localPreviewUrl,
    }));

    setError(null);
    try {
      const uploadedUrl = await getCloudinaryUrl(file, "image");

      if (uploadedUrl) {
        setProfile((prev) => ({
          ...prev,
          avatarUrl: uploadedUrl,
        }));
        toast.success("Avatar staged securely!");
      } else {
        toast.error("Avatar upload failed. Reverting changes.");
        setProfile((prev) => ({
          ...prev,
          avatarUrl: user?.avatar_url || undefined,
        }));
      }
    } catch (err) {
      console.error("Avatar handling layout exception:", err);
      toast.error("An error occurred during image staging execution.");
      setProfile((prev) => ({
        ...prev,
        avatarUrl: user?.avatar_url || undefined,
      }));
    } finally {
      // Clean up the local browser object memory leak loop safely
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  const handleCancel = () => {
    setProfile({
      name: user?.full_name || "Not set",
      email: user?.email || "Not set",
      phone: user?.phone_number || undefined,
      mfa_enabled: user?.mfa_enabled,
      mfa_type: user?.mfa_type,
      phone_verified: false,
      email_verified: false,
      avatarUrl: user?.avatar_url || undefined,
    });
    setIsEditing(false);
    setError(null);
  };

  const handleTotpActivationSuccess = () => {
    setMfaTotpEnabled(true);
    setActiveMfaMode("TOTP");
    setProfile((prev) => ({
      ...prev,
      mfa_enabled: true,
      mfa_type: "totp",
    }));
    setDisplayTotpActivator(false);
  };

  if (displayTotpActivator) {
    return (
      <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 h-[calc(100vh-120px)] bg-slate-50/50 font-sans">
        <h1 className="text-2xl font-montserrat font-black text-slate-900 tracking-tight">
          Security Safeguards
        </h1>
        <MfaSetupComponent
          onBack={() => setDisplayTotpActivator(false)}
          onSuccess={handleTotpActivationSuccess}
        />
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 h-[calc(100vh-120px)] bg-slate-50/50 font-sans">
      {/* Settings Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 tracking-tight">
            Terminal Configuration
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage global identity specifications and core validation profiles.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {isEditing && (
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() =>
              isEditing ? handleSaveConfig() : setIsEditing(true)
            }
            disabled={isEditing && (saving || !hasChanges)}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
              isEditing
                ? !hasChanges || saving
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isEditing
              ? saving
                ? "Saving..."
                : "Save Configuration"
              : "Edit Settings"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Workstation Panel */}
          <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Top Left Workspace: Avatar / Initials Layout Block */}
              <div className="w-full md:w-1/4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-3xl border border-slate-100 shrink-0">
                <div
                  className="relative w-36 h-36 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-montserrat font-bold text-3xl tracking-wide shadow-inner overflow-hidden group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      crossOrigin="anonymous"
                      alt="User Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : profile.name !== "Not set" && profile.name ? (
                    profile.name.slice(0, 2).toUpperCase()
                  ) : (
                    <User size={36} />
                  )}

                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9px] font-oswald font-black uppercase tracking-wider">
                      <Camera size={16} />
                      <span>Upload</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-emerald-500 rounded-xl text-white border-2 border-white shadow-sm z-10">
                    <ShieldCheck size={14} />
                  </div>
                </div>
                <span className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest mt-3 text-center">
                  Active Admin Avatar
                </span>
              </div>

              {/* Right Workspace Fields: Input Parameters */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                    Full Name Signature
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-sans font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                    Email Endpoint
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={profile.email}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-sans font-bold text-slate-900 pr-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center z-10">
                      {profile.email_verified ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                          <CheckCircle2 size={12} strokeWidth={3} />
                          <span className="text-[9px] font-oswald font-black uppercase tracking-tighter">
                            Verified
                          </span>
                        </div>
                      ) : isEditing ? (
                        <button
                          onClick={() =>
                            handleRequestOtp(profile.email, "email")
                          }
                          className="bg-amber-500 text-white px-2.5 py-1.5 rounded-xl text-[9px] font-oswald font-black uppercase active:scale-95 transition-transform"
                        >
                          Verify
                        </button>
                      ) : (
                        <div className="bg-red-500 text-white px-2.5 py-1.5 rounded-xl text-[9px] font-oswald font-black uppercase active:scale-95 transition-transform">
                          Unverified
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                    Phone
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full p-2 bg-slate-50 rounded-2xl border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm transition-all gap-2">
                    {!isEditing && !profile.phone ? (
                      <div className="flex-1 p-2 font-sans font-bold text-slate-400 text-sm">
                        Not set
                      </div>
                    ) : (
                      <PhoneInput
                        international
                        defaultCountry="NG"
                        disabled={!isEditing}
                        value={
                          profile.phone === "Not set"
                            ? undefined
                            : profile.phone
                        }
                        onChange={handlePhoneChange}
                        className="flex-1 font-sans font-bold text-slate-900 ml-2 text-sm"
                      />
                    )}
                    <div className="flex items-center justify-end">
                      {profile.phone_verified ? (
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                          <CheckCircle2 size={12} strokeWidth={3} />
                          <span className="text-[9px] font-oswald font-black uppercase tracking-tighter">
                            Verified
                          </span>
                        </div>
                      ) : isEditing && profile.phone ? (
                        <button
                          onClick={() =>
                            handleRequestOtp(profile.phone!, "phone")
                          }
                          className="w-full sm:w-auto bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-oswald font-black uppercase active:scale-95 transition-transform"
                        >
                          Verify
                        </button>
                      ) : (
                        <div className="bg-red-500 text-white px-2.5 py-1.5 rounded-xl text-[9px] font-oswald font-black uppercase active:scale-95 transition-transform">
                          Unverified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MFA Integrated Configuration Segment */}
          <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={20} />
                <h2 className="font-montserrat font-bold text-slate-900">
                  Multi-Factor Gateway Layout
                </h2>
              </div>
              <span className="px-3 py-1 rounded-xl text-[9px] font-oswald font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                {activeMfaMode === "NONE"
                  ? "Protection Disabled"
                  : `${activeMfaMode} Guard Active`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                disabled={mfaEmailEnabled}
                onClick={() => {
                  if (!profile.email_verified) {
                    alert("Please verify your email");
                  } else {
                    handleRequestOtp(profile.email, "mfa_email");
                  }
                }}
                className={`p-4 text-left border rounded-2xl transition-all flex flex-col justify-between h-36 ${
                  mfaEmailEnabled
                    ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <Mail
                    className={
                      mfaEmailEnabled ? "text-indigo-600" : "text-slate-400"
                    }
                    size={22}
                  />
                  {mfaEmailEnabled && (
                    <span className="bg-emerald-100 text-emerald-800 text-[8px] font-oswald font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md">
                      Enabled
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Email Code Verification
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Requires matching 6-digit confirmation key validation loops.
                  </p>
                </div>
              </button>

              {/* Option 2: TOTP Application Custom Setup */}
              <button
                type="button"
                disabled={mfaTotpEnabled}
                onClick={() => setDisplayTotpActivator(true)}
                className={`p-4 text-left border rounded-2xl transition-all flex flex-col justify-between h-36 ${
                  mfaTotpEnabled
                    ? "border-indigo-600 bg-indigo-50/30"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <Smartphone
                  className={
                    mfaTotpEnabled ? "text-indigo-600" : "text-slate-400"
                  }
                  size={22}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Authenticator App
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Leverage cryptographic local signatures like Google
                    Authenticator.
                  </p>
                </div>
              </button>

              {/* Option 3: SMS Option (Placeholder Only Mode) */}
              <button
                type="button"
                disabled={mfaSmsEnabled}
                onClick={() => setActiveMfaMode("SMS")}
                className={`p-4 text-left border rounded-2xl transition-all flex flex-col justify-between h-36 border-dashed opacity-75 ${
                  mfaSmsEnabled
                    ? "border-indigo-400 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <MessageSquare className="text-slate-400" size={22} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-500">
                      SMS Network Gate
                    </h4>
                    <span className="text-[8px] font-oswald font-black uppercase text-amber-600 bg-amber-50 px-1 rounded">
                      Soon
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Dispatches standard cell channel text authorizations over
                    carrier nodes.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Configuration Parameters */}
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-4xl border border-slate-100 shadow-sm space-y-2">
            <button
              onClick={() => (window.location.href = "/home/change-password")}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Lock size={18} />
                </div>
                <span className="font-sans font-bold text-slate-700 text-sm">
                  Security Password Change
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* SHARED HANDSHAKE OTP MODAL SYSTEM OVERLAY */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Mail size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Authorization Challenge Token
              </h3>
              <p className="text-slate-500 text-xs">
                Provide the 6-digit confirmation key deployed to verification
                endpoint.
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
                  className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-left-1">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              {otpLoading && (
                <div className="w-full py-3 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={handleCancelOtp}
                className="w-full py-2 text-slate-400 font-medium hover:text-slate-600 text-xs transition-colors"
              >
                Dismiss Verification Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
