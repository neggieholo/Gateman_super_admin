/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  X,
  Users,
  Briefcase,
} from "lucide-react";
import { EstateService, Vendor } from "../services/types";

interface ServicesOverviewPageProps {
  services: EstateService[];
  estatename: string;
  estateId: string;
  onBack?: () => void;
}

export default function ServicesOverviewPage({
  services = [],
  estatename,
  estateId,
  onBack,
}: ServicesOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] =
    useState<string>("ALL");

  // Modal / Sidebar control state arrays
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState("");
  const [displayedVendors, setDisplayedVendors] = useState<any[]>([]);
  const [showVendorsModal, setShowVendorsModal] = useState(false);

  // Operational Metrics Aggregation Engine
  const serviceMetrics = {
    total: services.length,
    available: services.filter((s) => s.is_available).length,
    unavailable: services.filter((s) => !s.is_available).length,
    totalVendorsCount: Array.from(
      new Set(services.flatMap((s) => (s.vendors || []).map((v) => v.id))),
    ).length,
  };

  // Pipeline Filter Matrix
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.service_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const availabilityMatches =
      selectedAvailabilityFilter === "ALL" ||
      (selectedAvailabilityFilter === "AVAILABLE" && service.is_available) ||
      (selectedAvailabilityFilter === "UNAVAILABLE" && !service.is_available);

    return matchesSearch && availabilityMatches;
  });

  // Action Handler: Pulls localized vendors for one distinct ecosystem item
  const handleViewServiceVendors = (service: EstateService) => {
    setModalTitle(`${service.service_name} Vendors`);
    setModalSubtitle(
      `Active field technicians assigned directly to this sector block.`,
    );

    // Explicit array structural parsing safe-handling
    const vendorsList = (service.vendors || []).map((v: any) => ({
      ...v,
      associatedServices: [service.service_name],
    }));

    setDisplayedVendors(vendorsList);
    setShowVendorsModal(true);
  };

  // Action Handler: Flattens global registry map to parse explicit master references
  const handleViewAllSystemVendors = () => {
    setModalTitle("Master Vendors Registry");
    setModalSubtitle(
      "All registered service firms mapped out alongside their assigned fields.",
    );

    // Unique cross-reference array reduction map
    const vendorMap: { [key: string]: any } = {};

    services.forEach((service) => {
      (service.vendors || []).forEach((vendor: any) => {
        if (!vendorMap[vendor.id]) {
          vendorMap[vendor.id] = {
            ...vendor,
            associatedServices: new Set(),
          };
        }
        vendorMap[vendor.id].associatedServices.add(service.service_name);
      });
    });

    const flattenedVendors = Object.values(vendorMap).map((vendor) => ({
      ...vendor,
      associatedServices: Array.from(vendor.associatedServices),
    }));

    setDisplayedVendors(flattenedVendors);
    setShowVendorsModal(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6">
      {/* Header View Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col items-start">
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
              Services Directory
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
            onClick={handleViewAllSystemVendors}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2"
          >
            <Users size={14} />
            View All System Vendors
          </button>
        </div>
      </div>

      {/* Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Total Services
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {serviceMetrics.total}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Active/Available
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {serviceMetrics.available}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Suspended/Unavailable
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {serviceMetrics.unavailable}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Unique Vendors
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {serviceMetrics.totalVendorsCount}
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
            placeholder="Search service parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
          />
        </div>

        {/* Filters Selectors Row */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/40 text-xs font-bold text-slate-500">
            {["ALL", "AVAILABLE", "UNAVAILABLE"].map((statusKey) => {
              const displayCount =
                statusKey === "ALL"
                  ? services.length
                  : statusKey === "AVAILABLE"
                    ? serviceMetrics.available
                    : serviceMetrics.unavailable;

              return (
                <button
                  key={statusKey}
                  onClick={() => setSelectedAvailabilityFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedAvailabilityFilter === statusKey
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
                <th className="p-4 w-[40%]">Service Manifest Name</th>
                <th className="p-4 w-[20%]">Status Context</th>
                <th className="p-4 w-[20%]">Assigned Vendors Count</th>
                <th className="p-4 w-[20%]">System Infrastructure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No active service data configurations match defined metric
                    targets.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const vendorArray = service.vendors || [];

                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      {/* Service Profile Block */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900 block truncate">
                          {service.service_name}
                        </p>
                      </td>

                      {/* Status Toggle Display Block */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            service.is_available
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}
                        >
                          {!service.is_available && <AlertTriangle size={10} />}
                          {service.is_available ? "OPERATIONAL" : "SUSPENDED"}
                        </span>
                      </td>

                      {/* Linked Vendors Configuration Matrix Counter */}
                      <td className="p-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {vendorArray.length} Vendors Listed
                      </td>

                      {/* Modal Dynamic Target Action Block */}
                      <td className="p-4">
                        <button
                          onClick={() => handleViewServiceVendors(service)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 w-fit"
                        >
                          <Users size={12} />
                          View Vendors
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

      {/* Dynamic Master Vendors Assignment Modal Drawer */}
      {showVendorsModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowVendorsModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1">
              {/* Drawer Header View Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {modalTitle}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {modalSubtitle}
                  </p>
                </div>
                <button
                  onClick={() => setShowVendorsModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Vendors List Mapping Frame */}
              <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
                {displayedVendors.length === 0 ? (
                  <p className="text-xs italic text-slate-400 text-center py-8">
                    No active vendor accounts found under this categorization
                    context.
                  </p>
                ) : (
                  displayedVendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl border border-slate-300 shrink-0 overflow-hidden flex items-center justify-center">
                          <span className="text-base font-black text-slate-400 uppercase">
                            {vendor.name?.charAt(0)}
                          </span>
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {vendor.name}
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-500 truncate">
                            {vendor.phone || "No phone linked"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {vendor.email || "No email on record"}
                          </p>
                        </div>
                      </div>

                      {/* Associated Operations Mapped Chips */}
                      {vendor.associatedServices &&
                        vendor.associatedServices.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                              Assigned Trade Scope
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {vendor.associatedServices.map(
                                (srv: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="bg-white border border-slate-200 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase"
                                  >
                                    {srv}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Bottom Layout */}
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                onClick={() => setShowVendorsModal(false)}
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
