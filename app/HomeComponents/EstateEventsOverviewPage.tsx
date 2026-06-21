/* eslint-disable @next/next/no-img-element */
import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Calendar,
  Users,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { EstateEvent, EstateLocation } from "../services/types";

interface EstateEventsOverviewPageProps {
  events: EstateEvent[];
  locations: EstateLocation[];
  estatename: string;
  onBack: () => void;
}

type StatusFilter = "ALL" | "APPROVED" | "REJECTED" | "PENDING";

export default function EstateEventsOverviewPage({
  events = [],
  locations = [],
  estatename,
  onBack,
}: EstateEventsOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<EstateEvent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 🔄 Memoized location index map handling numeric IDs and unique Name strings safely
  const locationsMap = useMemo(() => {
    const maps: { [key: string]: EstateLocation } = {};

    locations.forEach((loc) => {
      // 1. Map by Unique Name string (Your new implementation)
      if (loc.name) {
        maps[loc.name.trim().toLowerCase()] = loc;
      }

      // 2. Map by Numeric ID casted safely to string (For backwards compatibility/fallback matching)
      if (loc.id !== undefined && loc.id !== null) {
        const stringId = String(loc.id).trim().toLowerCase();
        maps[stringId] = loc;
      }
    });

    return maps;
  }, [locations]);

  const resolveLocationInfo = useCallback(
    (venueDetail: string | null): EstateLocation | null => {
      if (!venueDetail) return null;
      const normalizedKey = venueDetail.trim().toLowerCase();
      return locationsMap[normalizedKey] || null;
    },
    [locationsMap],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const searchLower = searchQuery.toLowerCase();

      const resolvedLocationName =
        resolveLocationInfo(ev.venue_detail)?.name.toLowerCase() || "";

      const matchesText =
        ev.title.toLowerCase().includes(searchLower) ||
        ev.ref_code.toLowerCase().includes(searchLower) ||
        (ev.venue_detail || "").toLowerCase().includes(searchLower) ||
        resolvedLocationName.includes(searchLower); 

      // 3. Status Matrix Routing
      let matchesStatus = true;
      if (statusFilter === "APPROVED") matchesStatus = ev.is_approved === true;
      else if (statusFilter === "REJECTED")
        matchesStatus = ev.is_rejected === true;
      else if (statusFilter === "PENDING") {
        matchesStatus = ev.is_approved !== true && ev.is_rejected !== true;
      }

      return matchesText && matchesStatus;
    });
  }, [events, searchQuery, statusFilter, resolveLocationInfo]);

  const renderStatusBadge = (
    approved: boolean | null,
    rejected: boolean | null,
  ) => {
    if (approved === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={10} /> APPROVED
        </span>
      );
    }
    if (rejected === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle size={10} /> REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
        <HelpCircle size={10} /> PENDING
      </span>
    );
  };

  const openDetails = (ev: EstateEvent) => {
    setSelectedEvent(ev);
    setShowDetailModal(true);
  };

  const activeSelectedLocation = selectedEvent
    ? resolveLocationInfo(selectedEvent.venue_detail)
    : null;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6 flex-1 min-h-0 overflow-y-auto">
      {/* Upper context block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-[11px] font-black tracking-wide uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl transition-all mb-2 block w-fit"
          >
            ← Control Desk
          </button>
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            Estate Events & Reservations Ledger
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
              Context:
            </span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-bold">
              {estatename}
            </span>
          </div>
        </div>
      </div>

      {/* Control Filters Block */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Search Parameters
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter by title, reference code, resolved infrastructure locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(["ALL", "APPROVED", "PENDING", "REJECTED"] as StatusFilter[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all ${
                  statusFilter === tab
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Structured Minimal Core Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-125 overflow-y-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <th className="p-4 w-[32%]">Event Program Title</th>
                <th className="p-4 w-[24%]">Operational Timeline</th>
                <th className="p-4 w-[20%]">Location Name</th>
                <th className="p-4 w-[14%]">Approval Status</th>
                <th className="p-4 w-[10%]">Action Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No residential events match active matrix configuration
                    rules.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const resolvedLocation = resolveLocationInfo(ev.venue_detail);
                  return (
                    <tr
                      key={ev.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 truncate">
                            {ev.title}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-tight">
                            {ev.ref_code}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 space-y-0.5">
                        <p className="font-mono font-bold text-slate-800 text-[11px]">
                          {ev.start_date}{" "}
                          {ev.end_date !== ev.start_date && `to ${ev.end_date}`}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          {ev.start_time.slice(0, 5)} -{" "}
                          {ev.end_time.slice(0, 5)}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="truncate">
                          <p className="text-slate-800 font-bold truncate flex items-center gap-1">
                            <MapPin
                              size={12}
                              className="shrink-0 text-slate-400"
                            />
                            {resolvedLocation
                              ? resolvedLocation.name
                              : ev.venue_detail || "No assignment"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(ev.is_approved, ev.is_rejected)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openDetails(ev)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
                        >
                          Details
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

      {/* ─── SCROLLABLE EXPANDED ACTION SLIDE OVER DRAWER ─── */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowDetailModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-200">
            {/* Sticky Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-white shrink-0">
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Complete Reservation Node Payload
                </h2>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedEvent.title}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Container Body Frame */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-slate-50/30">
              {/* Event Graphic Banner Display Frame */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Event Program Banner
                </span>
                {selectedEvent.banner_url ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm group">
                    <img
                      src={selectedEvent.banner_url}
                      alt="Program Banner"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400">
                    <ImageIcon size={20} className="stroke-[1.5]" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      No Banner Media Attached
                    </span>
                  </div>
                )}
              </div>

              {/* Status Verification Bar */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Verification State
                </span>
                {renderStatusBadge(
                  selectedEvent.is_approved,
                  selectedEvent.is_rejected,
                )}
              </div>

              {/* Program Descriptions Text Box */}
              {selectedEvent.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Program Description Summary
                  </span>
                  <p className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Location Framework Info & Venue Capacity Block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Assigned Infrastructure Venue Context
                </span>
                {activeSelectedLocation ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-indigo-900 flex items-center gap-1">
                          <MapPin
                            size={13}
                            className="text-indigo-500 shrink-0"
                          />{" "}
                          {activeSelectedLocation.name}
                        </p>
                        <p className="text-[9px] font-mono text-slate-400 tracking-tight">
                          ID: {activeSelectedLocation.id}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100/75 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        Infrastructure Maximum Threshold
                      </span>
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        {activeSelectedLocation.capacity
                          ? `${activeSelectedLocation.capacity} Max Pax`
                          : "Uncapped Bounds"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      {selectedEvent.venue_detail ||
                        "No plain text string found."}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Unmapped legacy raw text entry location marker block.
                    </p>
                  </div>
                )}
              </div>

              {/* Attendance Registry Comparison Matrix */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wide flex items-center gap-1">
                    <Users size={12} className="text-slate-400" /> Expected
                    Bounds
                  </p>
                  <p className="text-base font-mono font-black text-slate-800">
                    {selectedEvent.expected_guests || 0} Pax
                  </p>
                </div>
                <div className="bg-indigo-600 p-3.5 rounded-xl space-y-0.5 shadow-sm text-white">
                  <p className="text-[9px] font-black uppercase text-indigo-200 tracking-wide flex items-center gap-1">
                    <Users size={12} className="text-indigo-200" /> Registered
                    Guests
                  </p>
                  <p className="text-base font-mono font-black">
                    {selectedEvent.registered_guests || 0} Pax
                  </p>
                </div>
              </div>

              {/* Operation Time & Booked Dates Calendar */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar size={12} /> Execution Target Window
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px]">
                      Start Constraint
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedEvent.start_date} @{" "}
                      {selectedEvent.start_time.slice(0, 5)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px]">
                      Release/End Constraint
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedEvent.end_date} @{" "}
                      {selectedEvent.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>

                {selectedEvent.booked_dates &&
                  selectedEvent.booked_dates.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Explicitly Booked Array Blocks
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEvent.booked_dates.map((date, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-md"
                          >
                            {date}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Financial & Settlement Gateway Ledger */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <DollarSign size={12} /> Financial & Settlement Gateway
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Access Tariff Classification
                    </span>
                    <span
                      className={`font-bold inline-block px-2 py-px mt-0.5 rounded text-[10px] ${selectedEvent.is_paid ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`}
                    >
                      {selectedEvent.is_paid ? "PAID ENTRANCE" : "FREE ENTRY"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Ticket Cost Valuation
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      ₦
                      {parseFloat(
                        (selectedEvent.ticket_price as string) || "0",
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {selectedEvent.is_paid && selectedEvent.account_number && (
                  <div className="pt-3 border-t border-slate-100 text-xs grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">
                        Flutterwave Split Subaccount ID
                      </span>
                      <span className="font-mono font-semibold text-slate-700">
                        {selectedEvent.subaccount_id || "Direct Ledger Account"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        Payout Target Bank
                      </span>
                      <span className="font-bold text-slate-800">
                        {selectedEvent.bank_name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        NUBAN Settlement Account
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedEvent.account_number}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footing Action Control Panel */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center shadow-sm"
              >
                Dismiss Modal Frame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
