"use client";

import React, { useCallback, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ALPHABET, DashboardEstateNode, SortOrder } from "../services/types";
import { getEstatesDashboard } from "../services/apis_estates";
import EstateDashboardPage from "./EstateDashboardPage";
import { showAccessDeniedToast } from "./ManageUsersPage";
import { useUser } from "../UserContext";
import { Download, MessageSquare } from "lucide-react";
import { NotifyEstateModal } from "./NotifyEstateModal";
import { useRouter } from "next/navigation";

type SortField = "name" | "res_count" | "guard_count" | "joined_date";

export default function EstatesManagement() {
  const { user } = useUser();
  const router = useRouter();
  const [estates, setEstates] = useState<DashboardEstateNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstate, setSelectedEstate] =
    useState<DashboardEstateNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalEstates, setTotalEstates] = useState<number>(0);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [alphaFilter, setAlphaFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortField(null);
      setSortOrder(null);
    }
  };

  // Sort Indicator Helper
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field || !sortOrder)
      return <span className="text-slate-400 ml-1">↕</span>;
    return sortOrder === "asc" ? (
      <span className="ml-1 text-indigo-600">↑</span>
    ) : (
      <span className="ml-1 text-indigo-600">↓</span>
    );
  };

  const fetchEstates = useCallback(async () => {
    const canViewDEstates =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("view_estate_info") ||
      user?.permissions.includes("all-access");

    if (!canViewDEstates) {
      showAccessDeniedToast();
      return;
    }
    setLoading(true);
    try {
      const res = await getEstatesDashboard();
      if (res.success) {
        setEstates(res.estates);
        setTotalEstates(res.count);
      } else {
        toast.error("Failed to load estates directory metadata.");
      }
    } catch (err) {
      console.error("Estates hydration failure:", err);
      toast.error(
        "Network communication failure fetching dynamic organizational nodes.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEstates();
  }, [fetchEstates]);

  const selectEstate = (estate: DashboardEstateNode) => {
    const canViewLogs =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("view_estate_info") ||
      user?.permissions.includes("all-access");

    if (!canViewLogs) {
      showAccessDeniedToast();
      return;
    }
    setSelectedEstate(estate);
  };

  // Multi-tier filtering (Search, Alphabet, Status)
  const filteredEstates = estates.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.estate_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.lga?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAlpha =
      alphaFilter === "ALL" ||
      e.name.trim().toUpperCase().startsWith(alphaFilter);

    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;

    return matchesSearch && matchesAlpha && matchesStatus;
  });

  // Sorting Handler (Supports res_count, guard_count, and joined_date)
  const sortedEstates = [...filteredEstates].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let valA: number | string = 0;
    let valB: number | string = 0;

    if (sortField === "res_count") {
      valA = Number(a.total_residents) || 0;
      valB = Number(b.total_residents) || 0;
    } else if (sortField === "guard_count") {
      valA = Number(a.total_guards) || 0;
      valB = Number(b.total_guards) || 0;
    } else if (sortField === "joined_date") {
      valA = a.joined_date ? new Date(a.joined_date).getTime() : 0;
      valB = b.joined_date ? new Date(b.joined_date).getTime() : 0;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const currentPermissions = user?.permissions || [];
  const hasAccessToCurrentPanel =
    currentPermissions.includes("all-access") ||
    currentPermissions.includes("view_estate_info") ||
    currentPermissions.includes("estates_management");

  const exportToCSV = () => {
    if (sortedEstates.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    const activeEstates = estates.filter((e) => e.status === "ACTIVE").length;
    const activeResidents30d = estates.reduce(
      (acc, curr) => acc + (Number(curr.active_residents_30_days) || 0),
      0,
    );
    const totalResidents = estates.reduce(
      (acc, curr) => acc + (Number(curr.total_residents) || 0),
      0,
    );
    const guardsOnDuty = estates.reduce(
      (acc, curr) => acc + (Number(curr.guards_on_duty) || 0),
      0,
    );
    const totalGuards = estates.reduce(
      (acc, curr) => acc + (Number(curr.total_guards) || 0),
      0,
    );

    const summaryRows = [
      ["--- GLOBAL METRICS SUMMARY ---"],
      ["Total Registered Estates", totalEstates],
      ["Active Estates", activeEstates],
      ["Active Residents (Last 30 Days)", activeResidents30d],
      ["Total Enrolled Residents", totalResidents],
      ["Guards On Duty", guardsOnDuty],
      ["Total Registered Guards", totalGuards],
      [],
      ["--- ESTATES DIRECTORY LIST ---"],
    ];

    const headers = [
      "Estate ID",
      "Estate Name",
      "Code",
      "LGA",
      "State",
      "Onboarding Date",
      "Active Residents (30d)",
      "Total Residents",
      "Guards On Duty",
      "Total Guards",
      "Status",
    ];

    const tableRows = sortedEstates.map((e) => [
      `"${e.id || ""}"`,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      `"${e.estate_code || ""}"`,
      `"${e.lga || ""}"`,
      `"${e.state || ""}"`,
      `"${e.joined_date ? new Date(e.joined_date).toLocaleDateString() : "N/A"}"`,
      e.active_residents_30_days || 0,
      e.total_residents || 0,
      e.guards_on_duty || 0,
      e.total_guards || 0,
      `"${e.status || ""}"`,
    ]);

    const fullCsvArray = [
      ...summaryRows.map((r) => r.join(",")),
      headers.join(","),
      ...tableRows.map((r) => r.join(",")),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + fullCsvArray.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Estates_Management_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasAccessToCurrentPanel) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
        🔒 View locked down due to restricted access.
      </div>
    );
  }

  return (
    <div className="p-2 bg-slate-50 h-[calc(100vh-110px)] text-slate-800 font-sans flex flex-col overflow-hidden">
      {!selectedEstate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-not-allowed">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Estates
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loading ? "..." : totalEstates}{" "}
              <span className="text-xs font-normal text-emerald-600 ml-1">
                ({estates.filter((e) => e.status === "ACTIVE").length} Active)
              </span>
            </p>
          </div>
          <div
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer"
            onClick={() => router.push("/home/estate_residents?activity=30d")}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Residents (Active last 30 Days)
            </p>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {loading
                ? "..."
                : estates.reduce(
                    (acc, curr) =>
                      acc + (Number(curr.active_residents_30_days) || 0),
                    0,
                  )}{" "}
              <span className="text-xs font-normal text-slate-400 ml-1">
                /{" "}
                {loading
                  ? "..."
                  : estates.reduce(
                      (acc, curr) => acc + (Number(curr.total_residents) || 0),
                      0,
                    )}{" "}
                total
              </span>
            </p>
          </div>
          <div
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer"
            onClick={() =>
              router.push("/home/estate_guards?duty_status=checked_in")
            }
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Security Force Status
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {loading
                ? "..."
                : estates.reduce(
                    (acc, curr) => acc + (Number(curr.guards_on_duty) || 0),
                    0,
                  )}{" "}
              <span className="text-xs font-normal text-slate-400 ml-1">
                On Duty (
                {loading
                  ? "..."
                  : estates.reduce(
                      (acc, curr) => acc + (Number(curr.total_guards) || 0),
                      0,
                    )}{" "}
                Registered)
              </span>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-xs font-medium text-slate-400 animate-pulse flex-1">
          Querying multi-tenant operational data nodes...
        </div>
      ) : !selectedEstate ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col flex-1 animate-in fade-in duration-150 min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Estates Directory Nodes
                </h2>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  Showing {sortedEstates.length} Estates
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select an organizational zone node to interact with dedicated
                resident counts and security parameters.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={exportToCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => setMessageModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Notify All
              </button>
              <input
                type="text"
                placeholder="Filter by name, LGA or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-auto flex-1 min-h-0 pr-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                  <th className="p-3">
                    Estate Name{" "}
                    <select
                      value={alphaFilter}
                      onChange={(e) => setAlphaFilter(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 focus:outline-none cursor-pointer ml-1"
                    >
                      <option value="ALL">A-Z All</option>
                      {ALPHABET.map((char) => (
                        <option key={char} value={char}>
                          {char}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="p-3">Location</th>
                  <th
                    className="p-3 cursor-pointer select-none hover:text-slate-600 transition-colors"
                    onClick={() => handleSort("joined_date")}
                  >
                    Onboarding Date {renderSortIcon("joined_date")}
                  </th>
                  <th
                    className="p-3 cursor-pointer select-none hover:text-slate-600 transition-colors"
                    onClick={() => handleSort("res_count")}
                  >
                    Resident Density {renderSortIcon("res_count")}
                  </th>
                  <th
                    className="p-3 cursor-pointer select-none hover:text-slate-600 transition-colors"
                    onClick={() => handleSort("guard_count")}
                  >
                    Guard Density {renderSortIcon("guard_count")}
                  </th>
                  <th className="p-3">
                    Node Status{" "}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 focus:outline-none cursor-pointer ml-1"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {sortedEstates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      No matching registered nodes found.
                    </td>
                  </tr>
                ) : (
                  sortedEstates.map((estate) => (
                    <tr
                      key={estate.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      onClick={() => selectEstate(estate)}
                    >
                      <td className="p-3">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {estate.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          CODE: {estate.estate_code}
                        </p>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>{estate.lga}</div>
                        <div className="text-[10px] text-slate-400">
                          {estate.state} State
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>
                          {estate.joined_date
                            ? new Date(estate.joined_date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "N/A"}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>
                          {estate.active_residents_30_days} Active{" "}
                          <span className="text-[10px] text-slate-400">
                            (30d)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total Enrolled: {estate.total_residents}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>{estate.guards_on_duty} Active Guards</div>
                        <div className="text-[10px] text-slate-400">
                          {estate.total_guards} Total Enrolled
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            estate.status === "ACTIVE"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {estate.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EstateDashboardPage
          estateId={selectedEstate.id}
          onBack={() => setSelectedEstate(null)}
        />
      )}
      <NotifyEstateModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        isGlobal={true}
      />
    </div>
  );
}
