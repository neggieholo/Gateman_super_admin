"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, ShieldCheck, ChevronRight } from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SuperAdminDashboard() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const hasPassWarn = localStorage.getItem("DASHBOARD_PASS_WARN") === "true";
    const hasMfaWarn = localStorage.getItem("DASHBOARD_MFA_WARN") === "true"; 

    // Short circuit if neither warning is flagged
    if (!hasPassWarn && !hasMfaWarn) return;

    toast(
      (t) => (
        <div className="flex flex-col gap-2.5 p-1 max-w-sm">
          <p className="font-sans font-black text-slate-900 text-sm tracking-tight">
            ⚠️ Security Profile Configuration Required
          </p>

          <div className="flex flex-col gap-2 text-xs text-slate-600 font-medium leading-relaxed">
            {hasPassWarn && (
              <p>
                • You are currently using a <strong>temporary password</strong>.
                For maximum system protection, please configure a new master
                credential.
              </p>
            )}
            {hasMfaWarn && (
              <p>
                • Administrative security policies{" "}
                <strong>require Multi-Factor Authentication</strong> for your
                account. Please set up MFA before your next session to avoid
                access restrictions.
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-1.5 border-t border-slate-100 pt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem("DASHBOARD_PASS_WARN");
                localStorage.removeItem("DASHBOARD_MFA_WARN");
              }}
              className="px-3 py-1.5 text-[10px] font-oswald font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
            >
              Acknowledge Later
            </button>

            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem("DASHBOARD_PASS_WARN");
                localStorage.removeItem("DASHBOARD_MFA_WARN"); // Fixed typo

                // Smart routing path selection
                window.location.href = hasMfaWarn
                  ? "/home/settings"
                  : "/home/change-password";
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-oswald font-black uppercase tracking-wider shadow-sm transition-colors"
            >
              Configure Profile
            </button>
          </div>
        </div>
      ),
      {
        id: "admin-onboarding-security-alert",
        duration: Infinity,
        position: "top-center",
      },
    );
  }, []);

  // Logic specifically for Super Admin
  const stats = {
    totalEstates: 124,
    pendingEstates: 8,
    activeResidents: "12.5k",
    platformVolume: "₦4.2M",
  };

  const formattedBalance = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(user?.wallet_balance || 0);

  return (
    <div className="relative space-y-8 pb-24 md:pb-8">
      <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-bold opacity-80 uppercase tracking-widest">
            Platform Earnings
          </span>
          <div className="text-4xl font-black mt-2 tracking-tighter">
            {formattedBalance}
          </div>
          <p className="text-xs mt-4 opacity-70 font-medium">
            Accumulated commissions from all estates
          </p>
        </div>
        {/* Subtle decorative circle */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>
      {/* 1. System Alert Banner: Only shows if there are critical pending tasks */}
      {stats.pendingEstates > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl border bg-indigo-50 border-indigo-100 text-indigo-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">
                {stats.pendingEstates} Estates Awaiting Approval
              </p>
              <p className="text-xs opacity-80">
                New administrators have submitted KYC documents for review.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/master/requests")}
            className="flex items-center gap-1 text-xs font-black uppercase bg-indigo-200/50 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            Review Now <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* 2. Headline */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          System Overview
        </h1>
        <p className="text-slate-500 font-medium">
          Platform-wide performance and monitoring
        </p>
      </div>

      {/* 3. Master Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Estates
          </span>
          <div className="text-4xl font-bold text-slate-900 mt-1">
            {stats.totalEstates}
          </div>
          <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            +5 this week
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Active Residents
          </span>
          <div className="text-4xl font-bold text-slate-900 mt-1">
            {stats.activeResidents}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Platform Volume
          </span>
          <div className="text-4xl font-bold text-indigo-600 mt-1">
            {stats.platformVolume}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-amber-400">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Pending KYC
          </span>
          <div className="text-4xl font-bold text-slate-900 mt-1">
            {stats.pendingEstates}
          </div>
        </div>
      </div>

      {/* 4. Navigation Buttons (Quick Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button className="group bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-start justify-between min-h-40 hover:bg-slate-800 transition-all">
          <div className="p-3 bg-white/10 rounded-2xl mb-4">
            <Users size={28} className="text-indigo-400" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-xl mb-1">
              Estate Directory
            </span>
            <span className="text-sm text-slate-400">
              Manage, suspend, or audit all registered estates
            </span>
          </div>
        </button>

        <button className="group bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col items-start justify-between min-h-40 hover:shadow-lg transition-all">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl mb-4">
            <TrendingUp size={28} />
          </div>
          <div className="text-left">
            <span className="block font-bold text-xl mb-1 text-slate-900">
              Financial Ledger
            </span>
            <span className="text-sm text-slate-500">
              Track escrow balances and platform commissions
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
