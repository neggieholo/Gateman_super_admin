/* eslint-disable @typescript-eslint/no-explicit-any */

import { MatrixResponse, RulesResponse, StandardActionResponse } from "./types";

// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

/**
 * 🔄 Fetches live operational connection matrices and pending requests
 */
export async function getNetworkStatusMatrices(): Promise<MatrixResponse> {
  const res = await fetch("/api/master/security/network-status-matrices", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("HTTP error polling network status matrices");
  const data = await res.json();
  console.log("Received network status matrices response:", data);
  return data;
}

/**
 * 📜 Fetches the master ledger of firewall whitelists and blacklists
 */
export async function getFirewallRules(): Promise<RulesResponse> {
  const res = await fetch("/api/master/security/firewall-rules", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("HTTP error polling firewall rules schema");
  const data = await res.json();
  console.log("Received firewall rules response:", data);
  return data;
}

/**
 * 🟢 Approves a pending administrative request and whitelists the target IP
 */
export async function approvePendingIp(
  adminId: string,
  ipAddress: string,
): Promise<StandardActionResponse> {
  console.log(`Attempting to approve IP ${ipAddress} for Admin ID: ${adminId}`);
  const res = await fetch("/api/master/security/approve-ip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId, ipAddress }),
    credentials: "include",
  });
  if (!res.ok)
    throw new Error("HTTP error processing pending authorization execution");
  return res.json();
}

/**
 * 🔴 Termunates an active session and registers a permanent blacklist DENY rule
 */
export async function blacklistTargetIp(
  ipToBan: string,
  adminId: string,
): Promise<StandardActionResponse> {
  const res = await fetch("/api/master/security/blacklist-ip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ipToBan, adminId }),
    credentials: "include",
  });
  if (!res.ok)
    throw new Error("HTTP error processing blacklist enforcement command");
  return res.json();
}

/**
 * ➕ Manually compiles and injects a static firewall rule vector
 */
export async function addManualFirewallRule(
  ipOrCidr: string,
  ruleType: "ALLOW" | "DENY",
  label: string,
): Promise<StandardActionResponse> {
  const res = await fetch("/api/master/security/add-manual-rule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ipOrCidr, ruleType, label }),
    credentials: "include",
  });
  if (!res.ok)
    throw new Error("HTTP error executing manual rule compilation pipeline");
  return res.json();
}

/**
 * 🗑️ Purges a restriction parameters record row by its UUID identifier
 */
export async function deleteFirewallRule(
  ruleId: string,
): Promise<StandardActionResponse> {
  const res = await fetch(`/api/master/security/firewall-rules/${ruleId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok)
    throw new Error("HTTP error deploying firewall rule dropping logic");
  return res.json();
}
