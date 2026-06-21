/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { X, History, UserCheck, CalendarDays } from "lucide-react";
import { Invitation } from "../services/types";

interface GatePassesOverviewPageProps {
  passes: Invitation[];
  estatename: string;
  onBack?: () => void;
}

export default function GatePassesOverviewPage({
  passes: initialPasses,
  estatename,
  onBack,
}: GatePassesOverviewPageProps) {
  const [passesList, setPassesList] = useState<Invitation[]>(initialPasses);
  const [selectedPass, setSelectedPass] = useState<Invitation | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // 🚨 Dynamic status evaluator mapping algorithm matching your established engine setup
  const getStatusStyle = (pass: Invitation) => {
    if (pass.is_cancelled) {
      return "bg-rose-50 text-rose-700 border border-rose-200";
    }
    if (pass.is_activated === false) {
      return "bg-slate-100 text-slate-600 border border-slate-200";
    }

    switch (pass.status) {
      case "checked_in":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "checked_out":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "overstayed":
        return "bg-red-50 text-red-700 border border-red-200 animate-pulse";
      case "pending":
      default:
        return "bg-amber-50 text-amber-700 border border-amber-200";
    }
  };

  const getComputedStatusLabel = (pass: Invitation) => {
    if (pass.is_cancelled) return "CANCELLED";
    if (pass.is_activated === false) return "DEACTIVATED";

    switch (pass.status) {
      case "checked_in":
        return "CHECKED IN";
      case "checked_out":
        return "CHECKED OUT";
      case "overstayed":
        return "🚨 OVERSTAYED";
      case "pending":
      default:
        return "PENDING ACCESS";
    }
  };

  // Convert day numerical map array representation to localized text layout
  const formatPermittedDays = (days: number[]) => {
    if (!days || days.length === 0) return "All Framework Cycles";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((d) => dayNames[d] || d).join(", ");
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen animate-fadeIn">
      <div className="mx-auto space-y-6">
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
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Gate Pass Invitations Assessment
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

        {/* Data Matrix Table Section Layout */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <th className="p-4">Guest Profile</th>
                  <th className="p-4">Access Code</th>
                  <th className="p-4">Invite Class</th>
                  <th className="p-4">Operational Windows</th>
                  <th className="p-4">State Engine</th>
                  <th className="p-4 text-right">Audit Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {passesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center italic text-slate-400 bg-white"
                    >
                      No active security pass keys logged in this node
                      environment.
                    </td>
                  </tr>
                ) : (
                  passesList.map((pass) => (
                    <tr
                      key={pass.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Guest Identification Bundle */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                            {pass.guest_image_url ? (
                              <img
                                src={pass.guest_image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-black text-slate-400 uppercase">
                                {pass.guest_name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {pass.guest_name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {pass.guest_phone || "No Linked Phone"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Access Keys Tokens */}
                      <td className="p-4">
                        <span className="font-mono font-black text-slate-800 tracking-wider bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/40">
                          {pass.access_code}
                        </span>
                      </td>

                      {/* Invite Classification Categories */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded-md uppercase">
                            {pass.invite_type?.replace("_", " ") || "one_time"}
                          </span>
                          {pass.staff_position && (
                            <p className="text-[10px] text-slate-400 font-bold italic">
                              {pass.staff_position}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Valid Calendar/Time Range Bounds */}
                      <td className="p-4">
                        <div className="space-y-0.5 text-slate-600 font-mono text-[11px]">
                          <p className="font-bold text-slate-800">
                            📅{" "}
                            {new Date(pass.start_date).toLocaleDateString(
                              "en-GB",
                            )}
                            {pass.end_date &&
                              ` → ${new Date(pass.end_date).toLocaleDateString("en-GB")}`}
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            ⏰ {pass.start_time?.slice(0, 5)} -{" "}
                            {pass.end_time?.slice(0, 5)}
                          </p>
                        </div>
                      </td>

                      {/* Evaluated Operational Status Indicators */}
                      <td className="p-4">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider ${getStatusStyle(pass)}`}
                        >
                          {getComputedStatusLabel(pass)}
                        </span>
                      </td>

                      {/* Command Interceptor Triggers */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              console.log(
                                `Viewing activity logs placeholder tracking data hook for ID: ${pass.id}`,
                              )
                            }
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all inline-flex items-center gap-1 font-bold text-[11px]"
                          >
                            <History size={14} />
                            <span>Logs</span>
                          </button>
                          <button
                            onClick={() => setSelectedPass(pass)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                          >
                            Inspect Nodes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Panel Drawer Details Container */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setSelectedPass(null)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header View Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Pass Inspection Node
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-70">
                    {selectedPass.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPass(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Guest Profile Deep Detail Layout */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div
                  onClick={() => {
                    if (selectedPass.guest_image_url) {
                      setShowImagePreview(true);
                    }
                  }}
                  className="w-36 h-36 bg-slate-200 rounded-xl border border-slate-300 shrink-0 overflow-hidden flex items-center justify-center"
                >
                  {selectedPass.guest_image_url ? (
                    <img
                      src={selectedPass.guest_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-400 uppercase">
                      {selectedPass.guest_name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 max-w-50">
                  <p className="text-sm font-black text-slate-900 truncate">
                    {selectedPass.guest_name}
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-500">
                    {selectedPass.guest_phone || "No phone linked."}
                  </p>
                  <span
                    className={`inline-block text-[9px] font-black px-2 py-0.5 rounded mt-1 ${getStatusStyle(selectedPass)}`}
                  >
                    {getComputedStatusLabel(selectedPass)}
                  </span>
                </div>
              </div>

              {/* Resident Host Attribution */}
              {selectedPass.resident_name && (
                <div className="bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    Resident Host Context
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedPass.resident_name}
                  </p>
                  {selectedPass.estate_name && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      📍 {selectedPass.estate_name}
                    </p>
                  )}
                </div>
              )}

              {/* Dynamic Check-in/Check-out Hardware Activity Logs */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest inline-flex items-center gap-1.5">
                  <UserCheck size={12} className="text-indigo-600" />
                  Telemetry Timestamp Activity Logs
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      Actual Check-In
                    </p>
                    <p className="text-xs font-mono font-black text-slate-800">
                      {selectedPass.actual_checkin_date
                        ? selectedPass.actual_checkin_date
                        : "⏳ PENDING"}
                    </p>
                  </div>
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      Actual Check-Out
                    </p>
                    <p className="text-xs font-mono font-black text-slate-800">
                      {selectedPass.actual_checkout_date
                        ? selectedPass.actual_checkout_date
                        : "⏳ PENDING"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Framework System Validation Properties */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest inline-flex items-center gap-1.5">
                  <CalendarDays size={12} className="text-indigo-600" />
                  System Recurrence & Rules
                </h3>

                <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 text-xs">
                  <div className="p-3 flex justify-between items-center gap-4">
                    <span className="text-slate-400 shrink-0">
                      Permitted Work Days
                    </span>
                    <span className="font-mono font-bold text-slate-700 text-right">
                      {formatPermittedDays(selectedPass.permitted_days)}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-slate-400">Excluded Windows</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedPass.excluded_dates &&
                      selectedPass.excluded_dates.length > 0
                        ? `${selectedPass.excluded_dates.length} entries tagged`
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bottom Layout */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  console.log(
                    `Deep telemetry logs requested placeholder for sequence code: ${selectedPass.access_code}`,
                  );
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <History size={14} />
                View Full Gateway Transaction Logs
              </button>
              <button
                onClick={() => setSelectedPass(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}
      {showImagePreview && selectedPass?.guest_image_url && (
        <div
          onClick={() => setShowImagePreview(false)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-[90vw] max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Close button indicator helper for touch screens */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
            >
              <X size={18} />
            </button>
            <img
              src={selectedPass.guest_image_url}
              alt={`${selectedPass.guest_name} expanded avatar`}
              className="max-w-full max-h-[80vh] rounded-3xl object-contain border border-slate-800 shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Stop overlay click collapse when clicking image directly
            />
          </div>
        </div>
      )}
    </div>
  );
}
