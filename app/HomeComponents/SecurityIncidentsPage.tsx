"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  ShieldX,
  FileText,
  Clock,
  Terminal,
  MapPin,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Interface mapping your system's activity schemas and database rows
interface IncidentLog {
  id: string;
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  eventType:
    | "AUTH_FAILURE"
    | "SESSION_REVOCATION"
    | "PERIMETER_ALTERATION"
    | "BRUTE_FORCE_ATTEMPT"
    | "POLICY_CHANGE";
  actorEmail: string;
  ipAddress: string;
  location: string;
  description: string;
  metaDetails: object;
}

export default function SecurityIncidentsPage() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // State Matrix Arrays
  const [logs, setLogs] = useState<IncidentLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [selectedIncident, setSelectedIncident] = useState<IncidentLog | null>(
    null,
  );

  const fetchIncidentLogs = useCallback(async () => {
    setGlobalLoading(true);
    try {
      // Simulated populating event matrix array from standard system log streams
      const simulatedLogs: IncidentLog[] = [
        {
          id: "evt-9042-xk8",
          timestamp: "2026-06-15 15:42:11",
          severity: "CRITICAL",
          eventType: "BRUTE_FORCE_ATTEMPT",
          actorEmail: "unknown@perimeter-gateway",
          ipAddress: "197.210.44.82",
          location: "Lagos, Nigeria",
          description:
            "Rate-limit threshold reached. 14 sequential failed authentication requests targeting root passport structures.",
          metaDetails: {
            userAgent: "Mozilla/5.0 (Python-urllib)",
            attempts: 14,
          },
        },
        {
          id: "evt-7811-mz2",
          timestamp: "2026-06-15 14:12:05",
          severity: "MEDIUM",
          eventType: "SESSION_REVOCATION",
          actorEmail: "simon@admin.core",
          ipAddress: "102.89.34.118",
          location: "Lagos, Nigeria",
          description:
            "Administrative override executed: Active session handshake severed cleanly for target node configuration.",
          metaDetails: { targetedIp: "197.210.44.82", sessionAgeMinutes: 42 },
        },
        {
          id: "evt-3391-qp0",
          timestamp: "2026-06-15 11:05:59",
          severity: "HIGH",
          eventType: "POLICY_CHANGE",
          actorEmail: "simon@admin.core",
          ipAddress: "102.89.34.118",
          location: "Lagos, Nigeria",
          description:
            "System perimeter policy altered: Enforce Action/Policy Acceptance Intercept updated from FALSE to TRUE.",
          metaDetails: {
            contextToggle: "enforceActionAcceptanceBeforeLogin",
            previousState: false,
            newState: true,
          },
        },
        {
          id: "evt-1102-as7",
          timestamp: "2026-06-15 08:22:41",
          severity: "LOW",
          eventType: "PERIMETER_ALTERATION",
          actorEmail: "system-cron@perimeter-gateway",
          ipAddress: "127.0.0.1",
          location: "Localhost Loopback",
          description:
            "Automated server backup pipeline completed successfully. Encrypted database dump exported cleanly.",
          metaDetails: {
            dbEngine: "PostgreSQL",
            targetRepo: "private-backups",
          },
        },
      ];

      setLogs(simulatedLogs);
    } catch (err) {
      toast.error("Failed to re-hydrate incident vector event stream arrays.");
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidentLogs();
  }, [fetchIncidentLogs]);

  // Filtering System Pipelines
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.ipAddress.includes(searchQuery) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadgeClass = (severity: IncidentLog["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-950/20 text-rose-500 border border-rose-800/40 font-black";
      case "HIGH":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold";
      case "MEDIUM":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "bg-slate-50 text-slate-400 border border-slate-100";
    }
  };

  if (globalLoading) {
    return (
      <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        Parsing Incident Threat Logs...
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 animate-in fade-in duration-200 ${actionLoading ? "pointer-events-none opacity-60" : ""}`}
    >
      {/* 📊 SUMMARY ROW BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldX size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Unresolved Threat Vectors
            </p>
            <h3 className="text-xl font-bold font-oswald text-slate-800">
              {logs.filter((l) => l.severity === "CRITICAL").length} Critical
              Event
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm md:col-span-3">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <Terminal size={20} />
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Security Logs Operational Ledger
              </p>
              <h3 className="text-sm font-semibold text-slate-700 mt-0.5">
                Real-time system transaction tracking, audit logging, and brute
                force intercept tracing.
              </h3>
            </div>
            <button
              onClick={fetchIncidentLogs}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 rounded-xl border border-slate-200 transition-all self-end sm:self-auto"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── FILTERS AND CONTROLS MECHANICS ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Filter IP, Actor, or Keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter size={13} className="text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 bg-white font-medium text-slate-600"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟡 High Priority</option>
            <option value="MEDIUM">🔵 Medium Activity</option>
            <option value="LOW">⚪ System Trace</option>
          </select>
        </div>
      </div>

      {/* ─── DATA GRID LEDGER MATRIX ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              No anomalies found matching current schema filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="p-4">Timestamp / Code</th>
                  <th className="p-4">Severity Vector</th>
                  <th className="p-4">Operational Event Context</th>
                  <th className="p-4">Source Trace Parameters</th>
                  <th className="p-4 text-right">Inspect Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-0.5">
                        <Clock size={12} className="text-slate-400" />
                        {log.timestamp}
                      </div>
                      <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50">
                        {log.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${getSeverityBadgeClass(log.severity)}`}
                      >
                        • {log.severity}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-0.5">
                        {log.eventType.replace(/_/g, " ")}
                      </div>
                      <p className="text-slate-500 line-clamp-2 text-xs leading-relaxed">
                        {log.description}
                      </p>
                    </td>
                    <td className="p-4 font-mono text-[11px] space-y-1">
                      <div className="text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded w-fit font-bold">
                        {log.ipAddress}
                      </div>
                      <div className="text-slate-400 flex items-center gap-1">
                        <MapPin size={11} />
                        <span className="truncate max-w-[150px]">
                          {log.location}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[180px]">
                        {log.actorEmail}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedIncident(log)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── INCIDENT SPECIFICS MODAL INSPECTOR ─── */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-oswald font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <FileText size={16} className="text-amber-400" /> Event
                Diagnostics: {selectedIncident.id}
              </h3>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Detailed Incident Explanation
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Actor Origin Email
                  </span>
                  <div className="font-semibold text-slate-700 truncate">
                    {selectedIncident.actorEmail}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Timestamp Token
                  </span>
                  <div className="font-mono text-slate-700">
                    {selectedIncident.timestamp}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Network Node IP
                  </span>
                  <div className="font-mono font-bold text-slate-700">
                    {selectedIncident.ipAddress}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Geographic Anchoring
                  </span>
                  <div className="text-slate-700 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />{" "}
                    {selectedIncident.location}
                  </div>
                </div>
              </div>

              {/* JSON Metadata Payload */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Raw Cryptographic Meta Array
                </span>
                <pre className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-xl overflow-x-auto shadow-inner border border-slate-800">
                  {JSON.stringify(selectedIncident.metaDetails, null, 2)}
                </pre>
              </div>
            </div>

            {/* Actions Bar Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-end gap-2">
              <button
                onClick={() =>
                  toast.success(
                    "Event array telemetry compiled for system extract.",
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-white text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                <Download size={12} /> Export Node Telemetry
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
