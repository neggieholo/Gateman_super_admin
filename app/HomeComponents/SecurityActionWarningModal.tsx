"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";

interface SecurityActionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: "danger" | "warning";
}

export default function SecurityActionWarningModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm Action",
  variant = "warning",
}: SecurityActionWarningModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Action execution interception error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header Alert Strip */}
        <div
          className={`p-5 border-b border-slate-100 flex justify-between items-center ${isDanger ? "bg-rose-50/50" : "bg-amber-50/50"}`}
        >
          <div
            className={`flex items-center gap-2.5 ${isDanger ? "text-rose-600" : "text-amber-600"}`}
          >
            <ShieldAlert size={20} />
            <h3 className="font-montserrat font-black text-xs text-slate-900 uppercase tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Informational Message Context */}
        <div className="p-6 space-y-5">
          <p className="text-xs font-sans font-medium text-slate-600 leading-relaxed">
            {message}
          </p>

          {/* Action Call Controls */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200/70 text-slate-600 font-sans font-bold text-xs rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={isSubmitting}
              className={`flex-1 py-3 text-white font-sans font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
