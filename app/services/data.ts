import { PermissionNode } from "./types";

export const SYSTEM_PERMISSIONS: PermissionNode[] = [
  {
    id: "all-access",
    name: "Full Administrative Access",
    parent_permission: null,
  },
  {
    id: "users_management",
    name: "Users Management (Root)",
    parent_permission: null,
  },
  {
    id: "view_users",
    name: "View Users List",
    parent_permission: "users_management",
  },
  {
    id: "add_user",
    name: "Add New Users",
    parent_permission: "users_management",
  },
  {
    id: "modify_users_status",
    name: "Modify: Suspend & Enable Status",
    parent_permission: "users_management",
  },
  {
    id: "modify_user_permissions",
    name: "Modify Permissions",
    parent_permission: "users_management",
  },
  {
    id: "modify_users_pass",
    name: "Modify: Push Password Reset",
    parent_permission: "users_management",
  },
  {
    id: "modify_users_mfa",
    name: "Modify: Overrule MFA Settings",
    parent_permission: "users_management",
  },
  {
    id: "delete_user",
    name: "Delete User Profiles",
    parent_permission: "users_management",
  },
  {
    id: "logs_management",
    name: "Logs & Security Audits (Root)",
    parent_permission: null,
  },
  {
    id: "view_user_logs",
    name: "View User Activity Logs",
    parent_permission: "logs_management",
  },
  {
    id: "download_user_logs",
    name: "Export & Download Forensic Audit Trails",
    parent_permission: "logs_management",
  },
  {
    id: "security_infrastructure",
    name: "Security Infrastructure (Root)",
    parent_permission: null,
  },
  {
    id: "view_security_perimeter",
    name: "View & Manage Network Perimeter",
    parent_permission: "security_infrastructure",
  },
  {
    id: "view_security_policies",
    name: "View & Configure System Policies",
    parent_permission: "security_infrastructure",
  },
  {
    id: "view_security_incidents",
    name: "View & Triage Security Incidents",
    parent_permission: "security_infrastructure",
  },
  {
    id: "change_ip_status",
    name: "Blacklist & Whitelist Target IP Nodes",
    parent_permission: "security_infrastructure",
  },
  {
    id: "add_firewall_rule",
    name: "Create Static Firewall Vector Rules",
    parent_permission: "security_infrastructure",
  },
  {
    id: "delete_firewall_rule",
    name: "Purge & Delete Firewall Rules",
    parent_permission: "security_infrastructure",
  },
  {
    id: "edit_system_policies",
    name: "Modify & Commit Global System Policies",
    parent_permission: "security_infrastructure",
  },
];
