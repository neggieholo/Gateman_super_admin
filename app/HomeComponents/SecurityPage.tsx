"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, KeyRound, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "../UserContext";
import UserLogsPage from "./UserLogsPage";
import NetworkPerimeterPage from "./NetworkPerimeterPage";
import SystemPoliciesPage from "./SystemPoliciesPage";
import SecurityIncidentsPage from "./SecurityIncidentsPage";

// 🔐 TARGET SECURITY TAB TO ROBUST PERMISSION KEYS
const SECURITY_TAB_PERMISSIONS = {
  perimeter: "view_security_perimeter",
  policies: "view_security_policies",
  incidents: "view_security_incidents",
  logs: "view_user_logs",
};

type SecurityTabVariant = "perimeter" | "policies" | "incidents" | "logs";

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<SecurityTabVariant>("perimeter");
  const { user } = useUser();

  // 🧠 LIFECYCLE 1: Force immediate permission check on layout mount
  useEffect(() => {
    const userPermissions = user?.permissions || [];
    const hasAllAccess = userPermissions.includes("all-access");
    const hasInitialAccess =
      userPermissions.includes(SECURITY_TAB_PERMISSIONS["perimeter"]) ||
      userPermissions.includes("security_infrastructure");

    if (!hasAllAccess && !hasInitialAccess) {
      toast.error(
        `Access Denied. You do not hold the authorized workforce credentials required to view the SECURITY panel workspace.`,
        {
          id: "unauthorized-security-page-lock",
          duration: Infinity,
          position: "top-center",
          style: {
            fontWeight: "bold",
            borderRadius: "12px",
            background: "#1E293B",
            color: "#FFFFFF",
            maxWidth: "450px",
          },
        },
      );
    }

    // 🧼 CLEANUP UNMOUNT HOOK
    return () => {
      toast.dismiss("unauthorized-security-page-lock");
    };
  }, [user]);

  /**
   * Intercepts manual security tab transitions dynamically
   */
  const handleTabSwitch = (targetTab: SecurityTabVariant) => {
    const userPermissions = user?.permissions || [];
    const hasAllAccess = userPermissions.includes("all-access");
    const hasRequiredPermission =
      userPermissions.includes(SECURITY_TAB_PERMISSIONS[targetTab]) ||
      userPermissions.includes("security_infrastructure");

    // Wipe previous block instances down cleanly
    toast.dismiss("unauthorized-security-page-lock");

    if (!hasAllAccess && !hasRequiredPermission) {
      toast.error(
        `Access Denied. Your profile configuration lacks the explicit "${SECURITY_TAB_PERMISSIONS[targetTab]}" permission token to open the ${targetTab.toUpperCase()} panel workspace.`,
        {
          id: "unauthorized-security-page-lock",
          duration: Infinity,
          position: "top-center",
          style: {
            fontWeight: "bold",
            borderRadius: "12px",
            background: "#1E293B",
            color: "#FFFFFF",
            maxWidth: "450px",
          },
        },
      );
      return;
    }

    setActiveTab(targetTab);
  };

  const currentPermissions = user?.permissions || [];
  const hasAccessToCurrentPanel =
    currentPermissions.includes("all-access") ||
    currentPermissions.includes(SECURITY_TAB_PERMISSIONS[activeTab]) ||
    currentPermissions.includes("security_infrastructure");

  return (
    <div className="space-y-6 p-4 sm:p-6 font-sans flex flex-col">
      {/* 🛠️ 4-Tab High-Security Control Matrix Header */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-1.5 rounded-2xl max-w-2xl shadow-sm border">
        <button
          onClick={() => handleTabSwitch("perimeter")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 min-w-32.5 justify-center ${
            activeTab === "perimeter"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Shield size={14} /> Network
        </button>

        <button
          onClick={() => handleTabSwitch("policies")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 min-w-32.5 justify-center ${
            activeTab === "policies"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <KeyRound size={14} /> System Policies
        </button>

        <button
          onClick={() => handleTabSwitch("incidents")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 min-w-32.5 justify-center ${
            activeTab === "incidents"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert size={14} /> Incident Center
        </button>

        <button
          onClick={() => handleTabSwitch("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 min-w-[130px] justify-center ${
            activeTab === "logs"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <History size={14} /> Audit Logs
        </button>
      </div>

      {/* ─── SECURITY CONTENT DISPLAY FRAME ─── */}
      <div className="mt-4 animate-in fade-in duration-150 h-[calc(100vh-210px)] overflow-y-auto pb-10">
        {hasAccessToCurrentPanel ? (
          <>
            {activeTab === "perimeter" && <NetworkPerimeterPage />}
            {activeTab === "policies" && <SystemPoliciesPage />}
            {activeTab === "incidents" && <SecurityIncidentsPage />}

            {/* 🔄 Reusing your completed component layout straight out of the box! */}
            {activeTab === "logs" && <UserLogsPage />}
          </>
        ) : (
          <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            🔒 This strategic workspace pipeline is locked down due to
            restricted administrative access privileges.
          </div>
        )}
      </div>
    </div>
  );
}
