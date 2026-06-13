"use client";

import React, { useState } from "react";
import { changePassword } from "../services/apis";
import { Lock, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "../UserContext";

export default function ChangePassword() {
  const {setUser} = useUser();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passcode confirmations do not match.");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Security keys must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        "admin",
      );

      if (data.success) {
        toast.success("Credential signature successfully updated!");
        if (setUser) {
          setUser(data.user);
        }
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          window.location.href = "/home/dashboard";
        }, 1000);
      } else {
        toast.error(data.message || "Credential verification sync failed.");
      }
    } catch (err) {
      toast.error("Network synchronization handshake failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // relative layout context ensures the absolute action button anchors properly
    <div className="relative flex-1 p-4 sm:p-6 h-[calc(100vh-120px)] bg-slate-50/50 font-sans flex items-center justify-center">
      {/* Absolute Positioning keeps this action item at the top-left without breaking the form card centering alignment */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <button
          onClick={() => (window.location.href = "/home/settings")}
          className="flex items-center gap-2 text-xs font-sans font-bold text-slate-400 hover:text-slate-700 transition-colors group"
        >
          <ArrowLeft
            size={14}
            className="transform group-hover:-translate-x-0.5 transition-transform"
          />
          Return to Settings Panel
        </button>
      </div>

      {/* Form Card Container — Now dynamically centers itself directly inside the viewport frame */}
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Navigation Actions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-montserrat font-black text-slate-900 text-lg tracking-tight">
                Modify Passcode
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-tight">
                Authorize and override active account master authentication
                secrets.
              </p>
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
              Current Active Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-sans font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
              New Structural Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-sans font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
              Confirm New Password Signature
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-sans font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Submit Actions */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl text-xs font-oswald font-black uppercase tracking-wider text-white shadow-sm transition-all mt-2 ${
              loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
            }`}
          >
            {loading ? "Processing Sync Matrix..." : "Commit Passcode Change"}
          </button>
        </form>
      </div>
    </div>
  );
}
