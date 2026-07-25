import { useState } from "react";

export default function PricingConfigView() {
  const [estatePlanPrice, setEstatePlanPrice] = useState(50000);
  const [securityPlanPrice, setSecurityPlanPrice] = useState(25000);

  const handleSavePricing = async () => {
    // Calls API: PUT /billing/pricing-config
    alert("Subscription amounts updated successfully!");
  };

  return (
    <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100">
          Global Subscription Pricing Matrix
        </h3>
        <p className="text-xs text-slate-400">
          These default figures drive billing collection and automated invoice
          generation across all estates.
        </p>
      </div>

      <div className="space-y-4">
        {/* Estate Plan Input */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-sm font-semibold text-slate-200 block">
            Estate Management Plan (Monthly Base Fee)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
              ₦
            </span>
            <input
              type="number"
              value={estatePlanPrice}
              onChange={(e) => setEstatePlanPrice(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Security Plan Input */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-sm font-semibold text-slate-200 block">
            Security Guard Terminals Add-on (Monthly Base Fee)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
              ₦
            </span>
            <input
              type="number"
              value={securityPlanPrice}
              onChange={(e) => setSecurityPlanPrice(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSavePricing}
          className="btn btn-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
        >
          Save Pricing Configuration
        </button>
      </div>
    </div>
  );
}
