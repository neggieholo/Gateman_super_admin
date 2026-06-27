/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from "react";
import {
  deleteGlobalResidentAccount,
  getAllSecurityUsers,
  getEstateSecurityUsers,
  updateGlobalSecurityStatus,
} from "../services/apis_residents";

import { fetchReadableAddress, getRelativeTime } from "../services/apis";
import toast from "react-hot-toast";
import { History, X, ShieldAlert, Trash2 } from "lucide-react";
import SecurityActionWarningModal from "./SecurityActionWarningModal";
import { SecurityUser } from "../services/types";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./ManageUsersPage";

interface SecurityPersonnelPageProps {
  estateId?: string;
  estatename?: string;
  all?: boolean;
  onBack: () => void;
}

type DutyFilterType = "all" | "on_duty" | "off_duty";

export default function SecurityPersonnelPage({
  estateId = "",
  estatename = "",
  all = false,
  onBack,
}: SecurityPersonnelPageProps) {
  const { user } = useUser();
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dutyFilter, setDutyFilter] = useState<DutyFilterType>("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<SecurityUser | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [lastKnownAddress, setLastKnownAddress] = useState<string>(
    "Loading location...",
  );
  const [checkInAddress, setCheckInAddress] = useState<string>(
    "Loading location...",
  );
  const [checkOutAddress, setCheckoutAddress] = useState<string>(
    "Loading location...",
  );

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

  useEffect(() => {
    if (selectedGuard?.last_known_location) {
      fetchReadableAddress(selectedGuard.last_known_location, true)
        .then((address) =>
          setLastKnownAddress(address || "No recorded location"),
        )
        .catch(() => setLastKnownAddress("No recorded location"));
    } else {
      setLastKnownAddress("No recorded location");
    }

    if (selectedGuard?.checkin_location) {
      fetchReadableAddress(selectedGuard.checkin_location, true)
        .then((address) => setCheckInAddress(address || "No recorded location"))
        .catch(() => setCheckInAddress("No recorded location"));
    } else {
      setCheckInAddress("No recorded location");
    }

    if (selectedGuard?.checkout_location) {
      fetchReadableAddress(selectedGuard.checkout_location, true)
        .then((address) =>
          setCheckoutAddress(address || "No recorded location"),
        )
        .catch(() => setCheckoutAddress("No recorded location"));
    } else {
      setCheckoutAddress("No recorded location");
    }
  }, [selectedGuard]);

  // Sync security force list
  useEffect(() => {
    async function loadSecurityWorkforce() {
      try {
        setLoading(true);
        const res = all
          ? await getAllSecurityUsers()
          : await getEstateSecurityUsers(estateId);
        if (res.success) {
          setGuards(res.securityUsers || []);
        } else {
          toast.error(
            res.message || "Failed to load estate security registry profiles.",
          );
        }
      } catch (err) {
        console.error("Exception loading guard ledger data profiles:", err);
        toast.error(
          "Unexpected runtime pipeline connection error mapping personnel charts.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (all || estateId) {
      loadSecurityWorkforce();
    }
  }, [estateId, all]);

  const filteredGuards = guards.filter((guard) => {
    if (dutyFilter === "on_duty" && !guard.is_on_duty) return false;
    if (dutyFilter === "off_duty" && guard.is_on_duty) return false;

    if (searchTerm.trim() !== "") {
      const matchQuery = searchTerm.toLowerCase();
      return (
        guard.name.toLowerCase().includes(matchQuery) ||
        guard.email.toLowerCase().includes(matchQuery) ||
        (guard.phone && guard.phone.toLowerCase().includes(matchQuery))
      );
    }
    return true;
  });

  const totalGuardsCount = guards.length;
  const onDutyCount = guards.filter((g) => g.is_on_duty).length;

  const handleOpenDetails = (guard: SecurityUser) => {
    setSelectedGuard(guard);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedGuard(null);
    setShowDetailsModal(false);
  };

  const openImageExpanded = (url: string) => {
    setPreviewImageUrl(url);
    setShowImagePreview(true);
  };

  // Status Switch Guard
  const triggerStatusWarning = (
    name: string,
    currentStatus: "ACTIVE" | "SUSPENDED",
  ) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setWarningConfig({
      title:
        nextStatus === "SUSPENDED"
          ? "Suspend Security Access"
          : "Reactivate Security Access",
      message: `CRITICAL STATUS CHALLENGE: Are you completely certain you want to change guard "${name}'s" global access parameters to ${nextStatus}?`,
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
      title: "Purge Security Account Record",
      message: `CRITICAL DATA DELETION CHALLENGE: Are you certain you want to permanently delete guard "${name}"? This action removes authentication capabilities completely.`,
      confirmText: "Delete Account",
      variant: "danger",
      onConfirm: async () => {
        await handleDeleteAccount();
      },
    });
    setIsWarningOpen(true);
  };

  const handleSuspendAccount = async (targetStatus: "ACTIVE" | "SUSPENDED") => {
    if (!selectedGuard) return;
    const canToggleStatus =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("modify_estate_guard_status") ||
      user?.permissions.includes("all-access");

    if (!canToggleStatus) {
      showAccessDeniedToast();
      return;
    }
    try {
      setActionLoading(true);
      const res = await updateGlobalSecurityStatus(
        selectedGuard.id,
        targetStatus,
      );
      if (res.success) {
        toast.success(`Security credential marked ${targetStatus}`);
        setGuards((prev) =>
          prev.map((g) =>
            g.id === selectedGuard.id ? { ...g, status: targetStatus } : g,
          ),
        );
        setSelectedGuard((prev) =>
          prev ? { ...prev, status: targetStatus } : null,
        );
        setIsWarningOpen(false);
      } else {
        toast.error(
          res.message || "Failed execution routine mapping status changes.",
        );
      }
    } catch (err) {
      toast.error("Pipeline failure shifting status indices.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedGuard) return;
    const canDeleteAccount =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("delete_estate_security_account") ||
      user?.permissions.includes("all-access");

    if (!canDeleteAccount) {
      showAccessDeniedToast();
      return;
    }
    try {
      setActionLoading(true);
      const res = await deleteGlobalResidentAccount(selectedGuard.id);
      if (res.success) {
        toast.success(`Personnel context parsed out cleanly.`);
        setGuards((prev) => prev.filter((g) => g.id !== selectedGuard.id));
        setIsWarningOpen(false);
        handleCloseDetails();
      } else {
        toast.error(res.message || "Workforce removal process rejected.");
      }
    } catch (err) {
      toast.error("Exception handling database deletion sequence protocols.");
    } finally {
      setActionLoading(false);
    }
  };

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
              ? "System-Wide Security Personnel"
              : `${estatename} Security Personnel Force`}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Workforce directory tracking active guards, operational shifts, duty
            metrics, and biometrics.
          </p>
        </div>

        <div>
          <button
            onClick={() => console.log("Viewing logs")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-gray-200"
          >
            View Logs History
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Registered Force
              </p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-1">
                {totalGuardsCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Guards On-Duty Right Now
              </p>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {onDutyCount}
              </p>
            </div>
          </div>

          {/* Primary Table Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Live Force Registry Ledger
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  Showing {filteredGuards.length} guards
                </span>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
                  <button
                    onClick={() => setDutyFilter("all")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${dutyFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    All Staff
                  </button>
                  <button
                    onClick={() => setDutyFilter("on_duty")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${dutyFilter === "on_duty" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    On Duty
                  </button>
                  <button
                    onClick={() => setDutyFilter("off_duty")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${dutyFilter === "off_duty" ? "bg-white text-slate-500 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Off Duty
                  </button>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search name, phone, email profile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-medium bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-120.5 scrollbar-thin">
              {filteredGuards.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-xs font-bold text-slate-400">
                    No security officers match the given search criteria.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse relative">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 bg-slate-50">Personnel</th>
                      <th className="py-3 px-4 bg-slate-50">
                        Operational Status
                      </th>
                      <th className="py-3 px-4 bg-slate-50">Contact Points</th>
                      <th className="py-3 px-4 bg-slate-50">
                        Last Shift Milestone
                      </th>
                      <th className="py-3 px-4 bg-slate-50 text-right">
                        Onboarded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                    {filteredGuards.map((guard) => (
                      <tr
                        key={guard.id}
                        onClick={() => handleOpenDetails(guard)}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                              <img
                                src={
                                  guard.avatar ||
                                  "https://via.placeholder.com/150"
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 tracking-tight flex items-center gap-1">
                                {guard.name}
                                {guard.status === "SUSPENDED" && (
                                  <span className="text-[8px] bg-rose-100 text-rose-700 font-extrabold px-1 rounded uppercase">
                                    Suspended
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                                {guard.role || "SECURITY"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {guard.is_on_duty ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active On Duty
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                              Off Duty Rotation
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-700 font-medium">
                            {guard.email}
                          </p>
                          <p className="text-[12px] text-slate-500 font-mono mt-0.5">
                            {guard.phone || "No Contact Phone"}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex justify-start gap-2">
                            {guard.is_on_duty && guard.last_checkin ? (
                              <span className="text-[11px] font-medium text-emerald-700">
                                Checked in {getRelativeTime(guard.last_checkin)}
                              </span>
                            ) : guard.last_activity_at ? (
                              <span className="text-[11px] text-slate-600">
                                Active {getRelativeTime(guard.last_activity_at)}
                              </span>
                            ) : guard.last_checkout ? (
                              <span className="text-[11px] text-slate-400">
                                Checked out{" "}
                                {getRelativeTime(guard.last_checkout)}
                              </span>
                            ) : (
                              <span className="text-[10px] italic text-slate-400">
                                No logged metrics
                              </span>
                            )}
                            <button
                              onClick={() =>
                                console.log(
                                  `Viewing activity logs for ID: ${guard.id}`,
                                )
                              }
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all inline-flex items-center gap-1 font-bold text-[11px]"
                            >
                              <History size={14} />
                              <span>Logs</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                          {guard.created_at
                            ? new Date(guard.created_at).toLocaleDateString(
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

      {/* Security Guard Details Drawer Modal */}
      {showDetailsModal && selectedGuard && (
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
                  Security Profile Detail
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
                  onClick={() =>
                    openImageExpanded(
                      selectedGuard.avatar || "https://via.placeholder.com/150",
                    )
                  }
                  className="w-14 h-14 bg-slate-200 rounded-2xl border border-slate-300 shrink-0 overflow-hidden flex items-center justify-center cursor-zoom-in"
                >
                  <img
                    src={
                      selectedGuard.avatar || "https://via.placeholder.com/150"
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-base font-black text-slate-900 truncate">
                    {selectedGuard.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {selectedGuard.is_on_duty ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                        ON DUTY
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        OFF DUTY
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    {selectedGuard.biometric_login ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        Biometrics Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Biometrics Not Enabled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Field Stack */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Email ID Reference
                    </label>
                    <p className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl truncate select-all">
                      {selectedGuard.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Phone Line
                    </label>
                    <p className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl select-all">
                      {selectedGuard.phone || "No Number"}
                    </p>
                  </div>
                </div>

                {/* Duty Parameters Log Tracking */}
                <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-3">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                    Operational Geolocation Metrics
                  </span>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Last Known Coordinate Check
                      </p>
                      <p className="font-medium text-slate-700 mt-0.5 font-mono text-[11px] bg-white p-1.5 rounded border border-slate-100">
                        {lastKnownAddress}
                        {selectedGuard.last_location_time &&
                          ` (${getRelativeTime(selectedGuard.last_location_time)})`}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Check-in Terminal
                        </p>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                          {checkInAddress || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Check-out Terminal
                        </p>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                          {checkOutAddress || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verified KYC Identification Section */}
                {/* <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Verified Identification Ledger (
                    {selectedGuard.id_type || "No ID Type Specified"})
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[9px] text-slate-400 font-medium block mb-1">
                        ID Card Front Page
                      </span>
                      {selectedGuard.id_front_url ? (
                        <div
                          onClick={() =>
                            openImageExpanded(selectedGuard.id_front_url!)
                          }
                          className="relative h-24 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden cursor-zoom-in group"
                        >
                          <img
                            src={selectedGuard.id_front_url}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            alt="Front ID"
                          />
                          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors flex items-center justify-center">
                            <Eye
                              size={16}
                              className="text-white drop-shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] italic text-slate-400">
                          Not Uploaded
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-medium block mb-1">
                        ID Card Reverse Page
                      </span>
                      {selectedGuard.id_back_url ? (
                        <div
                          onClick={() =>
                            openImageExpanded(selectedGuard.id_back_url!)
                          }
                          className="relative h-24 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden cursor-zoom-in group"
                        >
                          <img
                            src={selectedGuard.id_back_url}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            alt="Back ID"
                          />
                          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors flex items-center justify-center">
                            <Eye
                              size={16}
                              className="text-white drop-shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] italic text-slate-400">
                          Not Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div> */}
              </div>

              {/* ─── ADMINISTRATIVE CONTROL INTERVENTIONS ─── */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">
                  Administrative Access Interventions
                </span>

                {/* Suspend Action Panel */}
                <button
                  disabled={actionLoading}
                  onClick={() =>
                    triggerStatusWarning(
                      selectedGuard.name,
                      selectedGuard.status || "ACTIVE",
                    )
                  }
                  className="w-full py-2.5 px-4 border border-amber-200 bg-amber-50 hover:bg-amber-100/70 text-amber-800 rounded-xl text-xs font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={15} className="text-amber-600" />
                    {selectedGuard.status === "SUSPENDED"
                      ? "Reactivate Guard Credentials"
                      : "Suspend Guard Credentials"}
                  </span>
                  <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-900 group-hover:bg-amber-200">
                    {selectedGuard.status === "SUSPENDED"
                      ? "Activate"
                      : "Revoke"}
                  </span>
                </button>

                {/* Delete Action Panel */}
                <button
                  disabled={actionLoading}
                  onClick={() => triggerDeleteWarning(selectedGuard.name)}
                  className="w-full py-2.5 px-4 border border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={15} className="text-rose-600" />
                    Purge Guard Account
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

      {/* Expanded Document/Image Overlay Viewer */}
      {showImagePreview && previewImageUrl && (
        <div
          onClick={() => setShowImagePreview(false)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-[90vw] max-h-[85vh] animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
            >
              <X size={18} />
            </button>
            <img
              src={previewImageUrl}
              alt="Expanded Document Verification Resource View"
              className="max-w-full max-h-[80vh] rounded-3xl object-contain border border-slate-800 shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
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
