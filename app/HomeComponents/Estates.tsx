"use client";

import React, { useCallback, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { DashboardEstateNode } from "../services/types";
import { getEstatesDashboard } from "../services/apis_estates";
import EstateDashboardPage from "./EstateDashboardPage";
import { showAccessDeniedToast } from "./ManageUsersPage";
import { useUser } from "../UserContext";

export default function EstatesManagement() {
  const { user } = useUser();
  const [estates, setEstates] = useState<DashboardEstateNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstate, setSelectedEstate] =
    useState<DashboardEstateNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalEstates, setTotalEstates] = useState<number>(0);

  useEffect(() => {
    fetchEstates();
  }, []);

  const fetchEstates = useCallback(async () => {
    const canViewDEstates =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("view_estate_info") ||
      user?.permissions.includes("all-access");

    if (!canViewDEstates) {
      showAccessDeniedToast();
      return;
    }
    setLoading(true);
    try {
      const res = await getEstatesDashboard();
      if (res.success) {
        setEstates(res.estates);
        setTotalEstates(res.count);
      } else {
        toast.error("Failed to load estates directory metadata.");
      }
    } catch (err) {
      console.error("Estates hydration failure:", err);
      toast.error(
        "Network communication failure fetching dynamic organizational nodes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const selectEstate = (estate: DashboardEstateNode) => {
    const canViewLogs =
      user?.permissions.includes("estates_management") ||
      user?.permissions.includes("view_estate_info") ||
      user?.permissions.includes("all-access");

    if (!canViewLogs) {
      showAccessDeniedToast();
      return;
    }
    setSelectedEstate(estate);
  };

  const filteredEstates = estates.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.estate_code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentPermissions = user?.permissions || [];
  const hasAccessToCurrentPanel =
    currentPermissions.includes("all-access") ||
    currentPermissions.includes("view_estate_info") ||
    currentPermissions.includes("estates_management");

  if(!hasAccessToCurrentPanel){
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
        🔒 View locked down due to restricted access.
      </div>
    );
  }

  return (
    <div className="p-2 bg-slate-50 h-[calc(100vh-110px)] text-slate-800 font-sans flex flex-col overflow-hidden">
      {/* 📊 High-Level Global Metrics Banner (Driven by Database Aggregates) */}
      {!selectedEstate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Estates
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loading ? "..." : totalEstates}{" "}
              <span className="text-xs font-normal text-emerald-600 ml-1">
                ({estates.filter((e) => e.status === "ACTIVE").length} Active)
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Residents (Active last 30 Days)
            </p>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {loading
                ? "..."
                : estates.reduce(
                    (acc, curr) =>
                      acc + (Number(curr.active_residents_30_days) || 0),
                    0,
                  )}{" "}
              <span className="text-xs font-normal text-slate-400 ml-1">
                /{" "}
                {loading
                  ? "..."
                  : estates.reduce(
                      (acc, curr) => acc + (Number(curr.total_residents) || 0),
                      0,
                    )}{" "}
                total
              </span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Security Force Status
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {loading
                ? "..."
                : estates.reduce(
                    (acc, curr) => acc + (Number(curr.guards_on_duty) || 0),
                    0,
                  )}{" "}
              <span className="text-xs font-normal text-slate-400 ml-1">
                On Duty (
                {loading
                  ? "..."
                  : estates.reduce(
                      (acc, curr) => acc + (Number(curr.total_guards) || 0),
                      0,
                    )}{" "}
                Registered)
              </span>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-xs font-medium text-slate-400 animate-pulse flex-1">
          Querying multi-tenant operational data nodes...
        </div>
      ) : !selectedEstate ? (
        /* 🏢 DIRECTORY MODULE LIST VIEW CONTAINER */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col flex-1  animate-in fade-in duration-150 min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 shrink-0">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Estates Directory Nodes
              </h2>
              <p className="text-xs text-slate-400">
                Select an organizational zone node to interact with dedicated
                resident counts and security parameters.
              </p>
            </div>
            <input
              type="text"
              placeholder="Filter by name, LGA or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 w-full sm:w-64"
            />
          </div>

          {/* This wrapper limits the height and provides isolated internal scroll */}
          <div className="overflow-auto flex-1 min-h-0 pr-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50">
                  <th className="p-3">Estate Parameters</th>
                  <th className="p-3">Location Context</th>
                  <th className="p-3">Resident Density</th>
                  <th className="p-3">Guard Matrix</th>
                  <th className="p-3">Node Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {filteredEstates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      No matching registered nodes found.
                    </td>
                  </tr>
                ) : (
                  filteredEstates.map((estate) => (
                    <tr
                      key={estate.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      onClick={() => selectEstate(estate)}
                    >
                      <td className="p-3">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {estate.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          CODE: {estate.estate_code}
                        </p>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>{estate.lga}</div>
                        <div className="text-[10px] text-slate-400">
                          {estate.state} State
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>
                          {estate.active_residents_30_days} Active{" "}
                          <span className="text-[10px] text-slate-400">
                            (30d)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total Enrolled: {estate.total_residents}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        <div>{estate.guards_on_duty} Active Guards</div>
                        <div className="text-[10px] text-slate-400">
                          {estate.total_guards} Total Enrolled
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            estate.status === "ACTIVE"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {estate.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 📈 INDIVIDUAL ESTATE PERSONALIZED DASHBOARD CONTAINER */
        <EstateDashboardPage
          estateId={selectedEstate.id}
          onBack={() => setSelectedEstate(null)}
        />
      )}
    </div>
  );
}
