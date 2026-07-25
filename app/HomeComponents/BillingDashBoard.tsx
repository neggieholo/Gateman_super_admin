import React, { useState, useEffect } from "react";
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Settings,
  RefreshCw,
} from "lucide-react";
import AnalyticsView from "./BillingAnalytics";
import SubscriptionsLedgerView from "./BillingSubscriptionsView";
import PricingConfigView from "./BillingPricingView";

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "subscriptions" | "pricing"
  >("analytics");

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial & Billing Operations
          </h1>
          <p className="text-sm text-slate-400">
            Manage plan pricing, monitor revenue telemetry, and audit estate
            subscriptions.
          </p>
        </div>
      </div>

      {/* ── TOP KPI TELEMETRY CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Est. Monthly Revenue
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-50">₦2,450,000</div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% from last month
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Paid Estates
            </span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-50">11 / 13</div>
          <p className="text-xs text-slate-400 mt-1">
            2 Estates pending renewal
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Expiring in &lt; 7 Days
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">3</div>
          <p className="text-xs text-slate-400 mt-1">
            Action required for extension
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Paystack Sub-accounts
            </span>
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-50">13 Active</div>
          <p className="text-xs text-indigo-400 mt-1">
            Direct split settlement enabled
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 transition-colors ${activeTab === "analytics" ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
        >
          📊 Revenue Analytics
        </button>
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`pb-3 transition-colors ${activeTab === "subscriptions" ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
        >
          💳 Subscriptions & Ledger
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-3 transition-colors ${activeTab === "pricing" ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
        >
          ⚙️ Plan Pricing Matrix
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "analytics" && <AnalyticsView />}
      {activeTab === "subscriptions" && <SubscriptionsLedgerView />}
      {activeTab === "pricing" && <PricingConfigView />}
    </div>
  );
}
