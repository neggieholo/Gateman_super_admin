"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldX,
  ShieldCheck,
  Activity,
  Clock,
  SlidersHorizontal,
  Plus,
  MapPin,
  Laptop,
  Trash2,
  Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchReadableAddress } from "../services/apis";
import {
  getNetworkStatusMatrices,
  getFirewallRules,
  approvePendingIp,
  blacklistTargetIp,
  addManualFirewallRule,
  deleteFirewallRule,
} from "../services/apis_sec";
import { NetworkNode, RuleNode } from "../services/types";
import SecurityActionWarningModal from "./SecurityActionWarningModal";

// 🎯 FIXED INTEGRATED RESOLVER COMPONENT (Rules of Hooks Compliant)
const LocationCell = ({ rawLocation }: { rawLocation: string }) => {
  const [address, setAddress] = useState<string>("Resolving...");

  useEffect(() => {
    const setLocation = () => {
      if (!rawLocation) {
        setAddress("Unknown Location");
        return;
      }

      if (!rawLocation.trim().startsWith("{")) {
        setAddress(rawLocation);
        return;
      }

      fetchReadableAddress(rawLocation)
        .then((resolvedString) => setAddress(resolvedString))
        .catch(() => setAddress("Lookup Error"));
    };

    setLocation();
  }, [rawLocation]);

  return <span className="truncate max-w-50 block">{address}</span>;
};

type SubTabVariant = "live" | "pending" | "rules";

