"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Users,
  Radio,
  Building2,
  UserCheck,
  Percent,
  CircleDot,
} from "lucide-react";
import { SYSTEM_PERMISSIONS } from "../services/data";
import { DashboardAnalyticsPayload } from "../services/types";
import { getDashboardAnalytics } from "../services/apis_estates";
import { useUser } from "../UserContext";

export default function SuperAdminDashboardOverview() {
  const { setEstatesList } = useUser();
  const [analytics, setAnalytics] = useState<DashboardAnalyticsPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardMetrics = async () => {
      try {
        setLoading(true);
        const data = await getDashboardAnalytics();
        if (data.success) {
          setAnalytics(data);
          setEstatesList(data.estatesList)
        }
      } catch (err) {
        console.error("Failed to parse core telemetry metrics shards:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardMetrics();
  }, []);

  // --- 📊 DYNAMIC PERMISSION STRUCTURAL MATRIX CHART ---
  const permissionDistribution = useMemo(() => {
    // 1. Map root/parent targets from local config definitions
    const parentKeys = SYSTEM_PERMISSIONS.filter(
      (p) => p.parent_permission === null,
    ).map((p) => p.id);

    const chartMap: Record<string, number> = {};
    parentKeys.forEach((k) => {
      chartMap[k] = 0;
    });
    chartMap["all-access"] = 0;

    if (!analytics?.permissionDistribution?.chartMap) {
      return { chartMap, totalAllocatedTokens: 0 };
    }

    // 2. Populate values calculated directly by your backend DB optimization loop
    Object.entries(analytics.permissionDistribution.chartMap).forEach(
      ([key, value]) => {
        chartMap[key] = value;
      },
    );

    return {
      chartMap,
      totalAllocatedTokens:
        analytics.permissionDistribution.totalAllocatedTokens || 0,
    };
  }, [analytics]);

  if (loading || !analytics) {
    return (
      <div className="p-8 text-center font-mono text-xs font-bold tracking-widest text-slate-400 animate-pulse">
        HYDRATING PLATFORM TELEMETRY FABRIC SHARDS...
      </div>
    );
  }

  const { superAdminStats, ecosystemStats } = analytics;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* SECTION 1: IDENTITY ACCESS MANAGEMENT (SUPER ADMINS SECTION)              */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
              Identity Access Control Plane
            </h2>
          </div>
        </div>

        {/* STATS MATRIX SECTION 1 ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DIV A: Overall User Registry Ratio */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Super Admin Population
              </span>
              <p className="text-2xl font-black text-slate-900">
                {superAdminStats.total}{" "}
                <span className="text-xs font-bold text-slate-400">
                  Total Users
                </span>
              </p>
              <div className="text-[11px] font-mono font-bold text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-indigo-600">
                  Main: {superAdminStats.mainAccounts}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-amber-600">
                  Sub-Accounts: {superAdminStats.subAccounts}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold font-mono text-sm">
              {superAdminStats.mainAccounts}:{superAdminStats.subAccounts}
            </div>
          </div>

          {/* DIV B: Total Real-Time Connected Matrix */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block font-mono">
                Telemetry Node Status
              </span>
              <p className="text-2xl font-black text-emerald-600 flex items-center gap-2">
                {superAdminStats.liveAdmins}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </p>
              <span className="text-[11px] font-medium text-slate-400 block">
                Current active sessions{" "}
                {superAdminStats.pendingRequests > 0 &&
                  `(+${superAdminStats.pendingRequests} pending verification)`}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Radio className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* DIV C: Dynamic Permissions Allocation Vector Horizontal Bar Chart */}
        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Percent size={12} /> Root Permission Scope Allocation Weight
            </h3>
            <p className="text-[10px] text-slate-400">
              Aggregated allocation weight of parent system policies
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(permissionDistribution.chartMap).map(
              ([key, value]) => {
                const labelNode = SYSTEM_PERMISSIONS.find((p) => p.id === key);
                const displayName = labelNode
                  ? labelNode.name
                  : "Full Administrative Access (Root)";

                // Calculate width distribution matching total weight
                const percentage =
                  permissionDistribution.totalAllocatedTokens > 0
                    ? Math.round(
                        (value / permissionDistribution.totalAllocatedTokens) *
                          100,
                      )
                    : 0;

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-medium">
                      <span className="text-slate-700 font-bold max-w-xs truncate">
                        {displayName}
                      </span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {value} hits ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          key === "all-access"
                            ? "bg-indigo-600"
                            : key === "users_management"
                              ? "bg-sky-500"
                              : key === "estates_management"
                                ? "bg-emerald-500"
                                : key === "logs_management"
                                  ? "bg-amber-500"
                                  : "bg-purple-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: ESTATE WORKSPACE EDGE TELEMETRY                                */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
              Ecosystem Telemetry Real-time Matrix
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Property nodes and external edge accounts activity tracking
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DIV A: Managed Infrastructure Totals */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Property Infrastructure
            </span>
            <p className="text-2xl font-black text-slate-900">
              {ecosystemStats.totalEstates}
            </p>
            <span className="text-[11px] font-medium text-slate-400 block font-mono">
              COMPUTED ACTIVE NODES ON DISPATCH
            </span>
          </div>

          {/* DIV B: Residents Telemetry Shards */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Resident Core Accounts
              </span>
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {ecosystemStats.totalResidents.toLocaleString()}
            </p>
            <div className="text-[11px] font-mono font-bold text-sky-600 flex items-center gap-1">
              <CircleDot size={10} /> {ecosystemStats.activeResidents30m} active
              in last 30 mins
            </div>
          </div>

          {/* DIV C: Gate Guards Security Terminal Shards */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Active Gate Guards Terminals
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {ecosystemStats.totalGuards.toLocaleString()}
            </p>
            <div className="text-[11px] font-mono font-bold text-emerald-600 flex items-center gap-1">
              <UserCheck size={10} /> {ecosystemStats.activeGuards30m} active in
              last 30 mins
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
