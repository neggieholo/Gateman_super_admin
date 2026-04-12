"use client";

import React from "react";
import {
  ChevronLeft,
  Users,
  Wallet,
  Building2,
  ShieldCheck,
  FileText,
  ExternalLink,
  MapPin,
  CreditCard,
  UserCheck,
  History,
} from "lucide-react";
import { ActiveEstate } from "../services/types";

interface Props {
  estate: ActiveEstate;
  onBack: () => void;
}

export default function EstateManagementDetail({ estate, onBack }: Props) {
  // Format helpers
  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(Number(amount));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header Navigation */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors group"
      >
        <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
          <ChevronLeft size={20} />
        </div>
        Back to Estate Directory
      </button>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT & MIDDLE COLUMN: Primary Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estate Identity Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} /> Fully Verified
              </span>
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-2">
              {estate.estate_name}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">
              <MapPin size={14} className="text-indigo-500" />
              {estate.town}, {estate.city} • Code:{" "}
              <span className="text-slate-900">{estate.estate_code}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-wider mb-1">
                  Total Escrow Balance
                </p>
                <p className="text-3xl font-black">
                  {formatCurrency(estate.wallet_balance)}
                </p>
              </div>

              <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
                  Active Residents
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-black">{estate.tenant_count}</p>
                  <button className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    View List <Users size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <UserCheck size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase">
                  Primary Admin
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-lg">
                {estate.admin_name}
              </h4>
              <p className="text-slate-400 text-sm font-medium mb-6">
                {estate.admin_email}
              </p>
              <button className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl font-bold text-sm hover:bg-amber-50 hover:text-amber-700 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-amber-100">
                Manage Admin Credentials
              </button>
            </div>

            {/* Transaction Snapshot Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase">
                  Billing Info
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-lg">
                Transaction History
              </h4>
              <p className="text-slate-400 text-sm font-medium mb-6">
                Invoices, bills & payouts
              </p>
              <button className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl font-bold text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-emerald-100">
                View Ledger
              </button>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="text-indigo-500" size={20} /> Legal &
              Compliance
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CAC Cert", url: estate.cac_cert_url },
                { label: "TIN Cert", url: estate.tin_cert_url },
                { label: "Utility Bill", url: estate.estate_utility_url },
                { label: "Auth Letter", url: estate.authorization_letter_url },
              ].map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url || "#"}
                  target="_blank"
                  className="flex flex-col items-center p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all group"
                >
                  <div className="w-10 h-10 mb-2 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm">
                    <ExternalLink size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    {doc.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Details */}
        <div className="space-y-6">
          {/* Business Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 mb-4 uppercase text-[10px] tracking-[0.2em]">
              Business Details
            </h4>
            <div className="space-y-4">
              <DetailItem label="Business Type" value={estate.business_type} />
              <DetailItem label="CAC Number" value={estate.cac_number} />
              <DetailItem label="TIN Number" value={estate.tin_number} />
              <DetailItem
                label="Registered Address"
                value={estate.registered_address}
              />
              <DetailItem label="Reg. Date" value={estate.registration_date} />
            </div>
          </div>

          {/* Payout & Banking */}
          <div className="bg-indigo-900 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <h4 className="font-black text-indigo-300 mb-4 uppercase text-[10px] tracking-[0.2em]">
              Payout Destination
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-800 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-300 uppercase">
                    Subaccount Code
                  </p>
                  <p className="text-sm font-black text-white font-mono">
                    {estate.paystack_subaccount_code}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-indigo-800">
                <p className="text-sm font-black">{estate.bank_account_name}</p>
                <p className="text-xs font-bold text-indigo-300 uppercase">
                  {estate.bank_name}
                </p>
                <p className="text-lg font-black tracking-widest mt-1">
                  {estate.bank_account_number}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 mb-4 uppercase text-[10px] tracking-[0.2em]">
              Admin Controls
            </h4>
            <div className="space-y-3">
              <button className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
                Suspend Estate Access
              </button>
              <button className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                Download Audit Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small helper component for sidebar items
function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-600 leading-tight">
        {value || "N/A"}
      </p>
    </div>
  );
}
