/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Layers,
  X,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { EstateLocation } from "../services/types";


interface EstateLocationsOverviewPageProps {
  locations: EstateLocation[];
  estatename: string;
  onBack: () => void;
}

export default function EstateLocationsOverviewPage({
  locations = [],
  estatename,
  onBack,
}: EstateLocationsOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<EstateLocation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const metrics = useMemo(() => {
    let globalBookedDays = 0;
    locations.forEach((loc) => {
      if (!loc.event_booked_on) return;
      try {
        const bookingData =
          typeof loc.event_booked_on === "string"
            ? JSON.parse(loc.event_booked_on)
            : loc.event_booked_on;

        Object.keys(bookingData).forEach((key) => {
          const block = bookingData[key];
          if (block && Array.isArray(block.dates)) {
            globalBookedDays += block.dates.length;
          }
        });
      } catch (e) {
        console.error("Failed structural processing layout parse:", e);
      }
    });

    return {
      totalVenues: locations.length,
      totalGlobalBookings: globalBookedDays,
    };
  }, [locations]);

  // ⚙️ Helper to process on-the-fly singular venue counts safely from JSONB fields
  const countLocationBookedDays = (eventBookedOn: any): number => {
    if (!eventBookedOn) return 0;
    try {
      const bookingData =
        typeof eventBookedOn === "string"
          ? JSON.parse(eventBookedOn)
          : eventBookedOn;

      let count = 0;
      Object.keys(bookingData).forEach((key) => {
        const block = bookingData[key];
        if (block && Array.isArray(block.dates)) {
          count += block.dates.length;
        }
      });
      return count;
    } catch (e) {
      return 0;
    }
  };

  // 📝 Helper to extract your string array configs inside permitted_days safely
  const parsePermittedDays = (permittedDays: any): string[] => {
    if (!permittedDays) return [];
    try {
      return typeof permittedDays === "string"
        ? JSON.parse(permittedDays)
        : permittedDays;
    } catch (e) {
      return [];
    }
  };

  // 🔍 Unified String Match Filtering Logic
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesText =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.location_in_estate || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesText;
    });
  }, [locations, searchQuery]);

  const openDetails = (loc: EstateLocation) => {
    setSelectedLocation(loc);
    setShowDetailModal(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6 flex-1 min-h-0 overflow-y-auto">
      {/* Upper Control Bar Desk */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-[11px] font-black tracking-wide uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl transition-all mb-2 block w-fit"
          >
            ← Control Desk
          </button>
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            Estate Venues & Resource Nodes
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

      {/* Metric Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Managed Physical Venues
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {metrics.totalVenues}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Total Booked Reservation Days
            </p>
            <p className="text-lg font-black text-slate-800 font-mono">
              {metrics.totalGlobalBookings} Days
            </p>
          </div>
        </div>
      </div>

      {/* Live Text Search Filter Layout Block */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Search Venues
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter by name descriptor, spatial address markers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Core Infrastructure Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-125 overflow-y-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <th className="p-4 w-[30%]">Location Name</th>
                <th className="p-4 w-[35%]">Internal Spatial Descriptor</th>
                <th className="p-4 w-[12%]">Capacity Bounds</th>
                <th className="p-4 w-[13%]">Days Booked</th>
                <th className="p-4 w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No physical asset location blocks found matching criteria
                    inputs.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr
                    key={loc.id}
                    className="hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {loc.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 truncate">
                      {loc.location_in_estate ||
                        "No internal directions provided."}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      {loc.capacity ? `${loc.capacity}` : "N/A"}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center font-mono font-black text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/40">
                        {countLocationBookedDays(loc.event_booked_on)} Days
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openDetails(loc)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1 w-fit"
                      >
                        <ExternalLink size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SLIDE OVER DRAWER: DETAIL ANALYSIS WINDOW ─── */}
      {showDetailModal && selectedLocation && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowDetailModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Venue Manifest Metadata
                  </h2>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    Node: {selectedLocation.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Core Details Segment Block */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Spatial Context Address
                  </p>
                  <p className="text-xs font-medium text-slate-800 mt-0.5">
                    {selectedLocation.location_in_estate ||
                      "No description set."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Total Capacity
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                      {selectedLocation.capacity
                        ? `${selectedLocation.capacity} seats`
                        : "Unlimited/Unset"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Calculated Bookings
                    </p>
                    <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                      {countLocationBookedDays(
                        selectedLocation.event_booked_on,
                      )}{" "}
                      Days Active
                    </p>
                  </div>
                </div>
              </div>

              {/* Permitted Operation Days JSON Config List */}
              {/* <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <SlidersHorizontal size={10} /> Operational Permitted Days
                  Framework
                </p>
                {parsePermittedDays(selectedLocation.permitted_days).length ===
                0 ? (
                  <p className="text-xs italic text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    No scheduled day restrictions explicitly provisioned in JSON
                    matrix.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {parsePermittedDays(selectedLocation.permitted_days).map(
                      (day, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200/60 uppercase"
                        >
                          {day}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div> */}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center shadow-sm"
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
