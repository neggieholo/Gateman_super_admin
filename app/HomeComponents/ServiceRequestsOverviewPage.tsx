/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  X,
  SlidersHorizontal,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { EstateService, ServiceRequest, Vendor } from "../services/types";

interface ServiceRequestsOverviewPageProps {
  requests: ServiceRequest[];
  services: EstateService[];
  vendors: Vendor[];
  estatename: string;
  onBack?: () => void;
}

export default function ServiceRequestsOverviewPage({
  requests = [],
  services = [],
  vendors = [],
  estatename,
  onBack,
}: ServiceRequestsOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Target view sidebar/modal tracking data state
  const [selectedRequestForModal, setSelectedRequestForModal] =
    useState<ServiceRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 📊 Live Dynamic Analytics Computations
  const analytics = useMemo(() => {
    const metrics = {
      total: requests.length,
      completed: 0,
      dispatchedActive: 0,
      pendingDispatch: 0,
    };

    requests.forEach((req) => {
      if (req.is_completed) {
        metrics.completed++;
      } else if (req.is_dispatched) {
        metrics.dispatchedActive++;
      } else {
        metrics.pendingDispatch++;
      }
    });

    return metrics;
  }, [requests]);

  // Extract unique mapped service descriptors to populate the dynamic filter selection box
  const recognizedServicesList = useMemo(() => {
    return services.map((s) => ({ id: s.id, name: s.service_name }));
  }, [services]);

  // Comprehensive Multi-Axis Filtering Engine
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Core Text Search Match (Resident Name, Unit, or Request Description Context)
      const matchesText =
        req.resident_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.resident_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // 2. Status Target Match
      let matchesStatus = true;
      if (statusFilter === "COMPLETED") matchesStatus = !!req.is_completed;
      if (statusFilter === "DISPATCHED")
        matchesStatus = !!req.is_dispatched && !req.is_completed;
      if (statusFilter === "PENDING")
        matchesStatus = !req.is_dispatched && !req.is_completed;

      // 3. Service ID Classification Reference Match
      const matchesServiceType =
        serviceTypeFilter === "ALL" || req.service_id === serviceTypeFilter;

      // 4. Chronological Date Range Intersect Match
      let matchesDateRange = true;
      if (req.requested_at) {
        const reqTime = new Date(req.requested_at).getTime();
        if (startDate) {
          const startTimestamp = new Date(`${startDate}T00:00:00`).getTime();
          if (reqTime < startTimestamp) matchesDateRange = false;
        }
        if (endDate) {
          const endTimestamp = new Date(`${endDate}T23:59:59`).getTime();
          if (reqTime > endTimestamp) matchesDateRange = false;
        }
      } else if (startDate || endDate) {
        matchesDateRange = false; // No date assigned fails direct timestamp bounds checks
      }

      return (
        matchesText && matchesStatus && matchesServiceType && matchesDateRange
      );
    });
  }, [
    requests,
    searchQuery,
    statusFilter,
    serviceTypeFilter,
    startDate,
    endDate,
  ]);

  // Helper macro to instantly cross-reference a service_id to its proper clean name label
  const getServiceNameById = (serviceId: string | null) => {
    if (!serviceId) return "Unassigned Maintenance";
    const serviceNode = services.find((s) => s.id === serviceId);
    return serviceNode ? serviceNode.service_name : "General Utility Service";
  };

  // Maps individual array keys of vendor IDs into full Object Structures for detailed layout injection
  const getAssignedVendorsData = (vendorIdsArray: string[] | null) => {
    if (!vendorIdsArray || !Array.isArray(vendorIdsArray)) return [];
    return vendors.filter((v) => vendorIdsArray.includes(v.id));
  };

  const openDetailedModal = (request: ServiceRequest) => {
    setSelectedRequestForModal(request);
    setShowDetailModal(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6 flex-1 min-h-0 overflow-y-auto">
      {/* Top Controls Header Desk */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          {onBack && (
            <button
              onClick={onBack}
              className="text-[11px] font-black tracking-wide uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl transition-all mb-2 block w-fit"
            >
              ← Control Desk
            </button>
          )}
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase font-montserrat">
            Maintenance Dispatch Pipeline
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
              Asset Nodes Scope:
            </span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-bold">
              {estatename}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Progress Dashboards Rows */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Total Requests
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {analytics.total}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Awaiting Dispatch
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {analytics.pendingDispatch}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Enroute/Active
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {analytics.dispatchedActive}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Fulfilled/Closed
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {analytics.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Granular Filter Engine Layout Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Main String Input Filter */}
          <div className="relative">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Search Identifier
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Resident, unit hash, descriptors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
              />
            </div>
          </div>

          {/* Service Classification Selector Filter */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Service Type Context
            </label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all h-8.5"
            >
              <option value="ALL">All Categories</option>
              {recognizedServicesList.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Axis Left Bound */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              From Date Target
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-mono font-bold text-slate-700 h-8.5"
            />
          </div>

          {/* Date Picker Axis Right Bound */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              To Date Target
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-mono font-bold text-slate-700 h-8.5"
            />
          </div>
        </div>

        {/* Horizontal Status Segments Selection Filter Bar */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 text-[11px] font-black text-slate-500 w-fit">
          {[
            { key: "ALL", label: "Show Master Log", count: requests.length },
            {
              key: "PENDING",
              label: "Awaiting Dispatch",
              count: analytics.pendingDispatch,
            },
            {
              key: "DISPATCHED",
              label: "Dispatched Trades",
              count: analytics.dispatchedActive,
            },
            {
              key: "COMPLETED",
              label: "Fulfilled Logs",
              count: analytics.completed,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg transition-all uppercase tracking-wide ${
                statusFilter === tab.key
                  ? "bg-white text-slate-900 shadow-xs"
                  : "hover:text-slate-800"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Main Core Registry Tabular Grid Layout Frame */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="max-h-125 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <th className="p-4 w-[25%]">Resident & Unit Placement</th>
                <th className="p-4 w-[25%]">Targeted Core Service</th>
                <th className="p-4 w-[15%]">Timestamp Target</th>
                <th className="p-4 w-[20%]">Workflow Step context</th>
                <th className="p-4 w-[15%]">System Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No residential service dispatch pipelines match selected
                    metrics parameters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const assignedVendorsCount =
                    request.dispatched_vendors?.length || 0;

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Resident Demographics Node */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 truncate">
                            {request.resident_name}
                          </p>
                          <p className="text-[11px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 w-fit">
                            Unit {request.resident_unit}
                          </p>
                        </div>
                      </td>

                      {/* Targeted Service Scope Display */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 truncate">
                            {getServiceNameById(request.service_id)}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate italic">
                            {request.description ||
                              "No customized structural instruction context provided."}
                          </p>
                        </div>
                      </td>

                      {/* Chronology Logging Timestamp */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-mono text-slate-700 font-bold">
                            {request.requested_at
                              ? new Date(
                                  request.requested_at,
                                ).toLocaleDateString()
                              : "Pending Meta"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Pref: {request.time_preferred}
                          </p>
                        </div>
                      </td>

                      {/* Micro Badge Pipeline Lifecycle Step Status Indicator */}
                      <td className="p-4 whitespace-nowrap">
                        {request.is_completed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 uppercase">
                            <CheckCircle size={10} /> Fulfilled
                          </span>
                        ) : request.is_dispatched ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border bg-sky-50 border-sky-200 text-sky-700 uppercase">
                              <Briefcase size={10} /> Dispatched Active
                            </span>
                            <p className="text-[9px] text-slate-400 font-mono font-bold block">
                              ({assignedVendorsCount} Firm Handshakes)
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700 uppercase">
                            <Clock size={10} /> Pending Dispatch
                          </span>
                        )}
                      </td>

                      {/* Execution Drawer Launcher Button Layout Link */}
                      <td className="p-4">
                        <button
                          onClick={() => openDetailedModal(request)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-xs bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1 w-fit"
                        >
                          <ExternalLink size={12} />
                          Review Job
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SLIDE OVER DRAWER: COMPREHENSIVE DETAIL ANALYSIS WINDOW ─── */}
      {showDetailModal && selectedRequestForModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowDetailModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1">
              {/* Drawer Layout Control Head */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Pipeline Manifest Data
                  </h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Resident Demographics Cluster Segment */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Reporting Demographics Block
                </p>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shrink-0">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      {selectedRequestForModal.resident_name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Resident Requester Handle
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      Unit Block {selectedRequestForModal.resident_unit}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Physical Infrastructure Node
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedRequestForModal.time_preferred}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Stated Preferred Operations window
                    </p>
                  </div>
                </div>
              </div>

              {/* Stated Instruction Framework Statement */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Statement of Issue Work Description
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-medium italic">
                  &quot;
                  {selectedRequestForModal.description ||
                    "No customized explicit work parameters or technical constraints outlined by resident node."}
                  &quot;
                </div>
              </div>

              {/* Active Allocated Field Firms Loop Block */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Allocated Dispatched Vendors (
                  {selectedRequestForModal.dispatched_vendors?.length || 0})
                </p>

                {getAssignedVendorsData(
                  selectedRequestForModal.dispatched_vendors,
                ).length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
                    <AlertTriangle
                      size={16}
                      className="text-amber-500 mx-auto mb-1.5"
                    />
                    <p className="text-xs italic text-slate-400 font-medium">
                      No external vendor contracts active on this tracking pipe.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getAssignedVendorsData(
                      selectedRequestForModal.dispatched_vendors,
                    ).map((vendor) => (
                      <div
                        key={vendor.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs uppercase shrink-0">
                          {vendor.name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {vendor.name}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-slate-500 truncate">
                            {vendor.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Panel Close Control Frame */}
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                Dismiss Parameter View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
