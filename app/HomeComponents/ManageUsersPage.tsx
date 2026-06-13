"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Ban,
  Trash2,
  Eye,
  AlertTriangle,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

// Interface for Users matching your PostgreSQL Schema profile
interface SuperAdminUser {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  mfa_enabled: boolean;
  mfa_type: "NONE" | "EMAIL" | "TOTP" | "SMS";
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
}

// Interface for Security Logs
interface AuditLog {
  id: string;
  actor_name: string;
  action: string;
  target_user: string;
  ip_address: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export default function ManageUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "add" | "logs">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [logFilter, setLogFilter] = useState<
    "ALL" | "INFO" | "WARNING" | "CRITICAL"
  >("ALL");

  // Simulated Workspace Data — Swap these out for your React Fetch/Axios database endpoints
  const [users, setUsers] = useState<SuperAdminUser[]>([
    {
      id: "1",
      full_name: "Simon Effiong",
      email: "simon@gateman.com",
      phone_number: "+2348012345678",
      mfa_enabled: true,
      mfa_type: "TOTP",
      status: "ACTIVE",
      created_at: "2026-03-12 14:22",
    },
    {
      id: "2",
      full_name: "John Doe",
      email: "j.doe@gateman.com",
      phone_number: "+2349087654321",
      mfa_enabled: false,
      mfa_type: "NONE",
      status: "ACTIVE",
      created_at: "2026-05-19 09:15",
    },
    {
      id: "3",
      full_name: "Jane Smith",
      email: "jane.smith@gateman.com",
      phone_number: null,
      mfa_enabled: true,
      mfa_type: "EMAIL",
      status: "SUSPENDED",
      created_at: "2026-06-01 11:40",
    },
  ]);

  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: "LOG-901",
      actor_name: "Simon Effiong",
      action: "Revoked Permission: Estate Wallet Write Access",
      target_user: "John Doe",
      ip_address: "102.89.43.12",
      timestamp: "2026-06-13 08:32:11",
      severity: "WARNING",
    },
    {
      id: "LOG-902",
      actor_name: "Simon Effiong",
      action: "Suspended Account Status",
      target_user: "Jane Smith",
      ip_address: "102.89.43.12",
      timestamp: "2026-06-12 16:45:00",
      severity: "CRITICAL",
    },
    {
      id: "LOG-903",
      actor_name: "System Terminal",
      action: "MFA Handshake Verification Setup Link",
      target_user: "Simon Effiong",
      ip_address: "197.210.8.54",
      timestamp: "2026-06-11 10:14:25",
      severity: "INFO",
    },
  ]);

  // Action Toggles
  const handleToggleStatus = (
    id: string,
    currentStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)),
    );
    toast.success(`User successfully ${nextStatus.toLowerCase()}!`);
  };

  const handleToggleMfa = (id: string, currentMfa: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              mfa_enabled: !currentMfa,
              mfa_type: !currentMfa ? "EMAIL" : "NONE",
            }
          : u,
      ),
    );
    toast.success(`MFA policy enforcement modified.`);
  };

  const handleResetPassword = (email: string) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: "Generating secure recovery sequence token...",
      success: `Password reset vector sent to ${email}`,
      error: "Failed to dispatch reset request.",
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (
      confirm(
        `CRITICAL DELETION FORCE CHALLENGE: Are you completely certain you want to purge admin entry "${name}" from the GateMan core database mapping?`,
      )
    ) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.error("Administrator access profile deleted.");
    }
  };

  // Redirection Link Routine: Filters logs view down to a single user footprint context
  const handleInspectUserLogs = (userName: string) => {
    setSearchQuery(userName);
    setActiveTab("logs");
    toast(`Viewing audit logs for: ${userName}`, { icon: "🔍" });
  };

  const handleEditPermissions = (userId: string, userName: string) => {
    // e.g., open a modal overlay or state tray containing your granular feature permission checkboxes
    toast(`Opening permission matrix for ${userName}`, { icon: "🔐" });
  };

  // Filtered Lists Logic Matrices
  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.target_user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = logFilter === "ALL" || l.severity === logFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 h-[calc(100vh-120px)] bg-slate-50/50 font-sans">
      {/* Structural Workspace Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 tracking-tight">
            User Workstation Hub
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage admin privileges, assign core credentials, and audit security
            events.
          </p>
        </div>
      </div>

      {/* TAB CONTENT MATRICES */}
      <div className="animate-in fade-in zoom-in-99 duration-150">
        {/* TAB 1: MANAGE USERS VIEWPORT */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Search Filter Strip */}
            <div className="flex items-center relative max-w-sm">
              <Search className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search active admins by signature or endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl font-sans font-bold text-slate-900 text-xs shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-oswald font-black uppercase tracking-widest text-slate-400">
                      <th className="p-5">Identity Profile</th>
                      <th className="p-5">MFA Guard Status</th>
                      <th className="p-5">Gate Status</th>
                      <th className="p-5 text-center">
                        Security Core Controls
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-sans text-sm font-bold text-slate-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center text-slate-400 text-xs font-medium"
                        >
                          No administrative configurations found matching the
                          search context footprint.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Name / Email Column */}
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-montserrat font-black text-sm shadow-inner">
                                {u.full_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-slate-900 font-bold text-sm leading-tight">
                                  {u.full_name}
                                </h4>
                                <span className="text-xs text-slate-400 font-medium font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* MFA Guard Column */}
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              {u.mfa_enabled ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                  <ShieldCheck size={14} />
                                  <span className="text-[9px] font-oswald font-black uppercase tracking-wider">
                                    {u.mfa_type} Active
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
                                  <ShieldAlert size={14} />
                                  <span className="text-[9px] font-oswald font-black uppercase tracking-wider">
                                    Unprotected
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Account Status Column */}
                          <td className="p-5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-oswald font-black uppercase tracking-wider border ${
                                u.status === "ACTIVE"
                                  ? "bg-emerald-50/60 border-emerald-100 text-emerald-600"
                                  : "bg-rose-50/60 border-rose-100 text-rose-600"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>

                          {/* Security Operations Controls Column */}
                          <td className="p-5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Inspect Footprint Button */}
                              <button
                                onClick={() =>
                                  handleInspectUserLogs(u.full_name)
                                }
                                title="View User's Profile"
                                className="p-2 bg-slate-50 text-slate-400 hover:text-blue-400 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100"
                              >
                                <User size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  handleInspectUserLogs(u.full_name)
                                }
                                title="Inspect Activity Logs"
                                className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100"
                              >
                                <Eye size={15} />
                              </button>

                              {/* NEW: Edit Permissions & Custom Roles Button */}
                              <button
                                onClick={() =>
                                  handleEditPermissions(u.id, u.full_name)
                                }
                                title="Modify Custom Roles & Permissions Matrix"
                                className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100"
                              >
                                <ShieldAlert size={15} />
                              </button>

                              {/* Reset Password Button */}
                              <button
                                onClick={() => handleResetPassword(u.email)}
                                title="Trigger Password Reset Email Challenge"
                                className="p-2 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-slate-100"
                              >
                                <RotateCcw size={15} />
                              </button>

                              {/* Toggle MFA Protection Explicitly */}
                              <button
                                onClick={() =>
                                  handleToggleMfa(u.id, u.mfa_enabled)
                                }
                                title={
                                  u.mfa_enabled
                                    ? "Deactivate Security MFA Restriction Override"
                                    : "Enforce Default MFA Protection Loop"
                                }
                                className={`p-2 rounded-xl transition-all border ${
                                  u.mfa_enabled
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                    : "bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-100"
                                }`}
                              >
                                <ShieldCheck size={15} />
                              </button>

                              {/* Suspend / Enable Toggle */}
                              <button
                                onClick={() =>
                                  handleToggleStatus(u.id, u.status)
                                }
                                title={
                                  u.status === "ACTIVE"
                                    ? "Suspend Admin Account Interception"
                                    : "Re-activate Core Account Link"
                                }
                                className={`p-2 rounded-xl transition-all border ${
                                  u.status === "SUSPENDED"
                                    ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 animate-pulse"
                                    : "bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-100"
                                }`}
                              >
                                <Ban size={15} />
                              </button>

                              {/* Delete Admin Account Matrix */}
                              <button
                                onClick={() =>
                                  handleDeleteUser(u.id, u.full_name)
                                }
                                title="Purge Core Admin Authorization Profile"
                                className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-100"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADD SUPER ADMIN STAGING LOOP */}
        {activeTab === "add" && (
          <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-100/40">
            {/* Calling placeholder for AddSuperAdmin layout node */}
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-xs">
              <UserPlus size={40} className="mx-auto text-slate-300 mb-3" />
              <span>[ AddSuperAdmin() Mount Point Block ]</span>
              <p className="font-normal font-sans text-slate-400/70 mt-1 max-w-xs mx-auto">
                We will bridge your existing configuration form handler right
                into this layout context block next.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS SECURITY JOURNAL */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* Filter controls container layout */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
              {/* Internal Search */}
              <div className="flex items-center relative max-w-sm flex-1">
                <Search className="absolute left-4 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter logs by actor name, target, or key event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl font-sans font-bold text-slate-900 text-xs shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Severity Quick Filters */}
              <div className="flex bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm gap-1 self-start sm:self-auto overflow-x-auto">
                {(["ALL", "INFO", "WARNING", "CRITICAL"] as const).map(
                  (sev) => (
                    <button
                      key={sev}
                      onClick={() => setLogFilter(sev)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-oswald font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        logFilter === sev
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {sev}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Audit Logs Layout Frame */}
            <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-oswald font-black uppercase tracking-widest text-slate-400">
                      <th className="p-5">Log ID / Timestamp</th>
                      <th className="p-5">Operator Execution Signature</th>
                      <th className="p-5">Security Operation Action Event</th>
                      <th className="p-5">Target Node</th>
                      <th className="p-5 text-right">IP Footprint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono text-xs text-slate-600 font-medium">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-10 text-center text-slate-400 font-sans font-medium text-xs"
                        >
                          No forensic authentication signatures matching your
                          configuration queries.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((l) => (
                        <tr
                          key={l.id}
                          className="hover:bg-slate-50/30 transition-colors"
                        >
                          {/* Log Identifier & Time stamp */}
                          <td className="p-5 whitespace-nowrap">
                            <span className="text-slate-900 font-bold block">
                              {l.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {l.timestamp}
                            </span>
                          </td>

                          {/* Operator Identity */}
                          <td className="p-5 font-sans font-bold text-slate-800 whitespace-nowrap">
                            {l.actor_name}
                          </td>

                          {/* Action Log String + Severity Chip Indicator */}
                          <td className="p-5 max-w-xs font-sans">
                            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                              {l.severity === "CRITICAL" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[8px] font-oswald font-black uppercase tracking-wider border border-rose-100 shrink-0">
                                  <AlertTriangle size={10} /> CRIT
                                </span>
                              )}
                              {l.severity === "WARNING" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-oswald font-black uppercase tracking-wider border border-amber-100 shrink-0">
                                  <AlertTriangle size={10} /> WARN
                                </span>
                              )}
                              <span className="text-slate-600 text-xs font-medium leading-normal">
                                {l.action}
                              </span>
                            </div>
                          </td>

                          {/* Target User Impact footprint */}
                          <td className="p-5 font-sans font-semibold text-slate-700 whitespace-nowrap">
                            {l.target_user}
                          </td>

                          {/* IP Data Point */}
                          <td className="p-5 text-right font-bold text-slate-400 whitespace-nowrap">
                            {l.ip_address}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
