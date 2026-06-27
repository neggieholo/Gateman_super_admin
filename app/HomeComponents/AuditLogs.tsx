import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Calendar,
  Layers,
  ShieldAlert,
  UserCheck,
  X,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from "lucide-react";
import { AuditLogEntry, EstatesListRow } from "../services/types";
import { mockAuditLogs } from "../services/mock_data";
import { useUser } from "../UserContext";
import {
  fetchAllLogs,
  fetchSectionLogs,
  fetchSpecifiedLogs,
  fetchUniversalLogs,
} from "../services/apis_estates";

interface SuperadminAuditLogsPageProps {
  estate_id?: string;
  id?: string;
  name?: string;
  type?:string;
  target_id?:string;
  role?: string;
  all?: boolean;
  onBack: () => void;
}

type UrgencyFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export default function AuditLogsPage({
  onBack,
  id,
  estate_id,
  name,
  type,
  target_id,
  all,
  role,
}: SuperadminAuditLogsPageProps) {
  const { estatesList } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const loadWorkspaceLogs = async () => {
      const canFetchSpecified = !!id;
      const canFetchAll = !!(all && estate_id && role);
      const canFetchSection = !!(all && estate_id && type);
      const canFetchUniversal = !!(all && !estate_id);

      if (
        !canFetchSpecified &&
        !canFetchAll &&
        !canFetchSection &&
        !canFetchUniversal
      )
        return;

      console.log(
        "Log context execution triggered for:",
        id || estate_id || "UNIVERSAL SCOPE",
      );
      setLoading(true);

      try {
        let payload = null;

        if (canFetchSpecified) {
          payload = await fetchSpecifiedLogs(id);
        } else if (canFetchAll) {
          payload = await fetchAllLogs(estate_id, role);
        }  else if (canFetchSection) {
          payload = await fetchSectionLogs(estate_id);
        } else if (canFetchUniversal) {
          payload = await fetchUniversalLogs();
        }

        if (payload && payload.success) {
          let extractedLogs = payload.data;

          // Process sub-view gate pass isolation rules smoothly
          if (type) {
            extractedLogs = extractedLogs.filter(
              (log) => log.target_resource === type,
            );
          }
          
          if (target_id) {
            extractedLogs = extractedLogs.filter(
              (log) => log.target_id === target_id,
            );
          }

          setLogs(extractedLogs);
        }
      } catch (err) {
        console.error("Database sync extraction failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceLogs();
  }, [id, all, estate_id, role, type, target_id]);

  // 🔄 Memoized Filters handling text patterns, execution urgency, and explicit date bounds
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = searchQuery.toLowerCase();

      // 1. Structural String Target Matching
      const matchesText =
        log.description.toLowerCase().includes(searchLower) ||
        log.action_type.toLowerCase().includes(searchLower) ||
        log.target_resource.toLowerCase().includes(searchLower) ||
        log.user_name.toLowerCase().includes(searchLower);

      // 2. Severity Priority Flag Checks
      let matchesUrgency = true;
      if (urgencyFilter !== "ALL") {
        matchesUrgency = log.urgency === urgencyFilter;
      }

      // 3. Explicit Calendar Boundary Constraints
      let matchesDates = true;
      if (startDate || endDate) {
        const logTime = new Date(log.created_at).getTime();

        if (startDate) {
          const startBound = new Date(`${startDate}T00:00:00`).getTime();
          if (logTime < startBound) matchesDates = false;
        }
        if (endDate) {
          const endBound = new Date(`${endDate}T23:59:59`).getTime();
          if (logTime > endBound) matchesDates = false;
        }
      }

      return matchesText && matchesUrgency && matchesDates;
    });
  }, [logs, searchQuery, urgencyFilter, startDate, endDate]);

  const renderUrgencyBadge = (urgency: "HIGH" | "MEDIUM" | "LOW" | "INFO") => {
    if (urgency === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldAlert size={10} /> HIGH
        </span>
      );
    }
    if (urgency === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          <SlidersHorizontal size={10} /> MEDIUM
        </span>
      );
    }
    if (urgency === "INFO") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
          <Info size={10} /> INFO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-50 text-slate-500 border border-slate-200">
        <Info size={10} /> LOW
      </span>
    );
  };

  const openDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6 flex-1 min-h-0 overflow-y-auto">
      {/* Upper Context Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-[11px] font-black tracking-wide uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl transition-all mb-2 block w-fit"
          >
            ← Back
          </button>
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            System Core Audit Ledger
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
              Context Scope:
            </span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-bold">
              VIEWING {type ? `${type.toUpperCase()} ` : ''}LOGS FOR {name}
            </span>
          </div>
        </div>
      </div>

      {/* Control Filters Block */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Text Filter Input */}
          <div className="md:col-span-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Search Text parameters
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filter action types, entities, operators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
              />
            </div>
          </div>

          {/* Date Tracking Elements */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Start Date Limit
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-mono text-slate-700 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              End Date Limit
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-mono text-slate-700 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Urgency Selection Matrix */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(["ALL", "HIGH", "MEDIUM", "LOW", "INFO"] as UrgencyFilter[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setUrgencyFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all ${
                  urgencyFilter === tab
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab === "ALL" ? "All Severities" : `${tab} Priority`}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Core Table Grid Frame */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-125 overflow-y-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <th className="p-4 w-[18%]">Timestamp</th>
                <th className="p-4 w-[20%]">Estate</th>
                <th className="p-4 w-[14%]">Urgency</th>
                <th className="p-4 w-[20%]">Operator Signature</th>
                <th className="p-4 w-[18%]">Pipeline Activity Code</th>
                <th className="p-4 w-[10%] text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No mutation records or operational logs trace lines match
                    active criteria rules.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap font-mono text-slate-600 font-semibold text-[10px]">
                      {new Date(log.created_at).toLocaleString("en-GB")}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 truncate text-[11px]">
                      {log.estate_id
                        ? estatesList.find((e) => e.id === log.estate_id)
                            ?.name || "UNKNOWN ESTATE"
                        : "GLOBAL SYSTEM ENGINE"}
                    </td>
                    <td className="p-4">{renderUrgencyBadge(log.urgency)}</td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 truncate">
                          {log.user_name}
                        </p>
                        <p className="font-mono text-[9px] text-slate-400 uppercase tracking-tight">
                          {log.user_role}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openDetails(log)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm inline-flex items-center gap-1"
                      >
                        Inspect <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SCROLLABLE EXPANDED ACTION SLIDE OVER DRAWER ─── */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowDetailModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-200">
            {/* Header Block */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-white shrink-0">
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Log Entry Metadata Info
                </h2>
                <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                  {selectedLog.action_type}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Log Body JSON Viewer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-slate-50/30">
              {/* Context Summary Narrative */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Action Narrative Context
                </span>
                <p className="text-xs text-slate-700 bg-white p-4 rounded-xl border border-slate-100 shadow-sm font-semibold leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>

              {/* Execution Signatures Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wide flex items-center gap-1">
                    <UserCheck size={12} className="text-slate-400" /> Executed
                    By
                  </p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedLog.user_name}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wide flex items-center gap-1">
                    <Layers size={12} className="text-slate-400" /> Target Table
                  </p>
                  <p className="text-xs font-mono font-bold text-indigo-700 truncate">
                    {selectedLog.target_resource}
                  </p>
                </div>
              </div>

              {/* Network Connectivity Context Logs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide block">
                    IP Address
                  </span>
                  <p className="text-xs font-mono text-slate-700">
                    {selectedLog.ip_address}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide block">
                    User Agent
                  </span>
                  <p
                    className="text-xs text-slate-700 truncate"
                    title={selectedLog.user_agent}
                  >
                    {selectedLog.user_agent}
                  </p>
                </div>
              </div>

              {/* State Before JSON Inspection Block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Pre-Mutation State Matrix (Before)
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <pre className="text-[11px] bg-slate-900 text-emerald-400 p-4 overflow-x-auto max-h-56 font-mono leading-normal shadow-inner">
                    {selectedLog.state_before
                      ? typeof selectedLog.state_before === "string"
                        ? JSON.stringify(
                            JSON.parse(selectedLog.state_before),
                            null,
                            2,
                          )
                        : JSON.stringify(selectedLog.state_before, null, 2)
                      : "// No baseline history snapshot recorded."}
                  </pre>
                </div>
              </div>

              {/* State After JSON Inspection Block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Post-Mutation Terminating Results (After)
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <pre className="text-[11px] bg-slate-900 text-sky-400 p-4 overflow-x-auto max-h-56 font-mono leading-normal shadow-inner">
                    {selectedLog.state_after
                      ? typeof selectedLog.state_after === "string"
                        ? JSON.stringify(
                            JSON.parse(selectedLog.state_after),
                            null,
                            2,
                          )
                        : JSON.stringify(selectedLog.state_after, null, 2)
                      : "// No outcome snapshot tracking generated on terminal commit."}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer Close Actions Desk */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center shadow-sm"
              >
                Dismiss Ledger Context
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
