/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  MapPin,
  Search,
  Loader2,
} from "lucide-react";
import { VerificationRequest } from "../services/types";
import VerificationResultCard from "./VerificationResultCard";

export default function RequestDetailView({
  request,
  onBack,
}: {
  request: VerificationRequest;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"estate" | "admin">("estate");
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- API HANDLERS ---

  const handleExternalVerify = async (type: "CAC" | "TIN", value: string) => {
    if (!value) return;
    setIsVerifying(type);
    try {
      const response = await fetch("/api/master/verify-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });

      const result = await response.json();

      if (result.success) {
        setViewingDoc({
          name: `${type} Official Registry Result`,
          isExternal: true,
          data: {
            status: result.data.status || "Active",
            registeredName: (
              result.data.company_name || result.data.name
            ).toUpperCase(),
            date: result.data.registration_date || "N/A",
            address: result.data.address || "N/A",
          },
        });
      } else {
        setViewingDoc({
          name: `${type} Query Result`,
          isExternal: true,
          error: `${type} number ${value} was not found.`,
        });
      }
    } catch (error) {
      setViewingDoc({
        name: "API Error",
        isExternal: true,
        error: "Could not connect to the verification server.",
      });
    } finally {
      setIsVerifying(null);
    }
  };

  const handleProcessAction = async (action: "approve" | "reject") => {
    setIsProcessing(true);

    // Choose endpoint and payload based on active tab
    const endpoint =
      activeTab === "estate"
        ? "/api/master/process-estate"
        : "/api/master/process-admin";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estate_id: request.estate_id,
          admin_id: request.admin_id,
          action,
          reason:
            action === "reject"
              ? rejectionReason
              : "Information verified successfully",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `${activeTab === "estate" ? "Estate" : "Admin"} ${action}ed successfully.`,
        );
        setShowRejectModal(false);
        onBack(); // Return to list
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Processing failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminVerify = async (type: "NIN" | "BVN", value: string) => {
    if (!value) return;
    setIsVerifying(type);
    try {
      // Note: Reusing the same endpoint logic, you'll update your backend to handle these types
      const response = await fetch("/api/master/verify-admin-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          value,
          estate_id: request.estate_id, // Passing estate_id for the server-side check
        }),
      });

      const result = await response.json();

      if (result.success) {
        setViewingDoc({
          name: `${type} Verification Result`,
          isExternal: true,
          data: {
            status: "Verified",
            registeredName: result.data.full_name.toUpperCase(),
            date: result.data.dob || "N/A",
            address: result.data.address || "N/A",
          },
        });
      } else {
        setViewingDoc({
          name: `${type} Query Result`,
          isExternal: true,
          error: result.error || `${type} verification failed.`,
        });
      }
    } catch (error) {
      setViewingDoc({
        name: "API Error",
        isExternal: true,
        error: "Connection failed.",
      });
    } finally {
      setIsVerifying(null);
    }
  };

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-black text-xl text-slate-900">
            {request.estate_name} Review
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-6 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-2"
          >
            <XCircle size={18} /> Reject
          </button>

          <button
            onClick={() => handleProcessAction("approve")}
            disabled={
              isProcessing ||
              (activeTab === "admin" &&
                request.cac_verification_status !== "verified")
            }
            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            {activeTab === "estate" ? "Approve Estate" : "Approve Admin"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Section: Info & Tabs */}
        <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="flex p-1 bg-slate-100 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab("estate")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "estate"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <Building2 size={16} /> Estate KYC
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "admin"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <User size={16} /> Admin KYC
            </button>
          </div>

          {activeTab === "estate" ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Location Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <DetailItem label="City" value={request.city} />
                <DetailItem label="Town" value={request.town} />
              </div>
              <DetailItem
                label="Registered Address"
                value={request.registered_address}
              />

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-2">
                Registration
              </h4>
              <div className="space-y-2">
                <VerifyDetailItem
                  label="CAC Number"
                  value={request.cac_number}
                  type="CAC"
                  onVerify={handleExternalVerify}
                  isLoading={isVerifying === "CAC"}
                />
                <VerifyDetailItem
                  label="TIN Number"
                  value={request.tin_number}
                  type="TIN"
                  onVerify={handleExternalVerify}
                  isLoading={isVerifying === "TIN"}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DetailItem label="Type" value={request.business_type} />
                <DetailItem
                  label="Reg. Date"
                  value={request.registration_date}
                />
              </div>

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-2">
                Settlement Account
              </h4>
              <DetailItem label="Bank" value={request.bank_name} />
              <DetailItem
                label="Account Name"
                value={request.bank_account_name}
              />
              <DetailItem
                label="Account Number"
                value={request.bank_account_number}
              />

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-4">
                Documents
              </h4>
              <DocButton
                label="CAC Certificate"
                url={request.cac_cert_url}
                onPreview={setViewingDoc}
              />
              <DocButton
                label="TIN Certificate"
                url={request.tin_cert_url}
                onPreview={setViewingDoc}
              />
              <DocButton
                label="Authorization Letter"
                url={request.authorization_letter_url}
                onPreview={setViewingDoc}
              />
              <DocButton
                label="Estate Utility Bill"
                url={request.estate_utility_url}
                onPreview={setViewingDoc}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img
                  src={request.avatar || "/api/placeholder/48/48"}
                  alt="avatar"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <p className="font-black text-slate-900 leading-tight">
                    {request.admin_name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {request.admin_email}
                  </p>
                </div>
              </div>

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-2">
                Identity Profile
              </h4>
              <div className="space-y-2">
                <VerifyDetailItem
                  label={request.identity_type || "NIN"}
                  value={request.nin_number}
                  type="NIN"
                  onVerify={handleAdminVerify}
                  isLoading={isVerifying === "NIN"}
                />
                <VerifyDetailItem
                  label="BVN Number"
                  value={request.bvn_number}
                  type="BVN"
                  onVerify={handleAdminVerify}
                  isLoading={isVerifying === "BVN"}
                />
              </div>

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-4">
                Verification Assets
              </h4>
              <DocButton
                label="Selfie"
                url={request.admin_selfie_url}
                onPreview={setViewingDoc}
              />
              <DocButton
                label="Utility Bill"
                url={request.admin_utility_url}
                onPreview={setViewingDoc}
              />

              <DocButton
                label="Digital Signature"
                url={request.signature_url}
                onPreview={setViewingDoc}
              />

              {request.liveness_snaps && (
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    Liveness Sequence
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {request.liveness_snaps.map((snap, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setViewingDoc({
                            name: `Liveness ${i + 1}`,
                            url: snap,
                          })
                        }
                        className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition-all"
                      >
                        <img
                          src={snap}
                          alt="snap"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Viewport */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center p-8 overflow-hidden">
          {viewingDoc ? (
            viewingDoc.isExternal ? (
              <VerificationResultCard
                data={viewingDoc.data}
                type={viewingDoc.name.includes("CAC") ? "CAC" : "TIN"}
                error={viewingDoc.error}
              />
            ) : (
              <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                  <span className="font-bold text-slate-700">
                    {viewingDoc.name}
                  </span>
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    className="text-indigo-600 text-sm font-bold underline"
                  >
                    Open Original
                  </a>
                </div>
                <div className="flex-1 bg-slate-200 p-4 flex items-center justify-center overflow-hidden">
                  {viewingDoc.url?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <img
                      src={viewingDoc.url}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain shadow-md rounded-lg"
                    />
                  ) : (
                    <iframe
                      src={viewingDoc.url}
                      className="w-full h-full rounded-lg"
                      title="Doc Preview"
                    />
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="text-center space-y-4 max-w-xs opacity-50">
              <Eye size={40} className="mx-auto text-slate-400" />
              <h3 className="font-bold text-slate-900">Document Preview</h3>
              <p className="text-slate-500 text-sm">
                Select a document or trigger a lookup to inspect details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Reject Registration?</h3>
            <textarea
              className="w-full border rounded-xl p-3 text-sm h-32 focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 bg-slate-50"
              placeholder="Provide a reason for the admin..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessAction("reject")}
                className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
        {label}
      </p>
      <p className="font-bold text-slate-800 break-words">
        {value || "Not Provided"}
      </p>
    </div>
  );
}

function VerifyDetailItem({ label, value, type, onVerify, isLoading }: any) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
          {label}
        </p>
        <p className="font-bold text-slate-800">{value || "N/A"}</p>
      </div>
      {value && (
        <button
          onClick={() => onVerify(type, value)}
          disabled={isLoading}
          className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-200 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>
      )}
    </div>
  );
}

function DocButton({ label, url, onPreview }: any) {
  if (!url) return null;
  return (
    <button
      onClick={() => onPreview({ name: label, url })}
      className="w-full flex items-center justify-between p-4 bg-indigo-50/50 text-indigo-700 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <FileText size={18} />
        <span className="font-bold text-sm">{label}</span>
      </div>
      <ChevronRight
        size={16}
        className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1"
      />
    </button>
  );
}
