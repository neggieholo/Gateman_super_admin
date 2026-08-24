"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  Filter,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useUser } from "../UserContext";
import { AddOnType, BillingAnalyticsResponse } from "../services/types";

interface AnalyticsViewProps {
  telemetryData: BillingAnalyticsResponse | null;
  loading?: boolean;
}

type DistributionFilter = "active" | "expired" | "trial" | "all";

export const FEATURE_COLOR_MAP: Record<AddOnType | "DEFAULT", string> = {
  security: "#10b981", // Emerald Green
  payments: "#6366f1", // Indigo
  community: "#f59e0b", // Amber
  facility_bookings: "#3b82f6", // Blue
  services_dispatch: "#ec4899", // Pink
  DEFAULT: "#8b5cf6", // Purple fallback
};

// Human-readable display labels for UI rendering
export const FEATURE_LABEL_MAP: Record<AddOnType, string> = {
  security: "Security Gate Plus",
  payments: "Financials & Payments",
  community: "Community Hub",
  facility_bookings: "Facility Bookings",
  services_dispatch: "Services Dispatch",
};

/**
 * Safely resolves a hex color for a given feature name.
 */
export const getFeatureColor = (featureName: string): string => {
  return (
    FEATURE_COLOR_MAP[featureName as AddOnType] || FEATURE_COLOR_MAP.DEFAULT
  );
};

/**
 * Safely resolves a user-friendly display string for a given feature name.
 */
