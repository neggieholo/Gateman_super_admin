/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { EstateDetailedContext } from "../services/types";
import { getEstateDetailsContext } from "../services/apis_estates";

interface EstateDashboardPageProps {
  estateId: string;
  onBack?: () => void;
}

export default function EstateDashboardPage({
  estateId,
  onBack,
}: EstateDashboardPageProps) {
  const [selectedEstate, setSelectedEstate] =
    useState<EstateDetailedContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"metrics" | "charts">("metrics");

  useEffect(() => {
    async function fetchEstateDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await getEstateDetailsContext(estateId);

        if (res.success && res.estate) {
          setSelectedEstate(res.estate);
        } else {
          throw new Error(
            "Failed to pull complete estate control desk metadata payload.",
          );
        }
      } catch (err: any) {
        setError(
          err.message || "An unexpected system reference error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    if (estateId) {
      fetchEstateDetails();
    }
  }, [estateId]);

  // Placeholder actions (Connect these to your API handlers)
  const toggleSuspension = (id: string, currentStatus: string) => {
    console.log(
      `Toggling suspension for ${id}. Current status: ${currentStatus}`,
    );
  };

  const handleLockdown = (id: string, name: string) => {
    console.log(`🚨 EMERGENCY LOCKDOWN TRIGGERED FOR: ${name} (${id})`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold mt-4">
            Syncing Control Desk Matrix...
          </p>
        </div>
      </div>
    );
  }

  if (error || !selectedEstate) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-10 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
        <p className="text-sm font-bold text-red-600">
          Error Loading System Reference
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {error || "No data records found for this asset node."}
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-6 bg-slate-50 overflow-hidden flex flex-col justify-between flex-1 min-h-0">
      {/* 📈 INDIVIDUAL ESTATE PERSONALIZED DASHBOARD CONTAINER */}
      <div className="space-y-6 overflow-y-auto flex-1 pr-1 w-full pb-4">
        {/* Dashboard Header Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={onBack}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-1.5 inline-flex items-center gap-1"
            >
              ← Back to Global Directory
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedEstate.name} Control Desk
              </h2>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  selectedEstate.status === "ACTIVE"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {selectedEstate.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedEstate.lga}, {selectedEstate.state} State 
            </p>
          </div>

          {/* Controls & View Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* View Switching Button Group */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center mr-2">
              <button
                onClick={() => setViewMode("metrics")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "metrics"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setViewMode("charts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "charts"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📊 Charts View
              </button>
            </div>

            <button
              onClick={() =>
                toggleSuspension(selectedEstate.id, selectedEstate.status)
              }
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedEstate.status === "ACTIVE"
                  ? "bg-slate-100 text-red-600 hover:bg-slate-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {selectedEstate.status === "ACTIVE"
                ? "Suspend Entire Scope"
                : "Activate Estate Access"}
            </button>
            <button
              onClick={() =>
                handleLockdown(selectedEstate.id, selectedEstate.name)
              }
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              🚨 Emergency Lockdown
            </button>
          </div>
        </div>

        {viewMode === "charts" ? (
          /* ─── CHARTS VIEW SCREEN ─── */
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-2xl">📊</p>
              <h3 className="text-sm font-black text-slate-900">
                Analytical Visualization Engine
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Chart rendering scopes for activity trends, entry metrics, and
                incident timelines are dynamically mapped to layout structures
                here.
              </p>
            </div>
          </div>
        ) : (
          /* ─── STANDARD METRICS VIEW SCREEN ─── */
          <>
            {/* High-Level Analytics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  System Code
                </p>
                <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {selectedEstate.estate_code}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Residents (Active in the last 30 days)
                </p>
                <p className="text-xl font-black text-indigo-600 mt-1">
                  {selectedEstate.active_residents_30_days}{" "}
                  <span className="text-xs font-medium text-slate-400">
                    / {selectedEstate.total_residents} total
                  </span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Guard Contingent
                </p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  {selectedEstate.guards_on_duty}{" "}
                  <span className="text-xs font-medium text-slate-400">
                    On Post ({selectedEstate.total_guards})
                  </span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Onboarding System Date
                </p>
                <p className="text-xl font-black text-slate-700 mt-1">
                  {selectedEstate.joined_date
                    ? new Date(selectedEstate.joined_date).toLocaleDateString(
                        "en-GB",
                      )
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* ─── ROW 1: PRIMARY OPERATIONS (ADMINS & PASSES) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Administrative Scope */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Estate Administrators
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Personnel with full management access to this node.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.admins?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      No administrators provisioned.
                    </p>
                  ) : (
                    selectedEstate.admins?.map((admin: any) => (
                      <div
                        key={admin.id}
                        className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {admin.full_name || admin.email}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {admin.role || "Staff Manager"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Access Authorization Ledger */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Gate Access Passes
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Recent security tracking logs and visitor tokens.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.gatepasses?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      No visitor entry records found.
                    </p>
                  ) : (
                    selectedEstate.gatepasses?.map((pass: any) => (
                      <div
                        key={pass.id}
                        className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            {pass.visitor_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            CODE: {pass.pass_code} • For:{" "}
                            {pass.resident_address || "Main Block"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 font-bold text-[10px] rounded-md ${
                            pass.status === "USED"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {pass.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── ROW 2: ENGAGEMENT & REVIEWS (POSTS & REPORTS) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notice Board Module */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Broadcast Communications
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Public notifications distributed to the residential app feeds.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.posts?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      Notice board is clear.
                    </p>
                  ) : (
                    selectedEstate.posts?.map((post: any) => (
                      <div
                        key={post.id}
                        className="bg-slate-50 p-3 rounded-xl text-xs"
                      >
                        <p className="font-bold text-slate-900">{post.title}</p>
                        <p className="text-slate-600 mt-0.5 line-clamp-2">
                          {post.content}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">
                          {new Date(post.created_at).toLocaleDateString(
                            "en-GB",
                          )}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Security Compliance Diagnostics */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Incident Report Logs
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Panic triggers, infrastructure alerts, or emergency issues
                  filed.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.reports?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      Zero critical compliance reports logged.
                    </p>
                  ) : (
                    selectedEstate.reports?.map((report: any) => (
                      <div
                        key={report.id}
                        className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-red-700">
                            {report.category || "General Alert"}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {report.description}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold text-[9px] rounded-md uppercase">
                          Review Required
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── ROW 3: DISPATCH MATRICES ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Directories */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Approved Vendor Catalogs
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Configured operational modules (e.g., Water delivery,
                  Electricians, Waste).
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.services?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      No services provisioned for this site.
                    </p>
                  ) : (
                    selectedEstate.services?.map((service: any) => (
                      <div
                        key={service.id}
                        className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-slate-800">
                          {service.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {service.type || "Utility"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Service Request Pipeline */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Maintenance & Utility Requests
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Live maintenance orders submitted from residential profiles.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.service_requests?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      Service task pipelines are clear.
                    </p>
                  ) : (
                    selectedEstate.service_requests?.map((req: any) => (
                      <div
                        key={req.id}
                        className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">
                            Job ID: #{req.id.substring(0, 6)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Unit: {req.house_number || "Zone Area"}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-md">
                          {req.status || "PENDING"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── ROW 4: STRUCTURAL NODES & TIMELINES ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Location Parameters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Physical Infrastructure Venues
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Zone spaces configured for facility booking protocols.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.locations?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      No event locations registered.
                    </p>
                  ) : (
                    selectedEstate.locations?.map((loc: any) => (
                      <div
                        key={loc.id}
                        className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-slate-800">
                          {loc.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                          Cap: {loc.capacity || "N/A"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Regional Events Calendars */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 mb-1">
                  Scheduled Estate Events
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Town halls, sanitation mandates, or structural area updates.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEstate.events?.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 italic">
                      No public events booked.
                    </p>
                  ) : (
                    selectedEstate.events?.map((ev: any) => (
                      <div
                        key={ev.id}
                        className="bg-slate-50 p-2.5 rounded-xl text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-slate-800">{ev.title}</p>
                          <p className="text-[9px] text-indigo-600 font-mono">
                            {new Date(ev.start_time).toLocaleDateString(
                              "en-GB",
                            )}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Location Key: {ev.location_name || "Community Space"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── BOTTOM ADMINISTRATIVE ACTIONS BAR ─── */}
      <div className="mt-8 max-w-7xl mx-auto w-full pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-3">
        <button
          onClick={() =>
            console.log("Routing to Residents Directory Context...")
          }
          className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          👥 View Residents Info
        </button>
        <button
          onClick={() =>
            console.log("Routing to Security/Guard Roster Scope...")
          }
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          🛡️ View Security Info
        </button>
      </div>
    </div>
  );
}
