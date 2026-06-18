"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Search,
  ShieldAlert,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserLogEntry } from "../services/types";
import { fetchUserLogsApi } from "../services/apis";
import { useUser } from "../UserContext";

interface UserLogsPageProps {
  isolatedAdminId?: string | null;
  isolatedAdminName?: string | null;
  type: string;
}

export default function UserLogsPage({
  isolatedAdminId = null,
  isolatedAdminName = null,
  type = 'user'
}: UserLogsPageProps) {
  const { user } = useUser();
  const [logs, setLogs] = useState<UserLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 🎛️ Local Filter States (Strictly Name and Date)
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // 📡 1. Live Data Synchronization Loop
  useEffect(() => {
    const loadLogsData = async () => {
      setLoading(true);
      try {
        const response = await fetchUserLogsApi(type);
        if (response.success) {
          setLogs(response.logs || []);
        } else {
          toast.error(response.message || "Failed to sync system user logs.");
        }
      } catch (err) {
        toast.error("Network handshake exception");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLogsData();
  }, []);

  // 🧠 2. High-Performance Memoized Local Filtering Matrix
  const filteredLogs = useMemo(() => {
    if (isolatedAdminId) {
      return logs.filter(
        (log) => String(log.user_id) === String(isolatedAdminId),
      );
    }

    return logs.filter((log) => {
      // Name / Email filter evaluation match signature
      const matchesName =
        (log.user_name || "")
          .toLowerCase()
          .includes(nameFilter.toLowerCase()) ||
        (log.user_email || "").toLowerCase().includes(nameFilter.toLowerCase());

      // Date filter evaluation (extracts YYYY-MM-DD from database timestamp safely)
      const logDateISO = log.created_at ? log.created_at.split("T")[0] : "";
      const matchesDate = dateFilter ? logDateISO === dateFilter : true;

      return matchesName && matchesDate;
    });
  }, [logs, nameFilter, dateFilter, isolatedAdminId]);

  // 📥 3. Dynamic Client-Side CSV Downloader (Always matches filtered states)
  const handleDownloadCSV = () => {
    if (filteredLogs.length === 0) return;
    const canDownloadLogs =
      user?.permissions.includes("logs_management") ||
      user?.permissions.includes("download_user_logs") ||
      user?.permissions.includes("all-access");

    if (!canDownloadLogs) {
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
      return;
    }

    const headers = [
      "Timestamp",
      "Admin Name",
      "Admin Email",
      "Action Type",
      "Target Table",
      "Description",
      "IP Address",
    ];

    const csvRows = filteredLogs.map((log) => {
      const dateObj = new Date(log.created_at);
      const timestamp = !isNaN(dateObj.getTime())
        ? `${dateObj.toLocaleDateString("en-GB")} ${dateObj.toLocaleTimeString("en-GB")}`
        : "---";

      return [
        `"${timestamp}"`,
        `"${(log.user_name || "System Loop").replace(/"/g, '""')}"`,
        `"${(log.user_email || "root").replace(/"/g, '""')}"`,
        `"${log.action_type}"`,
        `"${log.target_resource}"`,
        `"${(log.description || "").replace(/"/g, '""')}"`,
        `"${log.ip_address || "0.0.0.0"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const fileSuffix = dateFilter ? `_filtered_${dateFilter}` : "_full_ledger";
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `gateman_user_activity_logs${fileSuffix}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 font-sans bg-slate-50/30 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-sm">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="font-montserrat font-black text-slate-900 text-lg tracking-tight uppercase">
              View {isolatedAdminName ? isolatedAdminName + "'s" : "User"}{" "}
              Activity Logs
            </h1>
            <p className="text-xs text-slate-400 font-medium leading-none mt-1">
              Forensic security trail monitoring ledger system.
            </p>
          </div>
        </div>

        {/* EXPORT ACTION BUTTON */}
        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={filteredLogs.length === 0 || loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-oswald font-black uppercase tracking-wider transition-all shadow-sm ${
            filteredLogs.length === 0 || loading
              ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]"
          }`}
        >
          <Download size={14} /> Export CSV Ledger ({filteredLogs.length})
        </button>
      </div>

      {/* FILTER CONTROLS DOCK (Strictly Name and Date) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Name / Email Search */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-4 text-slate-400" />
          <input
            type="text"
            disabled={isolatedAdminId !== null}
            placeholder={
              isolatedAdminId !== null
                ? "Search disabled"
                : "Search by administrator name or email address..."
            }
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl font-sans font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Date Picker */}
        <div className="relative flex items-center">
          <Calendar
            size={14}
            className="absolute left-4 text-slate-400 pointer-events-none"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl font-sans font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* DATA TABLE GRAPH CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="p-4 text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                  Timestamp
                </th>
                <th className="p-4 text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                  Administrator
                </th>
                {/* <th className="p-4 text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                  Action Scope
                </th> */}
                <th className="p-4 text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                  User Activity Trace Log
                </th>
                <th className="p-4 text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                  IP Metadata
                </th>
                <th className="p-4 text-[10px] font-oswald font-black text-slate-400 uppercase tracking-widest">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-16 text-center text-slate-400 font-bold"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin text-indigo-600"
                      />
                      Synchronizing live tracking matrix feeds...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "---";
                  const formattedTime = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "---";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{formattedDate}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formattedTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {log.user_name || "System Action"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {log.user_email || "root@gateman"}
                          </span>
                        </div>
                      </td>
                      {/* <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-white tracking-tight uppercase">
                          {log.action_type}
                        </span>
                      </td> */}
                      <td className="p-4 text-slate-500 font-medium min-w-70 max-w-md leading-relaxed">
                        {log.description}
                      </td>
                      <td className="p-4 font-mono text-slate-400 font-semibold whitespace-nowrap">
                        {log.ip_address || "0.0.0.0"}
                      </td>
                      <td className="p-4 font-mono text-slate-400 font-semibold whitespace-nowrap">
                        {log.user_agent || "unknown"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={24} className="text-slate-300" />
                      <p className="font-semibold text-sm">
                        No activity logs match your active filter footprint
                        matrix.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