export default function NetworkPerimeterPage() {
  const [subTab, setSubTab] = useState<SubTabVariant>("live");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [liveConnections, setLiveConnections] = useState<NetworkNode[]>([]);
  const [pendingRequests, setPendingRequests] = useState<NetworkNode[]>([]);
  const [firewallRules, setFirewallRules] = useState<RuleNode[]>([]);

  const [manualIp, setManualIp] = useState("");
  const [ruleType, setRuleType] = useState<"ALLOW" | "DENY">("ALLOW");
  const [ruleLabel, setRuleLabel] = useState("");
  const [activeTargetIp, setActiveTargetIp] = useState<string>("");
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningConfig, setWarningConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    variant: "warning" | "danger";
    onConfirm: () => Promise<void> | void;
  }>({
    title: "",
    message: "",
    confirmText: "",
    variant: "warning",
    onConfirm: () => {},
  });

  const fetchNetworkPerimeterData = useCallback(async () => {
    try {
      const [sessionsData, rulesData] = await Promise.all([
        getNetworkStatusMatrices(),
        getFirewallRules(),
      ]);

      if (sessionsData.success && rulesData.success) {
        setLiveConnections(sessionsData.liveConnections);
        setPendingRequests(sessionsData.pendingRequests);
        setFirewallRules(rulesData.rules);
      } else {
        toast.error(
          "Failed to parse administrative operational matrix snapshots.",
        );
      }
    } catch (err) {
      console.error("Network perimeter initialization failure:", err);
      toast.error(
        "Network communication failure re-hydrating perimeter states.",
      );
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworkPerimeterData();
  }, [fetchNetworkPerimeterData]);

  const handleApproveIp = async (targetAdminId: string, targetIp: string) => {
    setActionLoading(true);
    try {
      const data = await approvePendingIp(targetAdminId, targetIp);
      if (data.success) {
        toast.success(
          `Network authorization vector compiled! IP ${targetIp} is whitelisted.`,
        );
        await fetchNetworkPerimeterData();
      } else {
        toast.error(
          data.message || "Failed to commit perimeter gate alterations.",
        );
      }
    } catch (err) {
      toast.error("Execution error whitelisting targeted node endpoint.");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerBlackListWarning = (targetIp: string) => {
    setActiveTargetIp(targetIp);
    setWarningConfig({
      title: "Blacklist IP",
      message: `Are you certain you want to terminate this administrative session and drop traffic from IP ${targetIp} permanently?`,
      confirmText: "Block IP",
      variant: "warning",
      onConfirm: async () => {
        await handleRevokeAndBlacklist();
      },
    });
    setIsWarningOpen(true);
  };

  const handleRevokeAndBlacklist = async () => {
    setActionLoading(true);
    try {
      const data = await blacklistTargetIp(activeTargetIp);
      if (data.success) {
        toast.error(
          `Handshake severed cleanly. IP ${activeTargetIp} added to database blacklist.`,
          { icon: "🛑" },
        );
        await fetchNetworkPerimeterData();
      } else {
        toast.error(
          data.message || "Failed to finalize connection dropping protocol.",
        );
      }
    } catch (err) {
      toast.error("Internal processing exception blacklisting server node.");
    } finally {
      setActionLoading(false);
      setActiveTargetIp("")
      setIsWarningOpen(false);
    }
  };

  const handleAddManualRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) return;

    setActionLoading(true);
    try {
      const data = await addManualFirewallRule(
        manualIp.trim(),
        ruleType,
        ruleLabel || "Manual Static Assignment",
      );
      if (data.success) {
        toast.success(`Static guard policy deployed cleanly for ${manualIp}`);
        setManualIp("");
        setRuleLabel("");
        setIsModalOpen(false);
        await fetchNetworkPerimeterData();
      } else {
        toast.error(
          data.message || "Rule compilation rejected by core parser.",
        );
      }
    } catch (err) {
      toast.error("Network communication loss posting rule arrays.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string, networkVector: string) => {
    if (
      !confirm(
        `Remove protective restriction rule layout configuration for ${networkVector}?`,
      )
    )
      return;

    try {
      const data = await deleteFirewallRule(ruleId);
      if (data.success) {
        toast.success(`Rule constraints dropped cleanly for ${networkVector}.`);
        await fetchNetworkPerimeterData();
      } else {
        toast.error(
          data.message ||
            "Failed to drop directive parameters from schema mapping.",
        );
      }
    } catch (err) {
      toast.error("Exception handling script dropping firewall rows.");
    }
  };

  if (globalLoading) {
    return (
      <div className="p-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        Polling Core Network Infrastructure Perimeters...
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 animate-in fade-in duration-200 ${actionLoading ? "pointer-events-none opacity-60" : ""}`}
    >
      {/* 📊 SUMMARY METRICS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Live Links
            </p>
            <h3 className="text-xl font-bold font-oswald text-slate-800">
              {liveConnections.length} Active
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div
            className={`p-3 rounded-xl ${pendingRequests.length > 0 ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-slate-50 text-slate-400"}`}
          >
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Pending Perimeter Approvals
            </p>
            <h3 className="text-xl font-bold font-oswald text-slate-800">
              {pendingRequests.length} Awaiting
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Active Guard Policies
            </p>
            <h3 className="text-xl font-bold font-oswald text-slate-800">
              {firewallRules.length} Vector Rules
            </h3>
          </div>
        </div>
      </div>

      {/* 🛠️ SUB-NAV CONTROLLER SWITCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit border">
          <button
            onClick={() => setSubTab("live")}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${subTab === "live" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Live Connections ({liveConnections.length})
          </button>
          <button
            onClick={() => setSubTab("pending")}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${subTab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setSubTab("rules")}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${subTab === "rules" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Firewall Rules Matrix ({firewallRules.length})
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow hover:bg-slate-800 transition-all self-end sm:self-auto"
        >
          <Plus size={14} /> Add Network Rule
        </button>
      </div>

      {/* ─── DATA GRID RENDERING ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {subTab === "live" && (
          <div className="overflow-x-auto">
            {liveConnections.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium text-sm">
                No live connections established on workstation nodes.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Administrative User</th>
                    <th className="p-4">IP Footprint</th>
                    <th className="p-4">Geographic Context</th>
                    <th className="p-4">Device Runtime Signature</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {liveConnections.map((conn) => (
                    <tr
                      key={conn.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {conn.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {conn.email}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-slate-600 bg-slate-50/50 px-2 rounded-md border border-slate-100">
                        {conn.ip}
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <LocationCell rawLocation={conn.location} />
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Laptop size={13} className="text-slate-400" />
                          {conn.device}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => triggerBlackListWarning(conn.ip)}
                          className="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all uppercase tracking-wider"
                        >
                          Revoke & Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {subTab === "pending" && (
          <div className="overflow-x-auto">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium text-sm">
                🎉 Perimeter secure. No administrative subaccounts are throttled
                in the roadblock gate.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Subaccount Profile</th>
                    <th className="p-4">Inbound Untrusted IP</th>
                    <th className="p-4">Location Target</th>
                    <th className="p-4">Device Info</th>
                    <th className="p-4 text-right">Action Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pendingRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-amber-50/20 bg-amber-50/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {req.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {req.email}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-amber-700 bg-amber-50/50 px-2 rounded-md border border-amber-100/50">
                        {req.ip}
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Globe size={13} className="text-slate-400" />
                          <LocationCell rawLocation={req.location} />
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {req.device}
                      </td>
                      <td className="p-4 text-right flex gap-3 justify-end">
                        <button
                          onClick={() => handleApproveIp(req.id, req.ip)}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all uppercase tracking-wider"
                        >
                          Approve & Whitelist
                        </button>
                        <button
                          onClick={() => triggerBlackListWarning(req.ip)}
                          className="px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all uppercase tracking-wider"
                        >
                          Revoke & Blacklist
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {subTab === "rules" && (
          <div className="overflow-x-auto">
            {firewallRules.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium text-sm">
                No security rules compiled inside database schema entries.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Target Network / CIDR Block</th>
                    <th className="p-4">Enforcement Policy</th>
                    <th className="p-4">Description Label</th>
                    <th className="p-4">Authorized By</th>
                    <th className="p-4 text-right">Purge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {firewallRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs font-bold text-slate-700">
                        {rule.network}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${rule.type === "ALLOW" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                        >
                          {rule.type === "ALLOW" ? (
                            <ShieldCheck size={10} />
                          ) : (
                            <ShieldX size={10} />
                          )}
                          {rule.type === "ALLOW" ? "Whitelist" : "Blacklist"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-medium">
                        {rule.label}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {rule.addedBy}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() =>
                            handleDeleteRule(rule.id, rule.network)
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL DIALOG ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-oswald font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <SlidersHorizontal size={16} /> Compile Network Rule
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddManualRule} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  IP Target / CIDR Range
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 102.89.34.118 or 197.210.0.0/16"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  className="w-full text-sm font-mono border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  Behavior Strategy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleType("ALLOW")}
                    className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${ruleType === "ALLOW" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"}`}
                  >
                    <ShieldCheck size={14} /> Whitelist
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleType("DENY")}
                    className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${ruleType === "DENY" ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"}`}
                  >
                    <ShieldX size={14} /> Blacklist
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                  Reference Context Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lagos Mainland Ops Hub Block"
                  value={ruleLabel}
                  onChange={(e) => setRuleLabel(e.target.value)}
                  className="w-full text-sm font-sans border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider shadow"
                >
                  Save Vector Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SecurityActionWarningModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title={warningConfig.title}
        message={warningConfig.message}
        confirmText={warningConfig.confirmText}
        variant={warningConfig.variant}
        onConfirm={warningConfig.onConfirm}
      />
    </div>
  );
}
