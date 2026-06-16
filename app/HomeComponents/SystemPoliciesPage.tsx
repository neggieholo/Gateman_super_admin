/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Save,
  KeyRound,
  Timer,
  Fingerprint,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface PolicyState {
  // Session Timeouts
  sessionTimeoutMinutes: number;
  rememberMeDurationDays: number;
  absoluteTimeoutHours: number;

  // Password Setup Requirements
  pwdMinLength: number;
  pwdRequireUppercase: boolean;
  pwdRequireLowercase: boolean;
  pwdRequireNumbers: boolean;
  pwdRequireSymbols: boolean;
  pwdPreventReuseCount: number;
  pwdExpiryDays: number;

  // Interceptor Gate Mechanics
  enforceActionAcceptanceBeforeLogin: boolean;
  requireMfaForSubaccounts: boolean;
  maxLoginAttemptsBeforeLockout: number;
  lockoutDurationMinutes: number;
}

export default function SystemPoliciesPage() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [policies, setPolicies] = useState<PolicyState>({
    sessionTimeoutMinutes: 30,
    rememberMeDurationDays: 30,
    absoluteTimeoutHours: 24,
    pwdMinLength: 8,
    pwdRequireUppercase: true,
    pwdRequireLowercase: true,
    pwdRequireNumbers: true,
    pwdRequireSymbols: true,
    pwdPreventReuseCount: 3,
    pwdExpiryDays: 90,
    enforceActionAcceptanceBeforeLogin: false,
    requireMfaForSubaccounts: true,
    maxLoginAttemptsBeforeLockout: 5,
    lockoutDurationMinutes: 15,
  });

  const fetchPoliciesData = useCallback(async () => {
    setGlobalLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err) {
      toast.error("Failed to load core system security policies.");
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoliciesData();
  }, [fetchPoliciesData]);

  const handleCheckboxChange = (key: keyof PolicyState) => {
    setPolicies((prev) => ({
      ...prev,
      [key]: !prev[key] as any,
    }));
  };

  const handleNumberChange = (key: keyof PolicyState, val: string) => {
    const num = parseInt(val, 10);
    setPolicies((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("System policy configurations saved and updated globally.");
    } catch (err) {
      toast.error("An error occurred while saving system settings.");
    } finally {
      setActionLoading(false);
    }
  };

  if (globalLoading) {
    return (
      <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        Loading Global System Policies...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSavePolicies}
      className={`space-y-6 animate-in fade-in duration-200 ${actionLoading ? "pointer-events-none opacity-60" : ""}`}
    >
      {/* 🛡️ PAGE HEADER DESCRIPTIVE SUMMARY BANNER */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 text-white">
            <ShieldAlert size={20} className="text-amber-400" /> System Security & Access Policies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure global timeouts, account lockout parameters, password strictness layouts, and mandatory policy acceptance screens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==========================================
            ⏱️ SECTION 1: SESSION TIMEOUTS
            ========================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Timer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Session Lifecycle Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage runtime active token state longevity on user devices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Inactivity Idle Timeout (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={policies.sessionTimeoutMinutes}
                onChange={(e) =>
                  handleNumberChange("sessionTimeoutMinutes", e.target.value)
                }
                className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Closes active session rows automatically if left idle.
              </span>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Absolute Max Session Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={policies.absoluteTimeoutHours}
                onChange={(e) =>
                  handleNumberChange("absoluteTimeoutHours", e.target.value)
                }
                className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Forces a clean login security handshake regardless of active usage.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                &quot;Remember Me&quot; Token Lifespan (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={policies.rememberMeDurationDays}
                onChange={(e) =>
                  handleNumberChange("rememberMeDurationDays", e.target.value)
                }
                className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Sets maximum cookie longevity boundaries for trusted local browsers.
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            🛡️ SECTION 2: BRUTE FORCE & LOCKOUT GATE
            ========================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Fingerprint size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Brute Force Defenses
              </h3>
              <p className="text-[11px] text-slate-400">
                Throttling thresholds to isolate and lock down accounts against attack loops.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Max Failed Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={policies.maxLoginAttemptsBeforeLockout}
                onChange={(e) =>
                  handleNumberChange(
                    "maxLoginAttemptsBeforeLockout",
                    e.target.value,
                  )
                }
                className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Number of failures permitted before a lock action triggers.
              </span>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Lockout Window Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={policies.lockoutDurationMinutes}
                onChange={(e) =>
                  handleNumberChange("lockoutDurationMinutes", e.target.value)
                }
                className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cooldown separation time enforced before resetting account access.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group selection:bg-transparent">
              <input
                type="checkbox"
                checked={policies.requireMfaForSubaccounts}
                onChange={() =>
                  handleCheckboxChange("requireMfaForSubaccounts")
                }
                className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block">
                  Enforce Multi-Factor Authentication (MFA)
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Forces all administrative subaccounts to verify login steps using authenticator app keys.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* ==========================================
            🔑 SECTION 3: PASSWORD COMPLEXITY CONFIGURATOR
            ========================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Password Strength Requirements
              </h3>
              <p className="text-[11px] text-slate-400">
                Enforce validation parameters when users create or rotate login credentials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Numeric Inputs */}
            <div className="space-y-4 border-r border-slate-100 pr-0 md:pr-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="6"
                  max="64"
                  value={policies.pwdMinLength}
                  onChange={(e) =>
                    handleNumberChange("pwdMinLength", e.target.value)
                  }
                  className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  Password Expiry Lifecycle (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={policies.pwdExpiryDays}
                  onChange={(e) =>
                    handleNumberChange("pwdExpiryDays", e.target.value)
                  }
                  className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Set to 0 to disable automatic cyclic rotation demands.
                </span>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  History Check (Prevent Password Reuse)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={policies.pwdPreventReuseCount}
                  onChange={(e) =>
                    handleNumberChange("pwdPreventReuseCount", e.target.value)
                  }
                  className="w-full text-xs font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Validates against a history list of previous cryptographic hashes.
                </span>
              </div>
            </div>

            {/* Checkbox Matrix Requirements */}
            <div className="md:col-span-2 space-y-3 pl-0 md:pl-2 flex flex-col justify-center">
              <label className="block text-[11px] uppercase tracking-wider font-black text-slate-400 mb-2">
                Required Character Categories
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer group selection:bg-transparent bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={policies.pwdRequireUppercase}
                    onChange={() => handleCheckboxChange("pwdRequireUppercase")}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block">
                      Require Uppercase Letters
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Must contain uppercase alphabets [A-Z].
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group selection:bg-transparent bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={policies.pwdRequireLowercase}
                    onChange={() => handleCheckboxChange("pwdRequireLowercase")}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block">
                      Require Lowercase Letters
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Must contain lowercase alphabets [a-z].
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group selection:bg-transparent bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={policies.pwdRequireNumbers}
                    onChange={() => handleCheckboxChange("pwdRequireNumbers")}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block">
                      Require Numeric Digits
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Must include numbers matching [0-9].
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group selection:bg-transparent bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={policies.pwdRequireSymbols}
                    onChange={() => handleCheckboxChange("pwdRequireSymbols")}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors block">
                      Require Special Symbols
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Must contain formatting symbols (e.g., !, @, #, $, %).
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            ⚡ SECTION 4: GLOBAL ACCESS GATES
            ========================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Estate Policy Management Gates
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure conditional intercept criteria applied before granting admin workspace entry.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Force Policy Rule Acceptance Modal on Login
              </span>
              <p className="text-[11px] text-slate-400 max-w-2xl">
                When enabled, all staff and estate managers must explicitly review and accept updated operational declarations or security terms in an overlay popup window before accessing their dashboards.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm self-end md:self-auto">
              <input
                type="checkbox"
                id="actionAcceptanceToggle"
                checked={policies.enforceActionAcceptanceBeforeLogin}
                onChange={() =>
                  handleCheckboxChange("enforceActionAcceptanceBeforeLogin")
                }
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4 accent-slate-900 cursor-pointer"
              />
              <label
                htmlFor="actionAcceptanceToggle"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer select-none"
              >
                {policies.enforceActionAcceptanceBeforeLogin
                  ? "Active"
                  : "Disabled"}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FLOATING FOOTER STATUS BAR ─── */}
      <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm sticky bottom-4 backdrop-blur bg-opacity-95">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <RefreshCw
            size={14}
            className={actionLoading ? "animate-spin text-slate-900" : ""}
          />
          <span>Configuration policy rules map ready for compilation.</span>
        </div>
        <button
          type="submit"
          disabled={actionLoading}
          className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all flex items-center gap-2"
        >
          <Save size={14} />
          {actionLoading ? "Saving Policy Matrices..." : "Save Policy Schema"}
        </button>
      </div>
    </form>
  );
}