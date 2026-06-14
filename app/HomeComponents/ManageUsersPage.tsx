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
  User,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { SuperAdminUser } from "../services/types";
import {
  deleteAdminProfileApi,
  fetchAllSuperAdminsApi,
  toggleAdminStatusApi,
  updateAdminMfaPolicyApi,
} from "../services/apis";
import AdminProfileModal from "./AdminProfileModal";
import UserLogsPage from "./UserLogsPage";
import AdminPermissionsModal from "./AdminPermissionsModal";
import { useUser } from "../UserContext";
import AdminPasswordOverrideModal from "./AdminPasswordOverrideModal";
import SecurityActionWarningModal from "./SecurityActionWarningModal";

export default function ManageUsersPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminCount, setAdminCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] =
    useState<SuperAdminUser | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsId, setLogsId] = useState("");
  const [logsName, setLogsName] = useState("");
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedPermissionsUser, setSelectedPermissionsUser] =
    useState<SuperAdminUser | null>(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedOverrideUser, setSelectedOverrideUser] =
    useState<SuperAdminUser | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningConfig, setWarningConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    variant: "warning" | "danger";
    onConfirm: () => Promise<void> | void;
  }>({
    title: "",
    message: "",
    confirmText: "",
    variant: "warning",
    onConfirm: () => {},
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSuperAdminsApi();
      if (data.success) {
        setUsers(data.users ?? []);
        setAdminCount(data.count ?? 0);
      } else {
        toast.error("Failed to load users.");
      }
    } catch (err) {
      toast.error("Network handshake exception.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const showAccessDeniedToast = () => {
    toast.error(
      `Access Denied. You do not hold the authorized credentials required for this operation.`,
      {
        id: "unauthorized-users-page-lock",
        duration: 4000,
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
  };

  const handleOpenProfile = (user: SuperAdminUser) => {
    setSelectedProfileUser(user);
    setIsProfileOpen(true);
  };

  const handleOpenLogs = (id: string, name: string) => {
    const canViewLogs =
      user?.permissions.includes("logs_management") ||
      user?.permissions.includes("view_user_logs") ||
      user?.permissions.includes("all-access");

    if (!canViewLogs) {
      showAccessDeniedToast();
      return;
    }
    setLogsId(id);
    setIsLogsOpen(true);
    setLogsName(name);
  };

  const handleEditPermissions = (user: SuperAdminUser) => {
    const canManagePermissions =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_user_permissions") ||
      user?.permissions.includes("all-access");

    if (!canManagePermissions) {
      showAccessDeniedToast();
      return;
    }
    setSelectedPermissionsUser(user);
    setIsPermissionsOpen(true);
  };

  const handleResetPassword = (targetUser: SuperAdminUser) => {
    // Check permission rules for the active user context
    const canOverrideCredentials =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_users_pass") ||
      user?.permissions.includes("all-access");

    if (!canOverrideCredentials) {
      showAccessDeniedToast();
      return;
    }

    setSelectedOverrideUser(targetUser);
    setIsOverrideOpen(true);
  };

  const handleToggleMfa = async (id: string, currentMfa: boolean) => {
    // 1. Enforce strict client-side permission guards
    const canManageSecurity =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_users_mfa") ||
      user?.permissions.includes("all_access");

    if (!canManageSecurity) {
      showAccessDeniedToast();
      return;
    }

    const targetNewMfaState = !currentMfa;

    // 3. Dispatch an asynchronous network resolution promise track
    toast.promise(
      updateAdminMfaPolicyApi(id, targetNewMfaState),
      {
        loading: "Synchronizing remote MFA security matrix fields...",
        success: (res) => {
          if (res.success) {
            fetchAdmins();
            return targetNewMfaState
              ? "MFA guard constraints successfully enforced on account."
              : "MFA guard protection completely stripped from account configuration.";
          }
          throw new Error(res.message);
        },
        error: (err) =>
          err.message ||
          "Failed to update security credentials mapping parameters.",
      },
      {
        style: { fontWeight: "bold", borderRadius: "10px" },
      },
    );
  };

  const handleToggleStatus = async (id: string, status: boolean) => {
    const canToggleStatus =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_users_mfa") ||
      user?.permissions.includes("all_access");

    if (!canToggleStatus) {
      showAccessDeniedToast();
      return;
    }

    toast.promise(
      toggleAdminStatusApi(id, status),
      {
        loading: "Updating system status parameters...",
        success: (res) => {
          if (res.success) {
            fetchAdmins(); 
            return `Account access successfully updated.`;
          }
          throw new Error(res.message);
        },
        error: (err) => {
          return err.message || "Failed to update target row state status.";
        },
      },
      { style: { fontWeight: "bold", borderRadius: "10px" } },
    );
  };

  const handleDeleteUser = async (id: string) => {
    const canDeleteUser =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("delete_user") ||
      user?.permissions.includes("all_access");

    if (!canDeleteUser) {
      showAccessDeniedToast();
      return;
    }

    toast.promise(
      deleteAdminProfileApi(id),
      {
        loading: "Purging security database structures...",
        success: (res) => {
          if (res.success) {
            fetchAdmins(); 
            return "Administrator profile entirely stripped from core registries.";
          }
          throw new Error(res.message);
        },
        error: (err) => {
          return (
            err.message ||
            "An exception occurred handling database pruning commands."
          );
        },
      },
      { style: { fontWeight: "bold", borderRadius: "10px" } },
    );
  };

  const triggerToggleStatusWarning = (targetUser: SuperAdminUser) => {
    const targetNewActiveState = !targetUser.is_active;
    setWarningConfig({
      title: targetUser.is_active
        ? "Suspend Account Profile"
        : "Activate Account Profile",
      message: `Are you certain you want to shift the operational status for ${targetUser.full_name}? ${
        targetUser.is_active
          ? "This will instantly terminate their platform workstation handshake authentication keys."
          : "This will restore their system permissions access vector loops immediately."
      }`,
      confirmText: targetUser.is_active ? "Suspend User" : "Activate User",
      variant: targetUser.is_active ? "danger" : "warning",
      onConfirm: async () => {
        await handleToggleStatus(targetUser.id, targetNewActiveState);
      },
    });
    setIsWarningOpen(true);
  };

  // 2. Unified Trigger for MFA Security Toggling Action
  const triggerToggleMfaWarning = (targetUser: SuperAdminUser) => {
    const targetNewMfaState = !targetUser.mfa_enabled;

    setWarningConfig({
      title: targetNewMfaState
        ? "Enforce Security MFA"
        : "Strip Account MFA Guard",
      message: targetNewMfaState
        ? `Are you sure you want to enforce default Multi-Factor Authentication policy guards for ${targetUser.full_name}?`
        : `CRITICAL ACTION ALERT: Are you completely certain you want to bypass and disable Multi-Factor Authentication protection for ${targetUser.full_name}? This lowers account security guidelines.`,
      confirmText: targetNewMfaState ? "Enforce MFA" : "Disable MFA Protection",
      variant: targetNewMfaState ? "warning" : "danger",
      onConfirm: async () => {
        await handleToggleMfa(targetUser.id, targetNewMfaState);
      },
    });
    setIsWarningOpen(true);
  };

  // 3. Unified Trigger for Hard Profile Purge Deletion Action
  const triggerDeleteUserWarning = (targetUser: SuperAdminUser) => {
    setWarningConfig({
      title: "Purge Admin Account Vector",
      message: `CRITICAL DATA DELETION FORCE CHALLENGE: Are you completely certain you want to permanently purge "${targetUser.full_name}" from the GateMan core database repository? This action is absolute and cannot be undone.`,
      confirmText: "Delete Account Profile",
      variant: "danger",
      onConfirm: async () => {
        await handleDeleteUser(targetUser.id);
      },
    });
    setIsWarningOpen(true);
  };

  // Filtered Lists Logic Matrices
  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLogsOpen) {
    return (
      <div className="bg-white p-2 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            setIsLogsOpen(false);
          }}
          className="flex items-center gap-2 text-xs font-sans font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <UserLogsPage isolatedAdminId={logsId} isolatedAdminName={logsName} />
      </div>
    );
  }

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
                    <th className="p-5">Status</th>
                    <th className="p-5 text-center">Security Core Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-sans text-sm font-bold text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-10 text-center text-slate-400 text-xs font-medium"
                      >
                        {loading ? (
                          <div className="flex flex-col items-center justify-center flex-1 gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                          </div>
                        ) : (
                          "No administrative configurations found matching the search context footprint"
                        )}
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
                              u.is_active
                                ? "bg-emerald-50/60 border-emerald-100 text-emerald-600"
                                : "bg-rose-50/60 border-rose-100 text-rose-600"
                            }`}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Security Operations Controls Column */}
                        <td className="p-5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Inspect Footprint Button */}
                            <button
                              onClick={() => handleOpenProfile(u)}
                              title="View User's Profile"
                              className="p-2 bg-slate-50 text-slate-400 hover:text-blue-400 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100"
                            >
                              <User size={15} />
                            </button>

                            <button
                              onClick={() => handleOpenLogs(u.id, u.full_name)}
                              title="Inspect Activity Logs"
                              className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100"
                            >
                              <Eye size={15} />
                            </button>

                            {/* NEW: Edit Permissions & Custom Roles Button */}
                            <button
                              onClick={() => handleEditPermissions(u)}
                              title="Modify Custom Roles & Permissions Matrix"
                              className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100"
                            >
                              <ShieldAlert size={15} />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => handleResetPassword(u)}
                              title="Trigger Password Reset Email Challenge"
                              className="p-2 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-slate-100"
                            >
                              <RotateCcw size={15} />
                            </button>

                            {/* Toggle MFA Protection Explicitly */}
                            <button
                              onClick={() => triggerToggleMfaWarning(u)}
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
                              onClick={() => triggerToggleStatusWarning(u)}
                              title={
                                u.is_active
                                  ? "Suspend Admin Account Interception"
                                  : "Re-activate Core Account Link"
                              }
                              className={`p-2 rounded-xl transition-all border ${
                                u.is_active
                                  ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 animate-pulse"
                                  : "bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-100"
                              }`}
                            >
                              <Ban size={15} />
                            </button>

                            {/* Delete Admin Account Matrix */}
                            <button
                              onClick={() => triggerDeleteUserWarning(u)}
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
      </div>
      <AdminProfileModal
        user={selectedProfileUser}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedProfileUser(null);
        }}
      />
      <AdminPermissionsModal
        user={selectedPermissionsUser}
        isOpen={isPermissionsOpen}
        onClose={() => {
          setIsPermissionsOpen(false);
          setSelectedPermissionsUser(null);
        }}
        onUpdateSuccess={fetchAdmins}
      />
      <AdminPasswordOverrideModal
        user={selectedOverrideUser}
        isOpen={isOverrideOpen}
        onClose={() => {
          setIsOverrideOpen(false);
          setSelectedOverrideUser(null);
        }}
      />

      <SecurityActionWarningModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title={warningConfig.title}
        message={warningConfig.message}
        confirmText={warningConfig.confirmText}
        variant={warningConfig.variant}
        onConfirm={warningConfig.onConfirm}
      />
    </div>
  );
}
