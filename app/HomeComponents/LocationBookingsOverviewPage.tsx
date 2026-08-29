import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Calendar,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  MapPin,
  CreditCard,
  Clock,
  Download,
} from "lucide-react";
import { LocationBooking, EstateFacility } from "../services/types";
import { formatDate, formatTime } from "../services/apis";
import { useUser } from "../UserContext";
import toast from "react-hot-toast";

interface LocationBookingsOverviewPageProps {
  events: LocationBooking[];
  locations: EstateFacility[];
  estatename: string;
  onBack: () => void;
}

type StatusFilter =
  | "ALL"
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "PAYMENT PENDING"
  | "PAYMENT SUBMITTED";

export default function LocationBookingsOverviewPage({
  events = [],
  locations = [],
  estatename,
  onBack,
}: LocationBookingsOverviewPageProps) {
  const {user} = useUser()
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<LocationBooking | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 🔄 Memoized location index map handling numeric IDs and unique Name strings safely
  const locationsMap = useMemo(() => {
    const maps: { [key: string]: EstateFacility } = {};

    locations.forEach((loc) => {
      if (loc.id !== undefined && loc.id !== null) {
        const stringId = String(loc.id).trim().toLowerCase();
        maps[stringId] = loc;
      }
    });

    return maps;
  }, [locations]);

  const resolveLocationInfo = useCallback(
    (venueId: string | null): EstateFacility | null => {
      if (!venueId) return null;
      const normalizedKey = venueId.toString();
      return locationsMap[normalizedKey] || null;
    },
    [locationsMap],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const searchLower = searchQuery.toLowerCase();

      const resolvedLocationName = ev.venue_name;

      const matchesText =
        ev.resident_name?.toLowerCase().includes(searchLower) ||
        resolvedLocationName.includes(searchLower);

      // 3. Status Matrix Routing
      let matchesStatus = true;
      if (statusFilter === "APPROVED") matchesStatus = ev.status === "APPROVED";
      else if (statusFilter === "REJECTED")
        matchesStatus = ev.status === "REJECTED";
      else if (statusFilter === "PENDING") {
        matchesStatus = ev.status === "PENDING_APPROVAL";
      } else if (statusFilter === "PAYMENT PENDING") {
        matchesStatus = ev.status === "PAYMENT_PENDING";
      } else if (statusFilter === "PAYMENT SUBMITTED") {
        matchesStatus = ev.status === "PAYMENT_SUBMITTED";
      }

      return matchesText && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  const handleDownloadCSV = () => {
    if (filteredEvents.length === 0) return;

    const canDownloadBookings =
      user?.permissions?.includes("bookings_management") ||
      user?.permissions?.includes("download_reports") ||
      user?.permissions?.includes("all-access");

    if (!canDownloadBookings) {
      toast.error(
        "Access Denied. You do not hold the authorized credentials required for exporting booking records.",
        {
          id: "unauthorized-bookings-export",
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
      "Resident Name",
      "Venue Name",
      "Resolved Location ID",
      "Status",
      "Start Date",
      "End Date",
      "Time Window",
      "Payment Type",
      "Total Amount (NGN)",
    ];

    const csvRows = filteredEvents.map((ev) => {
      const resolvedLoc = resolveLocationInfo(ev.venue_id);
      const venueDisplay = resolvedLoc
        ? resolvedLoc.name
        : ev.venue_name || "Unassigned Venue";
      const timeWindow = `${ev.start_time?.slice(0, 5) || "00:00"} - ${
        ev.end_time?.slice(0, 5) || "00:00"
      }`;

      return [
        `"${(ev.resident_name || "Unknown Resident").replace(/"/g, '""')}"`,
        `"${venueDisplay.replace(/"/g, '""')}"`,
        `"${ev.venue_id || "N/A"}"`,
        `"${ev.status}"`,
        `"${ev.start_date}"`,
        `"${ev.end_date}"`,
        `"${timeWindow}"`,
        `"${ev.is_paid ? "PAID" : "FREE"}"`,
        `"${parseFloat(String(ev.total_amount || 0)).toFixed(2)}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const sanitizedEstate = estatename.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `location_bookings_${sanitizedEstate}_ledger.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (event: LocationBooking) => {
    switch (event.status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={10} /> APPROVED
          </span>
        );

      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={10} /> REJECTED
          </span>
        );

      case "PAYMENT_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
            <CreditCard size={10} /> PAYMENT PENDING
          </span>
        );

      case "PAYMENT_SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock size={10} /> PAYMENT SUBMITTED
          </span>
        );

      case "PENDING_APPROVAL":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle size={10} /> PENDING
          </span>
        );
    }
  };

  const openDetails = (ev: LocationBooking) => {
    setSelectedEvent(ev);
    setShowDetailModal(true);
  };

  const activeSelectedLocation = selectedEvent
    ? resolveLocationInfo(selectedEvent.venue_id)
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
        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={filteredEvents.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
            filteredEvents.length === 0
              ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]"
          }`}
        >
          <Download size={14} /> Export CSV Ledger ({filteredEvents.length})
        </button>
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
          {(
            [
              "ALL",
              "PENDING",
              "PAYMENT PENDING",
              "PAYMENT SUBMITTED",
              "APPROVED",
              "REJECTED",
            ] as StatusFilter[]
          ).map((tab) => (
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
          ))}
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
                  const resolvedLocation = resolveLocationInfo(ev.venue_id);
                  return (
                    <tr
                      key={ev.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 truncate">
                            {ev.venue_name}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 space-y-0.5">
                        <p className="font-mono font-bold text-slate-800 text-[11px]">
                          {formatDate(ev.start_date)}{" "}
                          {ev.end_date !== ev.start_date &&
                            `to ${formatDate(ev.end_date)}`}
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
                              : ev.venue_id || "No assignment"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{renderStatusBadge(ev)}</td>
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
                  Booking Info
                </h2>
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
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm font-oswald">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Resident Name
                </span>
                {selectedEvent.resident_name}
              </div>
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Verification State
                </span>
                {renderStatusBadge(selectedEvent)}
              </div>

              {/* Location Framework Info & Venue Capacity Block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Assigned Infrastructure Venue
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
                          ? `${activeSelectedLocation.capacity} Max`
                          : "Uncapped Bounds"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      {selectedEvent.venue_name || "No LOcation Recorded"}
                    </div>
                  </div>
                )}
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
                      {formatDate(selectedEvent.start_date)} @{" "}
                      {formatTime(selectedEvent.start_time)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px]">
                      Release/End Constraint
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatDate(selectedEvent.end_date)} @{" "}
                      {formatTime(selectedEvent.end_time)}
                    </span>
                  </div>
                </div>

                {selectedEvent.booked_dates &&
                  selectedEvent.booked_dates.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Explicitly Booked Days
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEvent.booked_dates.map((date, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-md"
                          >
                            {formatDate(date)}
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
                      {selectedEvent.is_paid ? "PAID" : "FREE"} BOOKING
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Charged Amount
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      ₦
                      {parseFloat(
                        selectedEvent.total_amount.toString() || "0",
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
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
