/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { AdminUser, Estate } from "../services/types";

interface AdminUserDetailsPageProps {
  admin: AdminUser;
  estate: Estate;
  toggleAccess: (adminId: string, nextStatus: "ACTIVE" | "SUSPENDED") => void;
  onBack: () => void;
}

export default function AdminUserDetailsPage({
  admin,
  estate,
  toggleAccess,
  onBack,
}: AdminUserDetailsPageProps) {
  // Initialize dynamic operational status flag safely from the provided object
  const [currentStatus, setCurrentStatus] = useState<"ACTIVE" | "SUSPENDED">(
    admin.status || "ACTIVE",
  );
  const [isMutating, setIsMutating] = useState(false);

  const handleToggleAccess = (
    id: string,
    nextStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    setIsMutating(true);
    toggleAccess(id, nextStatus);
    setIsMutating(false);
    console.log(`Admin node ${admin.id} credentials altered to: ${nextStatus}`);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen animate-fadeIn">
      <div className="mx-auto space-y-6">
        {/* Navigation Action Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Management Desk
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              System Scope:
            </span>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
              {estate.name || admin.estate_name || "Estate Admin Token"}
            </span>
          </div>
        </div>

        {/* Profile Card Header Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="h-24 bg-linear-to-r from-slate-800 to-indigo-950" />
          <div className="p-6 relative -mt-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-100">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 bg-slate-200 rounded-2xl border-4 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                {admin.profile_image_url || admin.admin_selfie_url ? (
                  <img
                    src={
                      (admin.profile_image_url ||
                        admin.admin_selfie_url) as string
                    }
                    alt={admin.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-slate-400">
                    {admin.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {admin.name}
                  </h2>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                      currentStatus === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>
                <p className="text-xs text-indigo-600 font-bold">
                  {admin.role || "ADMIN"}{" "}
                  {admin.admin_role && `• ${admin.admin_role}`}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {admin.id}
                </p>
              </div>
            </div>

            {/* Access Interceptor Toggle Mechanism Button */}
            <button
              onClick={() => {
                const nextStatus =
                  currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                handleToggleAccess(admin.id, nextStatus);
                setCurrentStatus(nextStatus);
              }}
              disabled={isMutating}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                currentStatus === "ACTIVE"
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              } ${isMutating ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isMutating
                ? "Updating Context Pool..."
                : currentStatus === "ACTIVE"
                  ? "🛑 Suspend Access"
                  : "🔑 Restore Access"}
            </button>
          </div>

          {/* Primary Profile Details Fields */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/40">
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Communications Metadata
              </h3>

              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Email Node
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 break-all">
                  {admin.email}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Phone Pipeline
                </p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {admin.phone_number || "N/A"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Residential Node Address
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {admin.residential_address || "No structural address logged."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                System Architecture Core
              </h3>

              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Provisioning Datetime Sequence
                </p>
                <p className="text-xs font-mono font-bold text-slate-700">
                  {admin.created_at
                    ? new Date(admin.created_at).toLocaleString("en-GB")
                    : "N/A"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Subscription License Expiry
                </p>
                <p className="text-xs font-mono font-bold text-amber-700">
                  {admin.subscription_expiry
                    ? new Date(admin.subscription_expiry).toLocaleDateString(
                        "en-GB",
                      )
                    : "Perpetual Cycle"}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Estate ID Context
                </p>
                <p className="text-xs font-mono text-slate-600 truncate">
                  {admin.estate_id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── NEW ESTATE FINANCIAL & GATEWAY INDEX SECTION ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settlement Account Registry Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Estate Ledger Bank Settlement
              </h3>
              <p className="text-[11px] text-slate-400">
                Configured disbursement account nodes for financial tracking.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Bank Name</span>
                <span className="font-bold text-slate-800">
                  {estate.bank_name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Bank Code</span>
                <span className="font-mono text-slate-700">
                  {estate.bank_code || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">
                  Account Number
                </span>
                <span className="font-mono font-bold text-slate-900 tracking-wider">
                  {estate.bank_account_number || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Account Name</span>
                <span className="font-bold text-slate-800 truncate max-w-[220px]">
                  {estate.bank_account_name || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Integration Pipelines Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Gateway Integration Hub
                </h3>
                <p className="text-[11px] text-slate-400">
                  Billing channels and external environment configurations.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Billing Flow Model Type
                  </p>
                  <p className="text-xs font-black text-indigo-700">
                    {estate.payment_type || "NOT_CONFIGURED"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    External Endpoint Pipeline URL
                  </p>
                  <p
                    className="text-xs font-mono text-slate-700 truncate select-all"
                    title={estate.external_api_url}
                  >
                    {estate.external_api_url ||
                      "System pipelines default running."}
                  </p>
                </div>
              </div>
            </div>

            {admin.admin_selfie_url && (
              <div className="pt-2">
                <a
                  href={admin.admin_selfie_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/40 text-indigo-700 rounded-xl text-xs font-bold transition-colors block"
                >
                  📸 Inspect Biometric Verification Selfie
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
