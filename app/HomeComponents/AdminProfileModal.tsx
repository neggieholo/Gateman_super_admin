/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SuperAdminUser } from "../services/types";
import { SYSTEM_PERMISSIONS } from "../services/data";
import { formatDate } from "../services/apis";

interface AdminProfileModalProps {
  user: SuperAdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminProfileModal({
  user,
  isOpen,
  onClose,
}: AdminProfileModalProps) {
  // 🎯 Internal state to track full-screen image expansion preview
  const [showImagePreview, setShowImagePreview] = useState(false);

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Modal Container */}
        <div className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-4xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header Block */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-montserrat font-black uppercase tracking-wider text-slate-200">
                  Administrative Security Profile
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all outline-none"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Identity Header Card Row */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50 border border-slate-100 rounded-3xl">
              {/* Avatar Render Vector */}
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  onClick={() => setShowImagePreview(true)}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md shadow-slate-200 cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-montserrat font-black text-2xl shadow-inner uppercase shrink-0">
                  {user.full_name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-montserrat font-black text-slate-900 tracking-tight">
                    {user.full_name}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-oswald font-black uppercase tracking-wider border ${
                      user.is_active
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "bg-rose-50 border-rose-200 text-rose-600"
                    }`}
                  >
                    {user.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  {user.sub_account && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-oswald font-black uppercase tracking-wider">
                      SUB-ACCOUNT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium font-mono break-all flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={12} /> {user.email}
                </p>
              </div>
            </div>

            {/* Quick Metrics Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Attributes Panel */}
              <div className="p-4 border border-slate-100 rounded-2xl space-y-3 bg-white shadow-sm">
                <h4 className="text-[10px] font-oswald font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1.5">
                  Communication Vectors
                </h4>
                <div className="space-y-2.5 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Phone size={13} /> Phone:
                    </span>
                    <span className="font-mono">
                      {user.phone_number || "Unspecified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar size={13} /> Registered:
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Guard Status Panel */}
              <div className="p-4 border border-slate-100 rounded-2xl space-y-3 bg-white shadow-sm">
                <h4 className="text-[10px] font-oswald font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-1.5">
                  Identity Verification Matrix
                </h4>
                <div className="space-y-2.5 text-xs font-bold">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">
                      Email Verification:
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] uppercase font-oswald font-black ${user.email_verified ? "text-emerald-600" : "text-amber-500"}`}
                    >
                      {user.email_verified ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <AlertCircle size={13} />
                      )}
                      {user.email_verified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">
                      Device Phone Binding:
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] uppercase font-oswald font-black ${user.phone_verified ? "text-emerald-600" : "text-amber-500"}`}
                    >
                      {user.phone_verified ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <AlertCircle size={13} />
                      )}
                      {user.phone_verified ? "VERIFIED" : "UNBOUND"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MFA Protection Policy Snapshot */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                user.mfa_enabled
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                  : "bg-rose-50/50 border-rose-100 text-rose-900"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${user.mfa_enabled ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}
              >
                {user.mfa_enabled ? (
                  <ShieldCheck size={18} />
                ) : (
                  <ShieldAlert size={18} />
                )}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-montserrat font-black uppercase tracking-tight">
                  MFA Authentication Guard:{" "}
                  {user.mfa_enabled ? `${user.mfa_type} ACTIVE` : "BYPASSED"}
                </h4>
                <p className="text-[11px] opacity-75 font-medium leading-normal">
                  {user.mfa_enabled
                    ? "Multi-Factor challenges intercept access pipelines on all unrecognized endpoints securely."
                    : "Critical Warning: Account bypass flags are vulnerable to unauthorized session hijacked vectors."}
                </p>
              </div>
            </div>

            {/* Explicit Permissions Chip Cloud Matrix */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-oswald font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                Allocated Operational Tokens ({user.permissions?.length || 0})
              </h4>
              <div className="p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {user.permissions?.length > 0 ? (
                  user.permissions.map((token) => {
                    const matchedPermission = SYSTEM_PERMISSIONS.find(
                      (p) => p.id === token,
                    );
                    return (
                      <span
                        key={token}
                        className="px-2 py-1 bg-white text-slate-700 border border-slate-200/60 rounded-lg text-[10px] font-mono font-bold shadow-sm break-keep whitespace-nowrap"
                      >
                        {matchedPermission ? matchedPermission.name : token}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    No explicit feature permission keys linked to this profile
                    node.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Panel Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-oswald font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
            >
              Acknowledge Profile
            </button>
          </div>
        </div>
      </div>

      {/* ─── MINI AVATAR PREVIEW OVERLAY MODAL ─── */}
      {showImagePreview && user.avatar_url && (
        <div
          onClick={() => setShowImagePreview(false)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-[90vw] max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Close button indicator helper for touch screens */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
            >
              <X size={18} />
            </button>
            <img
              src={user.avatar_url}
              alt={`${user.full_name} expanded avatar`}
              className="max-w-full max-h-[80vh] rounded-3xl object-contain border border-slate-800 shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Stop overlay click collapse when clicking image directly
            />
          </div>
        </div>
      )}
    </>
  );
}
