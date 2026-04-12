"use client";

import { useState } from "react";
import { ShieldCheck, MapPin, Clock, ChevronRight } from "lucide-react";
import { VerificationRequest } from "../services/types";
import { MOCK_VERIFICATION_REQUESTS } from "../services/Mock_data";
import RequestDetailView from "./RequestDetailView";

export default function RequestsPage() {
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [requests] = useState<VerificationRequest[]>(
    MOCK_VERIFICATION_REQUESTS,
  );

  // If a request is selected, show the side-by-side detail view
  if (selectedRequest) {
    return (
      <RequestDetailView
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Verification Center
        </h1>
        <p className="text-slate-500 font-medium">
          Manage pending estate onboarding requests
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {requests.map((req) => (
          <button
            key={req.estate_id}
            onClick={() => setSelectedRequest(req)}
            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">
                  {req.estate_name}
                </h3>
                {/* Updated: Town and City below name */}
                <p className="text-sm font-semibold text-indigo-600 mb-1">
                  {req.town && req.city
                    ? `${req.town}, ${req.city}`
                    : "Location not set"}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Submitted{" "}
                    {new Date(req.kyc_submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              Review Request
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </div>
          </button>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">No pending requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
