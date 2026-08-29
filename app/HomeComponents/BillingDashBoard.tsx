/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import AnalyticsView from "./BillingAnalytics";
import SubscriptionsLedgerView from "./BillingSubscriptionsView";
import PricingConfigView from "./BillingPricingView";
import { billingApi } from "../services/apis_estates";
import { BillingAnalyticsResponse } from "../services/types";
import toast from "react-hot-toast";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./ManageUsersPage";
import { useSearchParams } from "next/navigation";

export default function BillingDashboard() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const querySearchName = searchParams.get("search_name");

  // Preserve the initial query param across renders
  const [initialSearchName, setInitialSearchName] = useState<string | null>(
    null,
  );

  const hasRootBilling =
    user?.permissions.includes("all-access") ||
    user?.permissions.includes("billing_management");

  // Granular Capabilities
  const canViewFinancials =
    hasRootBilling || user?.permissions.includes("view_financials");

  const canManagePricing =
    hasRootBilling || user?.permissions.includes("manage_pricing");

  // Basic Page Access Guard
  const canAccessPage = canViewFinancials || canManagePricing;

  // ── SMART INITIAL TAB SELECTION ──
  // If user only has manage_pricing, default to 'pricing' tab instead of 'analytics'
  const [activeTab, setActiveTab] = useState<
    "analytics" | "subscriptions" | "pricing"
  >(() => (canViewFinancials ? "analytics" : "pricing"));

  useEffect(() => {
    if (querySearchName) {
      setInitialSearchName(querySearchName);

      if (canViewFinancials) {
        setActiveTab("subscriptions");
      } else {
        showAccessDeniedToast();
      }

      // Remove search_name from URL cleanly without losing internal state
      const url = new URL(window.location.href);
      url.searchParams.delete("search_name");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [querySearchName, canViewFinancials]);
  // Sync activeTab if permissions finish loading asynchronously
  useEffect(() => {
    if (!canViewFinancials && canManagePricing && activeTab === "analytics") {
      setActiveTab("pricing");
    }
  }, [canViewFinancials, canManagePricing, activeTab]);

  // State
  const [telemetry, setTelemetry] = useState<BillingAnalyticsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);

  const checkPermissions = useCallback(() => {
    if (!canAccessPage) {
      showAccessDeniedToast();
      return false;
    }
    return true;
  }, [canAccessPage]);

  useEffect(() => {
    if (!checkPermissions()) return;

    // Only attempt to fetch financial telemetry if the user actually has view_financials permission
    if (!canViewFinancials) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const data = await billingApi.getAnalytics();
        setTelemetry(data);
        console.log("Telemetry Data:", data);
      } catch (err: any) {
        if (err?.response?.status === 403 || err?.status === 403) {
          toast.error(
            "Access Denied: You do not have permission to view financial analytics.",
          );
        } else {
          toast.error("Failed to load telemetry details.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, canAccessPage, canViewFinancials, checkPermissions]);

  return (
    <div className="p-2 space-y-6 text-slate-100 h-screen flex flex-col">
      {/* ── HEADER & GROWTH FILTER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl text-black font-bold tracking-tight">
            Financial & Billing Operations
          </h1>
          <p className="text-sm text-slate-400">
            Manage plan pricing, monitor revenue telemetry, and audit estate
            subscriptions.
          </p>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        {canViewFinancials && (
          <button
            onClick={() => {
              if (checkPermissions()) setActiveTab("analytics");
            }}
            className={`pb-3 transition-colors ${
              activeTab === "analytics"
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            📊 Revenue Analytics
          </button>
        )}

        {canViewFinancials && (
          <button
            onClick={() => {
              if (checkPermissions()) setActiveTab("subscriptions");
            }}
            className={`pb-3 transition-colors ${
              activeTab === "subscriptions"
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            💳 Subscriptions & Ledger
          </button>
        )}

        {canManagePricing && (
          <button
            onClick={() => {
              if (checkPermissions()) setActiveTab("pricing");
            }}
            className={`pb-3 transition-colors ${
              activeTab === "pricing"
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            ⚙️ Plan Pricing Matrix
          </button>
        )}
      </div>

      {/* ── TAB PANELS ── */}
      <div className="flex-1 pb-35 overflow-y-auto">
        {activeTab === "analytics" && canViewFinancials && (
          <AnalyticsView telemetryData={telemetry} loading={loading} />
        )}
        {activeTab === "subscriptions" && canViewFinancials && (
          <SubscriptionsLedgerView
            searchName={initialSearchName ? initialSearchName : null}
          />
        )}
        {activeTab === "pricing" && canManagePricing && <PricingConfigView />}
      </div>
    </div>
  );
}
