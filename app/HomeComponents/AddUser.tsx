"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Shield,
  KeyRound,
  Save,
  Layers,
  CheckSquare,
  Square,
  Info,
  Loader2,
  Eye,
  EyeClosed,
} from "lucide-react";
import toast from "react-hot-toast";
import { SYSTEM_PERMISSIONS } from "../services/data";

// Import your brand new live data connection methods
import {
  fetchSystemPermissionsApi,
  fetchCustomRolesApi,
  createCustomRoleApi,
  createSuperAdminUserWorkspaceApi,
} from "../services/apis";
import { PermissionNode, CustomRoleMapping } from "../services/types";
import { useUser } from "../UserContext";

export default function AddSuperAdmin() {
  const { user } = useUser();
  const myPermissions = user?.permissions || [];
  const iHaveAllAccess = myPermissions.includes("all-access");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core Dictionary & Custom Templates Repositories State
  const [systemPermissions, setSystemPermissions] = useState<PermissionNode[]>(
    [],
  );
  const [savedRoles, setSavedRoles] = useState<CustomRoleMapping[]>([]);

  // Account Identification Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Strategic System Guard Flags (Enforced by default)
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [isSubAccount, setIsSubAccount] = useState(true);

  // Permissions Allocation Arrays State
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [customRoleName, setCustomRoleName] = useState("");
  const [savingCustomRole, setSavingCustomRole] = useState(false);
  const [show, setShow] = useState(false);

  // ─── EFFORTLESS HANDSHAKE HYDRATION DATA LOOP ───
  useEffect(() => {
    const hydratePageData = async () => {
      try {
        setIsLoading(true);
        const [permData, roleData] = await Promise.all([
          fetchSystemPermissionsApi(),
          fetchCustomRolesApi(),
        ]);

        if (permData.success) setSystemPermissions(permData.permissions);
        if (roleData.success) setSavedRoles(roleData.roles);
      } catch (err) {
        toast.error(
          "Failed to load schema template components from database context.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    hydratePageData();
  }, []);

  // Handle Multi-level Permission Check Toggles
  const handleTogglePermission = (id: string, isParent: boolean) => {
    if ((id === "all-access" || id === "all_access") && !iHaveAllAccess) {
      toast.error(
        `Access Denied. You require "All Access" permission to grant this.`,
        {
          id: "unauthorized-permissions-lock",
          duration: 3000,
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

    let updated = [...selectedPermissions];

    if (isParent) {
      // Toggling the parent group root is dead simple now
      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
      } else {
        // Clean up any individual child tokens if the parent master-key is selected
        const childrenIds = systemPermissions
          .filter((p) => p.parent_permission === id)
          .map((p) => p.id);

        updated = updated.filter((item) => !childrenIds.includes(item));
        updated.push(id);
      }
    } else {
      // ─── CHILD SELECTION INTERCEPT WINDOW ───
      const targetNode = systemPermissions.find((p) => p.id === id);
      const parentId = targetNode?.parent_permission; // It's directly a string id token

      if (updated.includes(id)) {
        // Case A: Explicit single child uncheck
        updated = updated.filter((item) => item !== id);
      } else if (parentId && updated.includes(parentId)) {
        // Case B: The parent group token was checked, and they just unchecked one child!
        // We must dissolve the parent key into individual tokens for all OTHER children.
        const siblingIds = systemPermissions
          .filter((p) => p.parent_permission === parentId && p.id !== id)
          .map((p) => p.id);

        // Remove the parent token, then append the other sub-permissions explicitly
        updated = updated.filter((item) => item !== parentId);
        updated = Array.from(new Set([...updated, ...siblingIds]));
      } else {
        // Case C: Standard single child check
        updated.push(id);
      }
    }

    setSelectedPermissions(updated);
  };

  const handleApplyPresetRole = (rolePermissions: string[]) => {
    const containsAllAccess = rolePermissions.some(
      (p) => p === "all-access" || p === "all_access",
    );
    if (containsAllAccess && !iHaveAllAccess) {
      toast.error(
        'Access Denied. You require "All Access" permission to apply this role.',
        {
          id: "unauthorized-preset-lock",
          duration: 3000,
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
    setSelectedPermissions(rolePermissions);
    toast.success("Role preset mapped onto permissions.");
  };

  // ─── LIVE API DATABASE WRITE: SAVE ROLE TEMPLATE ───
  const handleSaveAsCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim())
      return toast.error("Enter a valid unique designation label.");
    if (selectedPermissions.length === 0)
      return toast.error("Select permissions to create a custom role.");

    try {
      setSavingCustomRole(true);
      const res = await createCustomRoleApi(
        customRoleName.trim(),
        "Custom Role Preset",
        selectedPermissions,
      );

      if (res.success) {
        setSavedRoles((prev) => [...prev, res.role]);
        setCustomRoleName("");
        toast.success(
          `Role template "${res.role.role_name}" saved successfully.`,
        );
      } else {
        toast.error(res.message || "Failed to save role.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setSavingCustomRole(false);
    }
  };

  // ─── LIVE API DATABASE WRITE: CREATE USER PROFILE ───
  const handleCreateUserWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email)
      return toast.error("Satisfy full name and email routing fields.");

    try {
      setIsSubmitting(true);
      const payload = {
        full_name: fullName,
        email: email,
        password: password,
        phone_number: phoneNumber || null,
        require_password_change: requirePasswordChange,
        sub_account: isSubAccount,
        permissions: selectedPermissions, // Matches renamed table array column
      };

      const res = await createSuperAdminUserWorkspaceApi(payload);

      if (res.success) {
        toast.success(`Onboarding Profile built for ${fullName}.`);
        setFullName("");
        setEmail("");
        setPassword("");
        setPhoneNumber("");
        setSelectedPermissions([]);
      } else {
        toast.error(
          res.message || "Failed to finalize account deployment context.",
        );
      }
    } catch (err) {
      toast.error(
        "Internal service request interception timeout execution error.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentPermissions = systemPermissions.filter(
    (p) => p.parent_permission === null,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans antialiased text-slate-700">
      {/* LEFT TWO COLUMNS: CORE ACCOUNT CREATION FORM MATRIX */}
      <form
        onSubmit={handleCreateUserWorkspace}
        className="lg:col-span-2 space-y-6"
      >
        {/* Core Identity Panel Card Frame */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-montserrat font-black text-slate-900 uppercase tracking-tight">
                Identity Profile Specification
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Provision unique master operational access keys for personnel
                mapping.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Simon"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="simon@gateman.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="flex relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="*********"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gm-gold hover:text-slate-600 transition-colors"
                >
                  {show ? <Eye size={20} /> : <EyeClosed size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-oswald font-black text-slate-400 uppercase tracking-wider">
                Phone number (Optional)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all select-none">
              <input
                type="checkbox"
                checked={requirePasswordChange}
                onChange={(e) => setRequirePasswordChange(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  Enforce Password Renewal
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-normal">
                  Forces user to change password on first login sequence.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-all select-none">
              <input
                type="checkbox"
                checked={isSubAccount}
                onChange={(e) => setIsSubAccount(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  Isolate as Managed Sub-Account
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-normal">
                  Isolating privileges protects the main root entry from
                  accidental deletion.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Dynamic Granular Hierarchy Permissions Mapping Panel */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-base font-montserrat font-black text-slate-900 uppercase tracking-tight">
                Operations Authorization
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Isolate feature intercept points. Checking parent switches
                dynamically chains child nodes.
              </p>
            </div>
          </div>

          <div className="space-y-6 max-h-120 overflow-y-auto">
            {parentPermissions.map((parent) => {
              const subPermissions = systemPermissions.filter(
                (p) => p.parent_permission === parent.id,
              );
              const isParentChecked = selectedPermissions.includes(parent.id);

              return (
                <div
                  key={parent.id}
                  className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="bg-slate-50/80 px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
                    <span className="text-xs font-montserrat font-black uppercase text-slate-800 tracking-wide">
                      {parent.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePermission(parent.id, true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-oswald font-black uppercase tracking-wider transition-all border ${isParentChecked ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:text-slate-700"}`}
                    >
                      {isParentChecked ? "Revoke Group" : "Authorize Group"}
                    </button>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
                    {subPermissions.map((child) => {
                      const isChildChecked =
                        selectedPermissions.includes(child.id) ||
                        isParentChecked;
                      return (
                        <div
                          key={child.id}
                          onClick={() =>
                            handleTogglePermission(child.id, false)
                          }
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChildChecked ? "bg-indigo-50/50 border-indigo-200 text-indigo-900" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50/50"}`}
                        >
                          {isChildChecked ? (
                            <CheckSquare
                              size={16}
                              className="text-indigo-600 shrink-0"
                            />
                          ) : (
                            <Square
                              size={16}
                              className="text-slate-300 shrink-0"
                            />
                          )}
                          <span className="text-xs font-bold leading-none">
                            {child.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-oswald font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <KeyRound size={14} />
              )}{" "}
              Commit Administrative Credentials
            </button>
          </div>
        </div>
      </form>

      {/* RIGHT ONE COLUMN: CUSTOM ROLES PRESET MAPPING TEMPLATES */}
      <div className="space-y-6 lg:h-[calc(100vh-140px)] lg:overflow-y-auto pr-1">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-3">
            <Layers size={16} className="text-slate-400" />
            <h4 className="text-xs font-oswald font-black uppercase tracking-wider">
              Saved Role Layout Templates
            </h4>
          </div>

          <div className="space-y-2">
            {savedRoles.map((role) => (
              <div
                key={role.id}
                className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2 hover:border-slate-300/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {role.role_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetRole(role.permission_ids)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white text-[9px] font-oswald font-black uppercase tracking-wider rounded-lg border border-slate-200 transition-all shadow-sm"
                  >
                    Apply Preset
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permission_ids?.map((pId) => (
                    <span
                      key={pId}
                      className="px-1.5 py-0.5 bg-white text-slate-400 border border-slate-100 rounded-md text-[8px] font-mono font-semibold"
                    >
                      {SYSTEM_PERMISSIONS.find((e) => e.id === pId)?.name || pId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-3">
            <Save size={16} className="text-slate-400" />
            <h4 className="text-xs font-oswald font-black uppercase tracking-wider">
              Save Selections As Role Blueprint
            </h4>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 text-amber-800 p-3 rounded-xl flex items-start gap-2.5 text-[10px] font-medium leading-normal">
            <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Select checkboxes on the left workspace first, then type a
              designated name signature below to bundle them.
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-oswald font-black text-slate-400 uppercase tracking-wider">
                Custom Profile Name Designation
              </label>
              <input
                type="text"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
                placeholder="e.g. Audit Lead Controller"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveAsCustomRole}
              disabled={savingCustomRole} // 🔒 Stops double-submitting
              className={`w-full py-2.5 text-[10px] font-oswald font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                savingCustomRole
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {savingCustomRole ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Storing
                  Configuration...
                </>
              ) : (
                <>
                  <Save size={12} /> Store Configuration as Custom Role
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
