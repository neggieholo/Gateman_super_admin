/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from "react";
import {
  getAllResidents,
  getEstateResidents,
} from "../services/apis_residents";
import { getRelativeTime } from "../services/apis";
import toast from "react-hot-toast";
import { History, X, ShieldAlert, Trash2 } from "lucide-react";
import { EstatesListRow, Resident } from "../services/types";
import SecurityActionWarningModal from "./SecurityActionWarningModal";
import {
  deleteGlobalResidentAccount,
  updateGlobalResidentStatus,
} from "../services/apis_residents";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./ManageUsersPage";
import AuditLogsPage from "./AuditLogs";

interface ResidentsOverviewPageProps {
  estateId?: string;
  estatename?: string;
  all?: boolean;
  onBack: () => void;
}

type AccountFilterType = "all" | "main" | "sub";

export default function ResidentsOverviewPage({
  estateId = "",
  estatename = "",
  all = false,
  onBack,
}: ResidentsOverviewPageProps) {
  const { user } = useUser();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [estatesMap, setEstatesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] =
    useState<AccountFilterType>("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(
    null,
  );

  const [viewAllLogs, setViewAllLogs] = useState(false);
  const [viewIndividualLogs, setViewIndividualLogs] = useState(false);

  // Destructive Action Protection States
  const [actionLoading, setActionLoading] = useState(false);
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

  // Fetch residents from tenant_users pipeline context matching this estateId
  useEffect(() => {
    async function loadResidentsData() {
      try {
        setLoading(true);
        const res = all
          ? await getAllResidents()
          : await getEstateResidents(estateId);
        if (res.success) {
          setResidents(res.residents || []);

          // Map estate arrays to look up estate names dynamically by ID
          if (Array.isArray(res.estatesList)) {
            const lookupContainer: Record<string, string> = {};
            res.estatesList.forEach((est: EstatesListRow) => {
              lookupContainer[est.id] = est.name;
            });
            setEstatesMap(lookupContainer);
          }
        } else {
          toast.error(
            res.message || "Failed to sync resident ledger logs map.",
          );
        }
      } catch (err) {
        console.error("Component UI data fetch hook exception:", err);
        toast.error("Unexpected pipeline response configuration exception.");
      } finally {
        setLoading(false);
      }
    }

    if (all || estateId) {
      loadResidentsData();
    }
  }, [estateId, all]);

  // Filter list records against type filter and search query string parameters
  const filteredResidents = residents.filter((res) => {
    if (accountTypeFilter === "main" && res.parent_account_id) return false;
    if (accountTypeFilter === "sub" && !res.parent_account_id) return false;

    if (searchTerm.trim() !== "") {
      const matchQuery = searchTerm.toLowerCase();
      return (
        res.name.toLowerCase().includes(matchQuery) ||
        res.email.toLowerCase().includes(matchQuery) ||
        (res.phone && res.phone.toLowerCase().includes(matchQuery))
      );
    }
    return true;
  });

  // Calculate quick metrics summaries
  const totalResidentsCount = residents.length;
  let subaccountsCount = 0;
  residents.forEach((res) => {
    if (res.parent_account_id) subaccountsCount++;
  });

  const handleOpenDetails = (resident: Resident) => {
    setSelectedResident(resident);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedResident(null);
    setShowDetailsModal(false);
  };

  const triggerStatusWarning = (
    name: string,
    currentStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setWarningConfig({
      title:
        nextStatus === "SUSPENDED"
          ? "Global Account Suspension"
          : "Global Account Reactivation",
      message: `CRITICAL STATUS CHALLENGE: Are you completely certain you want to globally change "${name}'s" account status to ${nextStatus}?`,
      confirmText:
        nextStatus === "SUSPENDED" ? "Suspend Account" : "Activate Account",
      variant: "warning",
      onConfirm: async () => {
        await handleSuspendAccount(nextStatus);
      },
    });
    setIsWarningOpen(true);
  };

  const triggerDeleteWarning = (name: string) => {
    setWarningConfig({
      title: "Delete Estate Account",
      message: `CRITICAL DATA DELETION FORCE CHALLENGE: Are you completely certain you want to permanently purge "${name}" from the GateMan core database? This action is absolute and cannot be undone.`,
      confirmText: "Delete Account",
      variant: "danger",
      onConfirm: async () => {
        await handleDeleteAccount();
      },
    });
    setIsWarningOpen(true);
  };

  const handleSuspendAccount = async (targetStatus: "ACTIVE" | "SUSPENDED") => {
    if (!selectedResident) return;
    const canToggleStatus =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("modify_estate_resident_status") ||
      user?.permissions.includes("all-access");

    if (!canToggleStatus) {
      showAccessDeniedToast();
      return;
    }
    try {
      setActionLoading(true);
      const res = await updateGlobalResidentStatus(
        selectedResident.id,
        targetStatus,
      );

      if (res.success) {
        toast.success(`Account status updated to ${targetStatus}`);

        // Update local items array
        setResidents((prev) =>
          prev.map((r) =>
            r.id === selectedResident.id ? { ...r, status: targetStatus } : r,
          ),
        );

        // Sync active modal viewer
        setSelectedResident((prev) =>
          prev ? { ...prev, status: targetStatus } : null,
        );
        setIsWarningOpen(false);
      } else {
        toast.error(
          res.message || "Execution rejected by core system pipelines.",
        );
      }
    } catch (err) {
      toast.error("Failed to execute status update routine.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedResident) return;
    const canDeleteAccount =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("delete_estate_resident_account") ||
      user?.permissions.includes("all-access");

    if (!canDeleteAccount) {
      showAccessDeniedToast();
      return;
    }
    try {
      setActionLoading(true);

      // RUN CALL TO GLOBAL SUPERADMIN DELETION HOOK
      const res = await deleteGlobalResidentAccount(selectedResident.id);

      if (res.success) {
        toast.success(
          `Account node ${selectedResident.name} globally purged successfully.`,
        );

        // Optimistically drop from master array state manager mapping
        setResidents((prev) =>
          prev.filter((r) => r.id !== selectedResident.id),
        );

        // Lower structural modal visibility flags and close the view panel context
        setIsWarningOpen(false);
        handleCloseDetails();
      } else {
        toast.error(
          res.message ||
            "Deletion sequence rejected by database engine vectors.",
        );
      }
    } catch (err) {
      toast.error("Database deletion target response rejection occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  if (viewAllLogs) {
    if (all) {
      return (
        <AuditLogsPage
          all={true}
          name="ALL ESTATES"
          onBack={() => setViewAllLogs(false)}
        />
      );
    } else {
      return (
        <AuditLogsPage
          estate_id={estateId}
          name={`${estatename?.toUpperCase() || "UNKNOWN ESTATE"}`}
          all={true}
          role="TENANT"
          onBack={() => setViewAllLogs(false)}
        />
      );
    }
  }

  if (viewIndividualLogs) {
    return (
      <AuditLogsPage
        id={selectedResident?.id}
        name={selectedResident?.name.toUpperCase()}
        onBack={() => {
          setViewIndividualLogs(false);
          setSelectedResident(null);
        }}
      />
    );
  }

  return (
    <div className="p-1 sm:p-6 bg-slate-50 overflow-hidden flex flex-col flex-1 min-h-0 space-y-6">
      {/* Navigation Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-1.5 inline-flex items-center gap-1"
          >
            ← {all ? "Back" : "Back to Control Desk"}
          </button>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {all
              ? "System-Wide Registered Residents"
              : `${estatename} Registered Residents`}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Directory mapping of core tenant accounts, virtual wallets, and
            authentication hooks.
          </p>
        </div>

        <div>
          <button
            onClick={() => setViewAllLogs(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-gray-200"
          >
            View All Logs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Residents Linked
              </p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-1">
                {totalResidentsCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sub-Account Vectors
              </p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-1">
                {subaccountsCount}
              </p>
            </div>
          </div>

          {/* Primary Table Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Live Account Registry Ledger
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  Showing {filteredResidents.length} records
                </span>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
                  <button
                    onClick={() => setAccountTypeFilter("all")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      accountTypeFilter === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All Accounts
                  </button>
                  <button
                    onClick={() => setAccountTypeFilter("main")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      accountTypeFilter === "main"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Main
                  </button>
                  <button
                    onClick={() => setAccountTypeFilter("sub")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      accountTypeFilter === "sub"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Sub
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search name, email, phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-medium bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-120.5 scrollbar-thin">
              {filteredResidents.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-xs font-bold text-slate-400">
                    No matching tenant accounts discovered.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse relative">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 bg-slate-50">
                        Resident profile
                      </th>
                      <th className="py-3 px-4 bg-slate-50">Contact</th>
                      <th className="py-3 px-4 bg-slate-50">Account Type</th>
                      <th className="py-3 px-4 bg-slate-50">
                        Registered Estates
                      </th>
                      <th className="py-3 px-4 bg-slate-50">Last Activity</th>
                      <th className="py-3 px-4 bg-slate-50 text-right">
                        Onboarded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                    {filteredResidents.map((resident) => (
                      <tr
                        key={resident.id}
                        onClick={() => handleOpenDetails(resident)}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                              {resident.avatar ? (
                                <img
                                  src={resident.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-black text-slate-500 uppercase">
                                  {resident.name.substring(0, 2)}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-slate-800 tracking-tight">
                              {resident.name}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-700 font-medium">
                            {resident.email}
                          </p>
                          <p className="text-[12px] text-slate-500 font-mono mt-0.5">
                            {resident.phone || "No Active Phone"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {resident.parent_account_id ? (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              Sub Account
                            </span>
                          ) : (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              Main Account
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {resident.estate_ids ? resident.estate_ids.length : 0}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-700 text-[11px]">
                            {resident.last_activity_at
                              ? `Active ${getRelativeTime(resident.last_activity_at)}`
                              : "No system metrics"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                          {resident.created_at
                            ? new Date(resident.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resident Details Drawer Modal */}
      {showDetailsModal && selectedResident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={handleCloseDetails}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1 pb-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Resident Information
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Summary Card */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div
                  onClick={() => setShowImagePreview(true)}
                  className="w-14 h-14 bg-slate-200 rounded-2xl border border-slate-300 shrink-0 overflow-hidden flex items-center justify-center"
                >
                  {selectedResident.avatar ? (
                    <img
                      src={selectedResident.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-black text-slate-500 uppercase">
                      {selectedResident.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-base font-black text-slate-900 truncate">
                    {selectedResident.name}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Registered:{" "}
                    {selectedResident.created_at
                      ? new Date(
                          selectedResident.created_at,
                        ).toLocaleDateString()
                      : "---"}
                  </p>
                </div>
                <span className="text-slate-300">•</span>
                {selectedResident.biometric_login ? (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    Biometrics Enabled
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Biometrics Not Enabled
                  </span>
                )}
              </div>

              {/* Data Field Stack */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Email
                  </label>
                  <p className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl select-all">
                    {selectedResident.email}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Phone
                  </label>
                  <p className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl select-all">
                    {selectedResident.phone || "No Active Phone"}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Account Type
                  </label>
                  <p className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl">
                    {selectedResident.parent_account_id ? (
                      (() => {
                        const parentUser = residents.find(
                          (r) => r.id === selectedResident.parent_account_id,
                        );
                        return (
                          <span
                            onClick={() =>
                              parentUser
                                ? handleOpenDetails(parentUser)
                                : toast.error(
                                    "Parent account record is out of context scope.",
                                  )
                            }
                            className={`font-bold transition-colors ${parentUser ? "text-amber-600 hover:text-amber-700 cursor-pointer underline decoration-dotted underline-offset-2" : "text-amber-600 cursor-not-allowed"}`}
                          >
                            Sub Account (Parent Account:{" "}
                            {parentUser
                              ? parentUser.name
                              : "Unknown Context Profile"}
                            )
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-emerald-600 font-bold">
                        Standalone / Main Account Node
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Authorized Access Footprint & Mapped Units
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedResident.estate_ids &&
                    selectedResident.estate_ids.length > 0 ? (
                      selectedResident.estate_ids.map((id) => {
                        // Look up the specific location pairings assigned to this estate ID context
                        const estateLocations =
                          selectedResident.locations?.[id] || [];
                        const mappedEstateName =
                          estatesMap[id] ||
                          `Unknown Estate (${id.substring(0, 6)})`;

                        return (
                          <div
                            key={id}
                            className={`p-3 rounded-xl border transition-all ${
                              id === estateId
                                ? "bg-indigo-50/60 border-indigo-200"
                                : "bg-slate-50/50 border-slate-200"
                            }`}
                          >
                            {/* Estate Header Label */}
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[10px] font-black uppercase tracking-tight ${
                                  id === estateId
                                    ? "text-indigo-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {mappedEstateName}
                              </span>
                              {id === estateId && (
                                <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest scale-90">
                                  Current
                                </span>
                              )}
                            </div>

                            {/* Mapped Blocks and Units Nested List */}
                            {estateLocations.length > 0 ? (
                              <div className="space-y-1.5 pl-1 border-l-2 border-slate-200/60">
                                {estateLocations.map((loc, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[11px] text-slate-600 flex items-baseline gap-1"
                                  >
                                    <span className="font-bold text-slate-800 shrink-0">
                                      Block {loc.block || "—"}:
                                    </span>
                                    <span className="font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-100 shadow-2xs">
                                      {loc.unit && loc.unit.length > 0
                                        ? loc.unit.join(", ")
                                        : "No Units Assigned"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] italic text-slate-400 pl-1">
                                No specific residential unit footprints linked
                                to this zone profile.
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs italic text-slate-400 py-1">
                        No registered housing blocks mapped.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full p-3 flex justify-center">
                <button
                  onClick={() => setViewIndividualLogs(true)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg border text-slate-500 hover:text-slate-800 transition-all inline-flex items-center gap-1 font-bold text-[14px]"
                >
                  <History size={14} />
                  <span>View Logs</span>
                </button>
              </div>

              {/* ─── ADMINISTRATIVE EMERGENCY DANGER ZONE BLOCK ─── */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">
                  Administrative Access Interventions
                </span>

                {/* Suspend Action Panel */}
                <button
                  disabled={actionLoading}
                  onClick={() =>
                    triggerStatusWarning(
                      selectedResident.name,
                      selectedResident.status || "ACTIVE",
                    )
                  }
                  className="w-full py-2.5 px-4 border border-amber-200 bg-amber-50 hover:bg-amber-100/70 text-amber-800 rounded-xl text-xs font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={15} className="text-amber-600" />
                    {selectedResident.status === "SUSPENDED"
                      ? "Reactivate Resident Access"
                      : "Suspend Resident Access"}
                  </span>
                  <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-900 group-hover:bg-amber-200">
                    {selectedResident.status === "SUSPENDED"
                      ? "Activate"
                      : "Revoke"}
                  </span>
                </button>

                {/* Delete Action Panel */}
                <button
                  disabled={actionLoading}
                  onClick={() => triggerDeleteWarning(selectedResident.name)}
                  className="w-full py-2.5 px-4 border border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={15} className="text-rose-600" />
                    Purge Account
                  </span>
                  <span className="text-[10px] bg-rose-200/60 px-2 py-0.5 rounded text-rose-900 group-hover:bg-rose-200">
                    Delete
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Dismiss Footer */}
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                onClick={handleCloseDetails}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}
      {showImagePreview && selectedResident?.avatar && (
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
              src={selectedResident?.avatar}
              alt={`${selectedResident?.name} expanded avatar`}
              className="max-w-full max-h-[80vh] rounded-3xl object-contain border border-slate-800 shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Stop overlay click collapse when clicking image directly
            />
          </div>
        </div>
      )}
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
