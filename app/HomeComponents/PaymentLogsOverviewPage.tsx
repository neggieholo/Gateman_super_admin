"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  FileText,
  User,
  ExternalLink,
  Download,
} from "lucide-react";
import { PaymentLog } from "../services/types";

interface PaymentLogsOverviewPageProps {
  logs: PaymentLog[];
  estatename: string;
  onBack: () => void;
}

type StatusFilter = "ALL" | "pending" | "verified" | "rejected";

export default function PaymentLogsOverviewPage({
  logs = [],
  estatename,
  onBack,
}: PaymentLogsOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Helper date formatter
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper currency formatter
  const formatCurrency = (amount: number) => {
    return `₦${(Number(amount) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const labelPaymentType = (type: string | null) => {
    const label = type === "bank_transfer" ? "Bank Transfer" : "Card Payment";
    return label;
  };
  // Filtered payment logs using exact status string states
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = searchQuery.toLowerCase();

      const matchesText =
        log.resident_name?.toLowerCase().includes(searchLower) ||
        log.transaction_reference?.toLowerCase().includes(searchLower) ||
        log.category?.toLowerCase().includes(searchLower) ||
        log.payment_type?.toLowerCase().includes(searchLower);

      let matchesStatus = true;
      const status = log.status?.toLowerCase();

      if (statusFilter === "verified") {
        matchesStatus =
          status === "verified" ||
          status === "successful" ||
          status === "success";
      } else if (statusFilter === "pending") {
        matchesStatus = status === "pending";
      } else if (statusFilter === "rejected") {
        matchesStatus = status === "rejected" || status === "failed";
      }

      return matchesText && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      "Log ID",
      "Resident Name",
      "Resident ID",
      "Transaction Reference",
      "Amount",
      "Category",
      "Payment Type",
      "Status",
      "Payment Date",
      "Created At",
      "Notes",
    ];

    const rows = filteredLogs.map((log) => [
      log.id || "",
      log.resident_name || "",
      log.resident_id || "",
      log.transaction_reference || "",
      log.amount || 0,
      log.category || "",
      log.payment_type || "",
      log.status || "",
      log.payment_date || "",
      log.created_at || "",
      log.notes || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const sanitizedEstate = (estatename || "estate")
      .toLowerCase()
      .replace(/\s+/g, "_");

    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${sanitizedEstate}_payment_logs_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (statusStr: string | null) => {
    const status = statusStr?.toLowerCase();
    switch (status) {
      case "verified":
      case "successful":
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            <CheckCircle size={10} /> Verified
          </span>
        );
      case "rejected":
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase">
            <AlertCircle size={10} /> Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase">
            <Clock size={10} /> Pending
          </span>
        );
    }
  };

  const openDetails = (log: PaymentLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 animate-fadeIn space-y-6 flex-1 min-h-0 overflow-y-auto">
      {/* Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="text-[11px] font-black tracking-wide uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl transition-all mb-2 block w-fit"
          >
            ← Control Desk
          </button>
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            Estate Payment & Revenue Ledger
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
              Context:
            </span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700 font-bold">
              {estatename}
            </span>
          </div>
        </div>
      </div>

      {/* Control Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Search Parameters
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter by resident name, reference code, payment category, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-medium transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "pending", "verified", "rejected"] as StatusFilter[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all ${
                    statusFilter === tab
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Download size={13} /> Export CSV ({filteredLogs.length})
          </button>
        </div>
      </div>

      {/* Payment Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-125 overflow-y-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                <th className="p-4 w-[25%]">Resident / Payer</th>
                <th className="p-4 w-[20%]">Payment Type</th>
                <th className="p-4 w-[18%]">Amount & Category</th>
                <th className="p-4 w-[17%]">Payment Date</th>
                <th className="p-4 w-[10%]">Status</th>
                <th className="p-4 w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center italic text-slate-400 bg-white"
                  >
                    No payment logs match active matrix configuration rules.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-900 truncate">
                        {log.resident_name || "Unknown Resident"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        ID: {log.resident_id || "N/A"}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[11px] font-bold text-slate-800 truncate block">
                        {labelPaymentType(log.payment_type) || "Standard"}
                      </span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="font-mono font-bold text-slate-900">
                        {formatCurrency(log.amount)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">
                        {log.category || "General"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono font-bold text-slate-800 text-[11px]">
                        {formatDate(log.payment_date || log.created_at)}
                      </p>
                    </td>
                    <td className="p-4">{renderStatusBadge(log.status)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => openDetails(log)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Action Slide-Over Drawer */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={() => setShowDetailModal(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-white shrink-0">
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Payment Record Info
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-slate-50/30">
              {/* Resident Overview */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <User size={12} /> Resident Details
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {selectedLog.resident_name || "Unregistered / Guest"}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedLog.resident_id
                      ? `ID: ${selectedLog.resident_id.slice(0, 8)}...`
                      : "No ID"}
                  </span>
                </div>
              </div>

              {/* Status Block */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Verification State
                </span>
                {renderStatusBadge(selectedLog.status)}
              </div>

              {/* Financial Breakdown */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CreditCard size={12} /> Transaction Overview
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Amount Settled
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {formatCurrency(selectedLog.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Category
                    </span>
                    <span className="font-bold text-slate-800 uppercase text-[11px]">
                      {selectedLog.category || "General"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Payment Method
                    </span>
                    <span className="font-bold text-slate-800 uppercase text-[11px]">
                      {labelPaymentType(selectedLog.payment_type).toUpperCase() || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit Timestamps */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> Timeline Log
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Payment Date
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatDate(selectedLog.payment_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      System Creation
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatDate(selectedLog.created_at)}
                    </span>
                  </div>
                  {selectedLog.verified_at && (
                    <div className="col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[10px]">
                        Verified At
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatDate(selectedLog.verified_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes & Verification Details */}
              {selectedLog.notes && (
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Notes & Context
                  </span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedLog.notes}
                  </p>
                </div>
              )}

              {/* Receipt Action Link */}
              {selectedLog.receipt_url && (
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                  <a
                    href={selectedLog.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={14} /> View Digital Payment Receipt
                  </a>
                </div>
              )}
            </div>

            {/* Sticky Footing */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center shadow-sm"
              >
                Dismiss Modal Frame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
