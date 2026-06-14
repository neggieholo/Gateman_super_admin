"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Shield,
  Layers,
  CheckSquare,
  Square,
  Loader2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  PermissionNode,
  CustomRoleMapping,
  SuperAdminUser,
} from "../services/types";
import {
  fetchSystemPermissionsApi,
  fetchCustomRolesApi,
  updateAdminPermissionsApi,
} from "../services/apis";
import { useUser } from "../UserContext";
import { SYSTEM_PERMISSIONS } from "../services/data";

interface AdminPermissionsModalProps {
  user: SuperAdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function AdminPermissionsModal({
  user,
  isOpen,
  onClose,
  onUpdateSuccess,
}: AdminPermissionsModalProps) {
  const { user: currentUser } = useUser();
  const myPermissions = currentUser?.permissions || [];
  const iHaveAllAccess = myPermissions.includes("all-access");

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Schema matrices repositories
  const [systemPermissions, setSystemPermissions] = useState<PermissionNode[]>(
    [],
  );
  const [savedRoles, setSavedRoles] = useState<CustomRoleMapping[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // 📡 Sync & Hydrate structural schemas on open
  useEffect(() => {
    if (!isOpen || !user) return;

    const hydrateModalLayout = async () => {
      setLoading(true);
      try {
        const [permData, roleData] = await Promise.all([
          fetchSystemPermissionsApi(),
          fetchCustomRolesApi(),
        ]);

        if (permData.success) setSystemPermissions(permData.permissions);
        if (roleData.success) setSavedRoles(roleData.roles);

        // 🎯 Pre-populate all currently ticked access permissions for this individual user
        setSelectedPermissions(user.permissions || []);
      } catch (err) {
        toast.error(
          "Failed to sync permissions mapping matrix schema definitions.",
        );
      } finally {
        setLoading(false);
      }
    };

    hydrateModalLayout();
  }, [isOpen, user]);

  // Hierarchical structural evaluation loops
  const parentPermissions = useMemo(() => {
    return systemPermissions.filter((p) => p.parent_permission === null);
  }, [systemPermissions]);

  const handleTogglePermission = (id: string, isParent: boolean) => {
    if ((id === "all-access" || id === "all_access") && !iHaveAllAccess) {
      toast.error(
        `Access Denied. You require "All Access" permission to grant this.`,
      );
      return;
    }

    let updated = [...selectedPermissions];

    if (isParent) {
      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
      } else {
        const childrenIds = systemPermissions
          .filter((p) => p.parent_permission === id)
          .map((p) => p.id);
        updated = updated.filter((item) => !childrenIds.includes(item));
        updated.push(id);
      }
    } else {
      const targetNode = systemPermissions.find((p) => p.id === id);
      const parentId = targetNode?.parent_permission;

      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
      } else if (parentId && updated.includes(parentId)) {
        const siblingIds = systemPermissions
          .filter((p) => p.parent_permission === parentId && p.id !== id)
          .map((p) => p.id);
        updated = updated.filter((item) => item !== parentId);
        updated = Array.from(new Set([...updated, ...siblingIds]));
      } else {
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
        'Access Denied. Preset contains "All Access" which your configuration lacks.',
      );
      return;
    }
    setSelectedPermissions(rolePermissions);
    toast.success("Role preset layout mapped.");
  };

  const handleSavePermissions = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await updateAdminPermissionsApi(user.id, selectedPermissions);
      if (res.success) {
        toast.success(
          `Security authorization matrix reconfigured for ${user.full_name}`,
        );
        onUpdateSuccess();
        onClose();
      } else {
        toast.error(
          res.message || "Failed to finalize structural privilege updates.",
        );
      }
    } catch (err) {
      toast.error("Internal transaction handshake intercept timeout error.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-montserrat font-black text-slate-900 uppercase tracking-tight">
                Modify Permissions
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Isolating core application privilege nodes for Admin signature:{" "}
                <span className="text-slate-700 font-bold font-mono">
                  {user.full_name} ({user.email})
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* WORKSPACE MIDDLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {loading ? (
            <div className="col-span-1 lg:col-span-3 flex flex-col items-center justify-center h-full gap-2 text-slate-400 font-bold text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              Synchronizing privilege mapping schemas...
            </div>
          ) : (
            <>
              {/* LEFT MAIN CHECKBOX COLUMN */}
              <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-1">
                {parentPermissions.map((parent) => {
                  const subPermissions = systemPermissions.filter(
                    (p) => p.parent_permission === parent.id,
                  );
                  const isParentChecked = selectedPermissions.includes(
                    parent.id,
                  );

                  return (
                    <div
                      key={parent.id}
                      className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white"
                    >
                      <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                        <span className="text-xs font-montserrat font-black uppercase text-slate-800 tracking-wide">
                          {parent.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleTogglePermission(parent.id, true)
                          }
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-oswald font-black uppercase tracking-wider transition-all border ${isParentChecked ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200 hover:text-slate-700"}`}
                        >
                          {isParentChecked ? "Revoke Group" : "Authorize Group"}
                        </button>
                      </div>

                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${isChildChecked ? "bg-indigo-50/40 border-indigo-200 text-indigo-900" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50/50"}`}
                            >
                              {isChildChecked ? (
                                <CheckSquare
                                  size={14}
                                  className="text-indigo-600 shrink-0"
                                />
                              ) : (
                                <Square
                                  size={14}
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

              {/* RIGHT SIDE PRESETS OVERVIEW COLUMN */}
              <div className="space-y-4 overflow-y-auto bg-slate-50/40 p-4 rounded-2xl border border-slate-100/70">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
                  <Layers size={14} className="text-slate-400" />
                  <h4 className="text-[10px] font-oswald font-black uppercase tracking-wider text-slate-500">
                    Map Preset Blueprint Overlay
                  </h4>
                </div>
                <div className="space-y-2">
                  {savedRoles.map((role) => (
                    <div
                      key={role.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col gap-1.5 hover:border-slate-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {role.role_name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyPresetRole(role.permission_ids)
                          }
                          className="px-2 py-0.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-[9px] font-oswald font-black uppercase tracking-wider rounded-md border border-slate-200 transition-all"
                        >
                          Apply
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-0.5 max-h-16 overflow-y-auto m-2">
                        {role.permission_ids?.map((pId) => {
                          const matchedPermission = SYSTEM_PERMISSIONS.find(
                            (p) => p.id === pId,
                          );
                          return (
                            <span
                              key={pId}
                              className="px-1 py-0.5 bg-slate-50 font-sans text-xs rounded text-slate-400"
                            >
                              {matchedPermission?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* BOTTOM ACTION TRAY */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || loading}
            onClick={handleSavePermissions}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-oswald font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Commit Permission Changes
          </button>
        </div>
      </div>
    </div>
  );
}
