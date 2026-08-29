/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useCallback } from "react";
import { billingApi } from "../services/apis_estates";
import { EstateSubscription, PaymentLedgerItem } from "../services/types";
import toast from "react-hot-toast";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./ManageUsersPage";
import { ADDON_MODULES } from "../services/data";
import { Download } from "lucide-react";

const PLAN_OPTIONS = [
  { id: "ALL", label: "All Plans" },
  { id: "trial", label: "Trial" },
  ...ADDON_MODULES.map((addon) => ({
    id: addon.id,
    label: addon.name,
  })),
];

interface SubscriptionsProps {
  searchName: string | null;
}

export default function SubscriptionsLedgerView({
  searchName,
}: SubscriptionsProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<EstateSubscription[]>([]);
  const [ledger, setLedger] = useState<PaymentLedgerItem[]>([]);

  // UI Control States
  const [activeTab, setActiveTab] = useState<"subscriptions" | "ledger">(
    "subscriptions",
  );
  const [selectedEstate, setSelectedEstate] =
    useState<EstateSubscription | null>(null);
  const [extensionDuration, setExtensionDuration] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingApi.getSubscriptions();
      setSubscriptions(data.subscriptions || []);
      setLedger(data.payments_ledger || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load billing records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Sync searchName prop directly to searchQuery whenever searchName changes
  useEffect(() => {
    if (searchName !== null && searchName !== undefined) {
      setSearchQuery(searchName.toLowerCase());
    }
  }, [searchName]);

  const matchPlanFilter = (planRaw: any, selectedFilter: string): boolean => {
    if (selectedFilter === "ALL") return true;

    // Safe parse if plan is stored as a JSON string in DB
    const plan =
      typeof planRaw === "string"
        ? (() => {
            try {
              return JSON.parse(planRaw);
            } catch {
              return planRaw;
            }
          })()
        : planRaw;

    if (selectedFilter === "trial") {
      return Boolean(plan?.is_trial);
    }

    // Direct string plan check (e.g., if plan is saved as a single module ID)
    if (typeof plan === "string") {
      return plan.toLowerCase() === selectedFilter.toLowerCase();
    }

    // Array check for multi-module subscriptions
    if (Array.isArray(plan?.selected_add_ons)) {
      return plan.selected_add_ons.includes(selectedFilter);
    }

    return false;
  };

  // Filter Logic: Subscriptions Tab
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.estate_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        sub.subscription_status.toUpperCase() === statusFilter;

      const matchesPlan = matchPlanFilter(sub.plan, planFilter);

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, searchQuery, statusFilter, planFilter]);

  // Filter Logic: Payments Ledger Tab
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const estateName = item.estate_name || "";
      const estateCode = item.estate_code || "";
      const matchesSearch =
        estateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.payment_reference
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        item.payment_status.toUpperCase() === statusFilter;

      const matchesPlan = matchPlanFilter(item.plan, planFilter);

      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(item.created_at) >= new Date(dateFrom);
      }
      if (matchesDate && dateTo) {
        const endOfDayTo = new Date(dateTo);
        endOfDayTo.setHours(23, 59, 59, 999);
        matchesDate = new Date(item.created_at) <= endOfDayTo;
      }

      return matchesSearch && matchesStatus && matchesPlan && matchesDate;
    });
  }, [ledger, searchQuery, statusFilter, planFilter, dateFrom, dateTo]);

  // Dynamic Total Sum Calculation for Active Filtered Ledger
  const totalFilteredAmount = useMemo(() => {
    return filteredLedger.reduce((sum, item) => {
      return sum + (Number(item.amount) || 0);
    }, 0);
  }, [filteredLedger]);

  const canExtendSubscription =
    user?.permissions.includes("manage_subscription") ||
    user?.permissions.includes("billing_management") ||
    user?.permissions.includes("all-access");

  // Handle Manual Renewal
  const handleExtendSubscription = async () => {
    if (!selectedEstate) return;

    if (!canExtendSubscription) {
      showAccessDeniedToast();
      return;
    }
    try {
      setIsSubmitting(true);
      await billingApi.extendSubscription(selectedEstate.id, extensionDuration);
      setSelectedEstate(null);
      await loadData(); // Refresh list after renewal
    } catch (err: any) {
      toast.error(`Extension Failed: ${err?.message || "An error occurred."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const isSubscriptionsTab = activeTab === "subscriptions";
    const dataToExport = isSubscriptionsTab
      ? filteredSubscriptions
      : filteredLedger;

    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    // Helper function to safely format fields for CSV format
    const formatCSVField = (val: any) => {
      if (val === null || val === undefined) return '""';
      const stringVal = String(val).replace(/"/g, '""'); // Escape inner double-quotes
      return `"${stringVal}"`;
    };

    let headers: string[] = [];
    let rows: string[][] = [];

    if (isSubscriptionsTab) {
      headers = [
        "Estate Name",
        "Estate Code",
        "Current Plan",
        "Expiry Date",
        "Status",
      ];
      rows = (dataToExport as EstateSubscription[]).map((sub) => {
        // Format Plan Column
        const plan =
          typeof sub.plan === "string"
            ? (() => {
                try {
                  return JSON.parse(sub.plan);
                } catch {
                  return sub.plan;
                }
              })()
            : sub.plan;

        const planName = plan?.is_trial
          ? "Trial"
          : plan?.selected_add_ons
              ?.map((f: string) => f.replace(/_/g, " "))
              .join(", ") || "Base Plan";

        // Format Expiry Date Column
        const expiryDate = sub.subscription_expiry
          ? new Date(sub.subscription_expiry).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A";

        return [
          sub.name,
          sub.estate_code,
          planName,
          expiryDate,
          sub.subscription_status.toUpperCase(),
        ];
      });
    } else {
      headers = [
        "Date",
        "Estate Name",
        "Estate Code",
        "Reference",
        "Plan / Coverage",
        "Duration (Months)",
        "Amount",
        "Currency",
        "Status",
        "Processed By",
      ];
      rows = (dataToExport as PaymentLedgerItem[]).map((item) => {
        const formattedDate = new Date(item.created_at).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          },
        );

        const plan =
          typeof item.plan === "string"
            ? (() => {
                try {
                  return JSON.parse(item.plan);
                } catch {
                  return item.plan;
                }
              })()
            : item.plan;

        const planName = plan?.is_trial
          ? "Trial"
          : plan?.selected_add_ons
              ?.map((f: string) => f.replace(/_/g, " "))
              .join(", ") || "Base Plan";

        return [
          formattedDate,
          item.estate_name || "N/A",
          item.estate_code || item.estate_id || "",
          item.payment_reference || "N/A",
          planName,
          String(item.duration_months || ""),
          String(item.amount || 0),
          item.currency || "NGN",
          item.payment_status.toUpperCase(),
          item.processed_by_email || "",
        ];
      });
    }

    // Build CSV content string
    const csvContent = [
      headers.map(formatCSVField).join(","),
      ...rows.map((row) => row.map(formatCSVField).join(",")),
    ].join("\n");

    // Create Blob & Link to trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl flex flex-col">
      {/* Tab Navigation Header - Fixed at top */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 pt-3 flex justify-between items-end shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === "subscriptions"
                ? "bg-slate-900 border-slate-800 text-indigo-400 border-b-transparent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Estate Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === "ledger"
                ? "bg-slate-900 border-slate-800 text-indigo-400 border-b-transparent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Payments Ledger ({ledger.length})
          </button>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={
            activeTab === "subscriptions"
              ? filteredSubscriptions.length === 0
              : filteredLedger.length === 0
          }
          className="flex items-center gap-2 border-transparent text-slate-400 hover:text-slate-200 text-xs font-semibold px-3 pb-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Dynamic Filter Controls Bar - Fixed */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center bg-slate-900/50 shrink-0">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "subscriptions"
                ? "Search estate name or code..."
                : "Search estate, code, reference..."
            }
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg w-full md:w-64 focus:outline-none focus:border-indigo-500"
          />

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            {activeTab === "subscriptions" ? (
              <>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
              </>
            ) : (
              <>
                <option value="SUCCESSFUL">Successful</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </>
            )}
          </select>
        </div>

        {/* Date Filters (Only visible for Ledger tab) */}
        {activeTab === "ledger" && (
          <div className="flex gap-2 items-center text-xs text-slate-400">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-[10px] text-indigo-400 hover:underline ml-1"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ledger Revenue Summary Banner - Fixed */}
      {!loading && !error && activeTab === "ledger" && (
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Period Transaction Revenue Summary:</span>
            <span className="text-slate-500">
              ({filteredLedger.length} transaction
              {filteredLedger.length === 1 ? "" : "s"})
            </span>
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono tracking-tight">
            ₦
            {totalFilteredAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      )}

      {/* Main Content Area - Only table body scrolls */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex-1">
          Loading billing records...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/20 flex-1">
          {error}
        </div>
      ) : activeTab === "subscriptions" ? (
        /* ─── TAB 1: ESTATE SUBSCRIPTIONS ─── */
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-3">Estate Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Current Plan</th>
                <th className="p-3">Subscription Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No matching estate subscriptions found.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-100">
                      {sub.name}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {sub.estate_code}
                    </td>
                    <td className="p-3">
                      {(() => {
                        const plan =
                          typeof sub.plan === "string"
                            ? JSON.parse(sub.plan || "{}")
                            : sub.plan;

                        if (plan?.is_trial)
                          return (
                            <span className="font-medium text-amber-500">
                              Trial
                            </span>
                          );

                        return (
                          <div className="capitalize font-medium text-slate-400">
                            {plan?.selected_add_ons
                              ?.map((f: string) => f.replace(/_/g, " "))
                              .join(", ") || "Base Plan"}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      {sub.subscription_expiry
                        ? new Date(sub.subscription_expiry).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "N/A"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          sub.subscription_status.toUpperCase() === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {sub.subscription_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (!canExtendSubscription) {
                            showAccessDeniedToast();
                            return;
                          }
                          setSelectedEstate(sub);
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Renew / Extend
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── TAB 2: PAYMENTS LEDGER ─── */
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Estate Context</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Plan / Coverage</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No matching ledger transaction records found.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-100">
                        {item.estate_name || "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.estate_code || item.estate_id}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {item.payment_reference || "N/A"}
                    </td>
                    <td className="p-3">
                      {(() => {
                        const plan =
                          typeof item.plan === "string"
                            ? JSON.parse(item.plan || "{}")
                            : item.plan;

                        return (
                          <div>
                            <div className="capitalize font-medium text-slate-400">
                              {plan?.is_trial ? (
                                <span className="text-amber-600">Trial</span>
                              ) : (
                                plan?.selected_add_ons
                                  ?.map((addon: string) =>
                                    addon.replace(/_/g, " "),
                                  )
                                  .join(", ") || "Base Plan"
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {item.duration_months} month(s)
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3 font-semibold text-slate-100">
                      {item.currency}{" "}
                      {Number(item.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.payment_status.toUpperCase() === "SUCCESSFUL"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : item.payment_status.toUpperCase() === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {item.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {item.processed_by_email}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Extension Modal */}
      {selectedEstate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              Extend Subscription: {selectedEstate.name}
            </h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Add Duration (Months)
              </label>
              <select
                id="duration"
                value={extensionDuration}
                onChange={(e) => setExtensionDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year (12 Months)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setSelectedEstate(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleExtendSubscription}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm Extension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
