"use client";

import React, { useState, useEffect } from "react";
import AddSuperAdmin from "./AddUser";
import ManageUsersPage from "./ManageUsersPage";
import { History, User, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "../UserContext";
import UserLogsPage from "./UserLogsPage";

// 🔐 TARGET TAB TO PERMISSION ARRAYS
const TAB_PERMISSIONS = {
  users: "view_users",
  add: "add_user",
  logs: "view_user_logs",
  my_logs: "view_user_logs",
};

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<
    "users" | "add" | "logs" | "my_logs"
  >("users");
  const { user } = useUser();

  // 🧠 LIFECYCLE 1: Force immediate check on mount & clean up toasts on unmount
  useEffect(() => {
    const userPermissions = user?.permissions || [];
    const hasAllAccess = userPermissions.includes("all-access");
    const hasInitialAccess =
      userPermissions.includes(TAB_PERMISSIONS["users"]) ||
      userPermissions.includes("users_management");

    // If they land on the page and have neither all_access nor view_users permission
    if (!hasAllAccess && !hasInitialAccess) {
      toast.error(
        `Access Denied. You do not hold the authorized credentials required to view the USERS panel workspace.`,
        {
          id: "unauthorized-users-page-lock", // 🚀 Fixed ID stops duplicate toast stacking
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

    // 🧼 THE CLEANUP FUNCTION: Runs automatically when the user leaves this page component
    return () => {
      toast.dismiss("unauthorized-users-page-lock");
      // Optional: toast.dismiss() with no args clears ALL active toasts instantly if preferred
    };
  }, [user]); // Fires immediately when user data context loads up

  /**
   * Intercepts manual tab switching clicks
   */
  const handleTabSwitch = (targetTab: "users" | "add" | "logs") => {
    const userPermissions = user?.permissions || [];
    const hasAllAccess = userPermissions.includes("all-access");
    const hasRequiredPermission =
      userPermissions.includes(TAB_PERMISSIONS[targetTab]) ||
      userPermissions.includes("users_management");

    // Clear any previous error toasts before checking the next action tab state
    toast.dismiss("unauthorized-users-page-lock");

    if (!hasAllAccess && !hasRequiredPermission) {
      toast.error(
        `Access Denied. You do not hold the authorized credentials required to view the ${targetTab.toUpperCase()} panel workspace.`,
        {
          id: "unauthorized-users-page-lock",
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

  // 🛡️ Conditional execution layout guard: If user doesn't have access to the active tab, don't mount the page panels
  const currentPermissions = user?.permissions || [];
  const hasAccessToCurrentPanel =
    currentPermissions.includes("all-access") ||
    currentPermissions.includes(TAB_PERMISSIONS[activeTab]) ||
    currentPermissions.includes("users_management");

  return (
    <div className="space-y-6 p-4 sm:p-6 font-sans flex flex-col">
      {/* 3-Tab Custom Control Header */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-1.5 rounded-2xl max-w-md shadow-sm border">
        <button
          onClick={() => handleTabSwitch("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 justify-center ${
            activeTab === "users"
              ? "bg-gm-charcoal text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <User size={14} /> Manage Users
        </button>

        <button
          onClick={() => handleTabSwitch("add")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 justify-center ${
            activeTab === "add"
              ? "bg-gm-charcoal text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <UserPlus size={14} /> Add User
        </button>

        <button
          onClick={() => handleTabSwitch("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-oswald font-black uppercase tracking-wider transition-all flex-1 justify-center ${
            activeTab === "logs"
              ? "bg-gm-charcoal text-white shadow-md"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <History size={14} /> Audit Logs
        </button>
      </div>

      {/* ─── TAB CONTENT PANELS ─── */}
      <div className="mt-4 animate-in fade-in duration-150 h-[calc(100vh-210px)] overflow-y-auto pb-10">
        {hasAccessToCurrentPanel ? (
          <>
            {activeTab === "users" && <ManageUsersPage />}
            {activeTab === "add" && <AddSuperAdmin />}
            {activeTab === "logs" && <UserLogsPage type="user"/>}
            {activeTab === "my_logs" && (
              <UserLogsPage
                isolatedAdminId={user?.id}
                isolatedAdminName={user?.full_name}
                type="user"
              />
            )}
          </>
        ) : (
          <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
            🔒 View locked down due to restricted access.
          </div>
        )}
      </div>
    </div>
  );
}
