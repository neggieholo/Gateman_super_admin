/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

export default function SubscriptionsLedgerView() {
  const [selectedEstate, setSelectedEstate] = useState<any>(null);

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by estate name or code..."
          className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg w-72 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2">
          <select className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Estate Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Current Plan</th>
              <th className="p-3">Subscription Expiry</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {/* Example Row */}
            <tr className="hover:bg-slate-800/40">
              <td className="p-3 font-semibold text-slate-100">
                Crown Royal Estate
              </td>
              <td className="p-3 text-slate-400">CRE-8821</td>
              <td className="p-3">
                <span className="badge badge-sm badge-outline badge-primary">
                  Estate Management
                </span>
              </td>
              <td className="p-3">Aug 24, 2026</td>
              <td className="p-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  ACTIVE
                </span>
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() =>
                    setSelectedEstate({ id: "1", name: "Crown Royal Estate" })
                  }
                  className="btn btn-xs bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                >
                  Renew / Extend
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Manual Extension Modal */}
      {selectedEstate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Extend Subscription: {selectedEstate.name}
            </h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Add Duration (Months)
              </label>
              <select
                id="duration"
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-sm text-slate-200"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year (12 Months)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedEstate(null)}
                className="btn btn-sm btn-ghost text-slate-400"
              >
                Cancel
              </button>
              <button className="btn btn-sm bg-indigo-600 hover:bg-indigo-500 text-white">
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
