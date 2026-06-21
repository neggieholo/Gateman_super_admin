/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Search,
  Info,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  X,
  UserCheck,
  Shield,
} from "lucide-react";
import { getRelativeTime } from "../services/apis";
import { EstateReport, SecurityUser } from "../services/types";
import { securityDb } from "../services/apis_estates";

interface CommunityReportsOverviewPageProps {
  reports: EstateReport[];
  estatename: string;
  estateId: string;
  onBack?: () => void;
}

export default function ReportsOverviewPage({
  reports = [],
  estatename,
  estateId,
  onBack,
}: CommunityReportsOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [associatedGuards, setAssociatedGuards] = useState<SecurityUser[]>([]);
  const [showGuardsModal, setShowGuardsModal] = useState(false);

  // Operational Metrics Aggregation Engine
  const reportMetrics = {
    total: reports.length,
    payment: 0,
    security: 0,
    general: 0,
    services: 0,
    pending: 0,
    resolved: 0,
    reviewed: 0,
  };

  reports.forEach((report: any) => {
    const type = (report.type || "").toUpperCase();
    if (type === "PAYMENT") reportMetrics.payment++;
    else if (type === "SECURITY") reportMetrics.security++;
    else if (type === "GENERAL") reportMetrics.general++;
    else if (type === "SERVICES") reportMetrics.services++;

    const status = (report.status || "").toUpperCase();
    if (status === "PENDING") reportMetrics.pending++;
    else if (status === "RESOLVED") reportMetrics.resolved++;
    else if (status === "REVIEWED") reportMetrics.reviewed++;
    if (status === "REVIEWED") reportMetrics.reviewed++;
  });

  // Pipeline Filter Matrix
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatches =
      selectedStatusFilter === "ALL" ||
      (report.status || "").toUpperCase() === selectedStatusFilter;

    const typeMatches =
      selectedTypeFilter === "ALL" ||
      (report.type || "").toUpperCase() === selectedTypeFilter;

    return matchesSearch && statusMatches && typeMatches;
  });

  const fetchGuardDetails = async (ids: string[]) => {
    const res = await securityDb.getAllSecurity(estateId);
    if (res) {
      const filtered = res.filter((g: SecurityUser) => ids.includes(g.id));
      setAssociatedGuards(filtered);
      setShowGuardsModal(true);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6">
      {/* Header View Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex  flex-col items-start">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all"
            >
              ← Back to Control Desk
            </button>
          )}
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase font-montserrat">
              Incident & Reports Registry
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                System Scope:
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                {estatename}
              </span>
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={() => {
              console.log("Viewing logs");
            }}
            // disabled={isMutating}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-gray-200`}
          >
            View Logs History
          </button>
        </div>
      </div>

      {/* Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Pending
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {reportMetrics.pending}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
            <Info size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Reviewed
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {reportMetrics.reviewed}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Resolved
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {reportMetrics.resolved}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Total System Inbound
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {reportMetrics.total}
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Control Filters Matrix */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center gap-4 justify-between">
        <div className="relative w-full xl:max-w-xs">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search report fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
          />
        </div>

        {/* Filters Selectors Row */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          {/* Categorization Stream Scopes */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 text-xs font-bold text-slate-500">
            {["ALL", "RESIDENTIAL", "PAYMENT", "SECURITY", "SERVICES"].map(
              (typeKey) => {
                const countKey =
                  typeKey === "RESIDENTIAL" ? "general" : typeKey.toLowerCase();
                const displayCount =
                  typeKey === "ALL"
                    ? reports.length
                    : ((reportMetrics as any)[countKey] ?? 0);
                const matchingFilterValue =
                  typeKey === "RESIDENTIAL" ? "GENERAL" : typeKey;

                return (
                  <button
                    key={typeKey}
                    onClick={() => setSelectedTypeFilter(matchingFilterValue)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      selectedTypeFilter === matchingFilterValue
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "hover:text-slate-800"
                    }`}
                  >
                    {typeKey} ({displayCount})
                  </button>
                );
              },
            )}
          </div>

          {/* Operational Workflow Status Filters */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 text-xs font-bold text-slate-500">
            {["ALL", "PENDING", "REVIEWED", "RESOLVED"].map((statusKey) => {
              const displayCount =
                statusKey === "ALL"
                  ? reports.length
                  : ((reportMetrics as any)[statusKey.toLowerCase()] ?? 0);

              return (
                <button
                  key={statusKey}
                  onClick={() => setSelectedStatusFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedStatusFilter === statusKey
                      ? "bg-white text-slate-800 shadow-xs"
                      : "hover:text-slate-800"
                  }`}
                >
                  {statusKey} ({displayCount})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container Data Frame with Isolated Scroll Engine */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <th className="p-4 w-[30%]">Report Details</th>
                <th className="p-4 w-[15%]">Classification</th>
                <th className="p-4 w-[15%]">Workflow Status</th>
                <th className="p-4 w-[15%]">Timestamp Entry</th>
                <th className="p-4 w-[25%]">Admin Insights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No active manifest data entries found matching defined
                    structural filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const currentStatus = (
                    report.status || "PENDING"
                  ).toUpperCase();
                  const currentType = (report.type || "GENERAL").toUpperCase();

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      {/* Document Meta Subject Block */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900 block truncate">
                          {report.subject}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed mb-2">
                          {report.description}
                        </p>
                        {report.type === "SECURITY" &&
                          report.target_security_ids &&
                          report.target_security_ids.length > 0 && (
                            <button
                              onClick={() =>
                                fetchGuardDetails(report.target_security_ids!)
                              }
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 w-fit"
                            >
                              <Shield size={12} />
                              View Guard({report.target_security_ids.length})
                            </button>
                          )}
                      </td>

                      {/* Classification Matrix Display */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`text-[10px] font-black tracking-wide px-2 py-0.5 rounded-md uppercase border ${
                              currentType === "SECURITY"
                                ? "bg-rose-50 border-rose-200/60 text-rose-700"
                                : currentType === "PAYMENT"
                                  ? "bg-emerald-50 border-emerald-200/60 text-emerald-700"
                                  : currentType === "SERVICES"
                                    ? "bg-purple-50 border-purple-200/60 text-purple-700"
                                    : "bg-slate-100 border-slate-200/60 text-slate-600"
                            }`}
                          >
                            {currentType === "GENERAL"
                              ? "RESIDENTIAL"
                              : currentType}
                          </span>
                          <p className="text-[10px] text-slate-500 lowercase italic font-medium">
                            {report.category}
                          </p>
                        </div>
                      </td>

                      {/* Workflow Execution Status Indicator */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            currentStatus === "RESOLVED"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : currentStatus === "REVIEWED"
                                ? "bg-sky-50 border-sky-200 text-sky-700"
                                : "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                          }`}
                        >
                          {currentStatus === "PENDING" && (
                            <AlertTriangle size={10} />
                          )}
                          {currentStatus}
                        </span>
                      </td>

                      {/* Date Struct Allocation */}
                      <td className="p-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {new Date(report.created_at).toLocaleDateString(
                          "en-GB",
                        )}
                        <span className="block text-[10px] text-slate-500">
                          {getRelativeTime(report.created_at)}
                        </span>
                      </td>

                      {/* Administrative Summary Response Context */}
                      <td className="p-4">
                        {report.admin_response ? (
                          <div className="space-y-1">
                            <p className="text-[11px] text-slate-700 italic break-words line-clamp-2">
                              &quot;{report.admin_response}&quot;
                            </p>
                            {report.responded_at && (
                              <span className="block text-[9px] text-slate-400 font-mono">
                                Confirmed:{" "}
                                {new Date(
                                  report.responded_at,
                                ).toLocaleDateString("en-GB")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Awaiting review block...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Security Guards Assignment Modal Drawer */}
      {showGuardsModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowGuardsModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1">
              {/* Drawer Header View Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Reported Guards Manifest
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Profile contexts for guards attached to this verification
                    block.
                  </p>
                </div>
                <button
                  onClick={() => setShowGuardsModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Security Profile List Mapping */}
              <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
                {associatedGuards.length === 0 ? (
                  <p className="text-xs italic text-slate-400 text-center py-8">
                    No matching guard profiles identified on system files.
                  </p>
                ) : (
                  associatedGuards.map((guard) => (
                    <div
                      key={guard.id}
                      className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-200 rounded-xl border border-slate-300 shrink-0 overflow-hidden flex items-center justify-center">
                          {guard.avatar ? (
                            <img
                              src={guard.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-black text-slate-400 uppercase">
                              {guard.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {guard.name}
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-500 truncate">
                            {guard.phone || "No phone linked"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {guard.email}
                          </p>
                        </div>
                      </div>

                      {/* Framework Guard Allocation Hardware Status Fields */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-left">
                        <div className="bg-white/60 p-2 rounded-xl border border-slate-100 space-y-0.5">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            Duty Status
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
                              guard.is_on_duty
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {guard.is_on_duty ? "ON DUTY" : "OFF DUTY"}
                          </span>
                        </div>
                        <div className="bg-white/60 p-2 rounded-xl border border-slate-100 space-y-0.5">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            System Role Tag
                          </p>
                          <p className="text-[11px] font-mono font-bold text-slate-700">
                            {guard.role || "SECURITY"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Bottom Layout */}
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                onClick={() => setShowGuardsModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
