"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { SuperAdminUser } from "../services/types";
import { forceOverrideSubAccountPasswordApi } from "../services/apis";

interface AdminPasswordOverrideModalProps {
  user: SuperAdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordOverrideModal({
  user,
  isOpen,
  onClose,
}: AdminPasswordOverrideModalProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate a secure token string on initialization
  const generateSecurePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let securePass = "";
    for (let i = 0; i < 12; i++) {
      securePass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(securePass);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateSecurePassword();
    } else {
      setPassword("");
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard string context.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to write password token to clipboard.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      toast.error("Password configuration must be at least 6 tokens long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forceOverrideSubAccountPasswordApi(user.id, password);
      if (res.success) {
        toast.success(
          res.message || `Credentials updated for ${user.full_name}`,
        );
        onClose();
      } else {
        toast.error(res.message || "Credential override mutation rejected.");
      }
    } catch (err) {
      toast.error(
        "Network synchronization exception modifying access credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header Guard Strip */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5 text-amber-600">
            <ShieldAlert size={20} />
            <h3 className="font-montserrat font-black text-sm text-slate-900 uppercase tracking-tight">
              Force Credential Override
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Operational Context Form Block */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-4 bg-amber-50/60 border border-amber-100/70 rounded-2xl space-y-1">
            <h4 className="text-xs font-bold text-amber-800 leading-tight">
              Target Profile: {user.full_name}
            </h4>
            <p className="text-[11px] font-medium text-amber-700/90 leading-normal">
              This action explicitly overwrites the database security key row
              mapping. The user will be requested to re-verify credentials and
              provide a fresh password key upon their next authentication phase.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-oswald font-black uppercase tracking-widest text-slate-400 block">
              New Security Access Key Value
            </label>
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <KeyRound
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter custom override password configuration string..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                  required
                />
              </div>

              {/* Copy String Button Context */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy configuration token sequence to clipboard"
                className="p-3 bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-2xl transition-colors shadow-sm"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>

              {/* Regenerate Random Core Key */}
              <button
                type="button"
                onClick={generateSecurePassword}
                title="Generate secure random key allocation string"
                className="p-3 bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-2xl transition-colors shadow-sm"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Action Operations Control Splitter */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200/70 text-slate-600 font-sans font-bold text-xs rounded-2xl transition-colors"
            >
              Cancel Operation
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-2xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Core Map...
                </>
              ) : (
                "Commit Configuration"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
