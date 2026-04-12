"use client";

import { useState } from "react";
import { Building2, ChevronRight, Users, Wallet } from "lucide-react";
import EstateManagementDetail from "./EstateManagementDetail"; // New Component
import { ActiveEstate } from "../services/types";
import { MOCK_ACTIVE_ESTATES } from "../services/Mock_data";

export default function EstatesPage() {
  const [selectedEstate, setSelectedEstate] = useState<ActiveEstate | null>(null);
  const [estates, setEstates] = useState<ActiveEstate[]>(MOCK_ACTIVE_ESTATES); // Fetch this from /api/master/all-active

  if (selectedEstate) {
    return (
      <EstateManagementDetail
        estate={selectedEstate}
        onBack={() => setSelectedEstate(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Active Estates
        </h1>
        <p className="text-slate-500 font-medium">
          Monitor and manage fully onboarded estates
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {estates.map((est) => (
          <button
            key={est.estate_id}
            onClick={() => setSelectedEstate(est)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-400 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Building2 size={28} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl">
                  {est.estate_name}
                </h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                  {est.town}, {est.city}
                </p>

                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    <Users size={14} /> {est.tenant_count} Residents
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <Wallet size={14} /> ₦
                    {Number(est.wallet_balance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