export const getFeatureLabel = (featureName: string): string => {
  return FEATURE_LABEL_MAP[featureName as AddOnType] || featureName;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function AnalyticsView({
  telemetryData,
  loading,
}: AnalyticsViewProps) {
  const { user } = useUser();
  const [distributionFilter, setDistributionFilter] =
    useState<DistributionFilter>("active");
  const [growthMode, setGrowthMode] = useState<"month" | "year">("month");

  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    today.getMonth() + 1,
  );

  // Directly check user permissions
  const hasRootBilling =
    user?.permissions.includes("all-access") ||
    user?.permissions.includes("billing_management");
  const canViewFinancials =
    hasRootBilling || user?.permissions.includes("view_financials");

  // Dynamic Year List based on Telemetry Data
  const availableYears = useMemo(() => {
    if (!telemetryData?.monthly_history?.length) {
      return [today.getFullYear()];
    }
    const years = new Set(telemetryData.monthly_history.map((h) => h.year));
    years.add(today.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [telemetryData, today]);

  // Revenue Metrics
  const revenueMetrics = useMemo(() => {
    if (!telemetryData?.monthly_history?.length) {
      return { currentRevenue: 0, growthPercent: 0, totalLifetime: 0 };
    }

    const history = telemetryData.monthly_history;
    const totalLifetime = history.reduce(
      (acc, curr) => acc + Number(curr.total_amount || 0),
      0,
    );

    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;

    if (growthMode === "month") {
      const currentMonthItem = history.find(
        (h) => h.year === curYear && h.month === curMonth,
      );
      const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
      const prevYear = curMonth === 1 ? curYear - 1 : curYear;

      const prevMonthItem = history.find(
        (h) => h.year === prevYear && h.month === prevMonth,
      );

      const currentRev = Number(currentMonthItem?.total_amount || 0);
      const prevRev = Number(prevMonthItem?.total_amount || 0);

      let growth = 0;
      if (prevRev > 0) {
        growth = Math.round(((currentRev - prevRev) / prevRev) * 100);
      } else if (currentRev > 0) {
        growth = 100;
      }

      return {
        currentRevenue: currentRev,
        growthPercent: growth,
        totalLifetime,
      };
    } else {
      const currentYearTotal = history
        .filter((h) => h.year === curYear)
        .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

      const prevYearTotal = history
        .filter((h) => h.year === curYear - 1)
        .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

      let growth = 0;
      if (prevYearTotal > 0) {
        growth = Math.round(
          ((currentYearTotal - prevYearTotal) / prevYearTotal) * 100,
        );
      } else if (currentYearTotal > 0) {
        growth = 100;
      }

      return {
        currentRevenue: currentYearTotal,
        growthPercent: growth,
        totalLifetime,
      };
    }
  }, [telemetryData, growthMode, today]);

  // AreaChart Data (Chronologically Sorted)
  const revenueTrendData = useMemo(() => {
    if (!telemetryData?.monthly_history?.length) return [];

    return [...telemetryData.monthly_history]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((item) => ({
        month: `${item.month_name} ${item.year}`,
        amount: Number(item.total_amount || 0),
        transactions: item.total_transactions,
      }));
  }, [telemetryData]);

  // Scoped Month Revenue
  const currentPeriodMetrics = useMemo(() => {
    if (!telemetryData?.monthly_history?.length) {
      return { total_amount: 0, total_transactions: 0 };
    }

    const match = telemetryData.monthly_history.find(
      (item) => item.year === selectedYear && item.month === selectedMonth,
    );

    return {
      total_amount: match ? Number(match.total_amount || 0) : 0,
      total_transactions: match ? match.total_transactions : 0,
    };
  }, [telemetryData, selectedYear, selectedMonth]);

  // PieChart Data
  // PieChart Data Transformation Fix
  const formattedFeatureDistribution = useMemo(() => {
    if (!telemetryData?.feature_distribution) return [];

    return telemetryData.feature_distribution
      .map((item) => {
        let subscriberCount = 0;

        if (distributionFilter === "active") {
          subscriberCount = Number(item.active_estates || 0);
        } else if (distributionFilter === "expired") {
          subscriberCount = Number(item.expired_estates || 0);
        } else if (distributionFilter === "trial") {
          // Ensure trial_estates is fallback-checked and converted to a number
          subscriberCount = Number(item.trial_estates || 0);
        } else {
          // "all" filter
          subscriberCount = Number(item.total_estates || 0);
        }

        return {
          name: getFeatureLabel(item.feature_name),
          value: subscriberCount,
          activeEstates: Number(item.active_estates || 0),
          trialEstates: Number(item.trial_estates || 0),
          expiredEstates: Number(item.expired_estates || 0),
          totalEstates: Number(item.total_estates || 0),
          color: getFeatureColor(item.feature_name),
        };
      })
      .filter((entry) => entry.value > 0);
  }, [telemetryData, distributionFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!telemetryData) return;

    const rows: string[] = [];

    // 1. Monthly Revenue Breakdown Section
    rows.push("MONTHLY REVENUE HISTORY");
    rows.push("Year,Month,Revenue (NGN),Transactions");

    const sortedHistory = [...(telemetryData.monthly_history || [])].sort(
      (a, b) => b.year - a.year || b.month - a.month,
    );

    sortedHistory.forEach((row) => {
      rows.push(
        `${row.year},"${row.month_name}",${row.total_amount},${row.total_transactions}`,
      );
    });

    rows.push(""); // Blank spacing line

    // 2. Feature Add-On Distribution Section
    rows.push("FEATURE ADD-ON DISTRIBUTION");
    rows.push(
      "Feature Name,Active Paid Estates,Trial Estates,Expired Estates,Total Estates",
    );

    (telemetryData.feature_distribution || []).forEach((feature) => {
      const label = getFeatureLabel(feature.feature_name);
      rows.push(
        `"${label}",${feature.active_estates},${feature.trial_estates || 0},${feature.expired_estates},${feature.total_estates}`,
      );
    });

    rows.push(""); // Blank spacing line

    // 3. Regional Breakdown Section
    rows.push("REGIONAL BREAKDOWN");
    rows.push("State,Active Estates,Total Revenue (NGN)");

    (telemetryData.regional_breakdown || []).forEach((region) => {
      rows.push(
        `"${region.state}",${region.active_estates},${region.total_revenue}`,
      );
    });

    // Construct CSV blob and trigger download
    const csvString = rows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `billing_analytics_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canViewFinancials && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Revenue & Growth */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {growthMode === "month"
                    ? "Current Month Revenue"
                    : "Current Year Revenue"}
                </span>
              </div>

              <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setGrowthMode("month")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    growthMode === "month"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  MoM
                </button>
                <button
                  onClick={() => setGrowthMode("year")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    growthMode === "year"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  YoY
                </button>
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-slate-50">
                ₦{revenueMetrics.currentRevenue.toLocaleString()}
              </div>
              <p
                className={`text-xs mt-1 flex items-center gap-1 font-medium ${
                  revenueMetrics.growthPercent >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {revenueMetrics.growthPercent >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {revenueMetrics.growthPercent >= 0
                  ? `+${revenueMetrics.growthPercent}%`
                  : `${revenueMetrics.growthPercent}%`}{" "}
                from {growthMode === "month" ? "last month" : "last year"}
              </p>
            </div>
          </div>

          {/* Card 2: Active / Expired Estates */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Active Paid Estates
              </span>
              <CreditCard className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-slate-50">
              {telemetryData?.stats?.active_estates || 0} /{" "}
              {telemetryData?.stats?.total_estates || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {telemetryData?.stats?.expired_estates || 0} Estates expired /
              inactive
            </p>
          </div>

          {/* Card 3: Expiring in < 7 Days */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Expiring in &lt; 7 Days
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {telemetryData?.stats?.expiring_soon || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Action required for extension
            </p>
          </div>

          {/* Card 4: Lifetime Collections */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Lifetime Revenue
              </span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-50">
              ₦{revenueMetrics.totalLifetime.toLocaleString()}
            </div>
            <p className="text-xs text-indigo-400 mt-1">
              Total historical collection
            </p>
          </div>
        </div>
      )}

      {/* Scoped Telemetry Controls & Export Action */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-indigo-400 tracking-wider uppercase">
            Scoped Revenue Telemetry
          </span>
          <h2 className="text-xl font-bold text-slate-100">
            ₦{currentPeriodMetrics.total_amount.toLocaleString()}
          </h2>
          <p className="text-xs text-slate-400">
            {currentPeriodMetrics.total_transactions} successful transactions in
            this period
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            disabled={!telemetryData}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-semibold mb-1">
            Subscription Revenue Trend
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            12-month aggregated incoming subscription revenue (NGN)
          </p>
          <div className="h-64">
            {revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [
                      `₦${Number(value).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No revenue trend data available.
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold">Plan Distribution</h3>
              <Filter className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Tier breakdowns by status
            </p>

            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg mb-4">
              {(
                ["active", "expired", "trial", "all"] as DistributionFilter[]
              ).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDistributionFilter(filter)}
                  className={`flex-1 text-[11px] font-medium py-1 rounded-md transition-all capitalize ${
                    distributionFilter === filter
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="h-44">
            {formattedFeatureDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedFeatureDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                  >
                    {formattedFeatureDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} Estates`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No distribution data.
              </div>
            )}
          </div>

          <div className="space-y-2 mt-2">
            {formattedFeatureDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-slate-300">{item.name}</span>
                </span>
                <div className="text-right">
                  <span className="font-bold text-slate-200 block">
                    {item.value} Estates
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
