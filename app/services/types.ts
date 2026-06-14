/* eslint-disable @typescript-eslint/no-explicit-any */

export type Role = "resident" | "admin" | "superadmin";

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  phone_verified: boolean;
  email_verified: boolean;
  role: "SUPER_ADMIN";
  wallet_balance: number;
  mfa_enabled: boolean;
  mfa_type: string;

  permissions: string[];

  is_active: boolean;
  last_login?: string;
  created_at: string;
  avatar_url?: string;
}

export interface Estate {
  id: string;
  name: string;
  estate_code: string;
  created_at: string;

  // --- Business Registration (CAC/TIN) ---
  cac_number?: string;
  tin_number?: string;
  business_type?: string; // e.g., 'INCORPORATED_TRUSTEE'
  registration_date?: string; // Date from CAC
  registered_address?: string; // Address found on CAC record

  // --- Document URLs ---
  cac_cert_url?: string;
  tin_cert_url?: string;
  estate_utility_url?: string; // Proof of Estate/Gatehouse location
  authorization_letter_url?: string; // The Board Resolution/Letter
  authorizing_body_name?: string; // e.g., "Silver Valley Residents Association"

  // --- Verification & Fintech ---
  cac_verification_status: "pending" | "active" | "invalid" | "flagged";
  paystack_subaccount_code?: string;
}

export interface VerificationRequest {
  // Estate Entity Data
  estate_id: string;
  estate_name: string;
  cac_number: string | null;
  tin_number: string | null;
  cac_cert_url: string | null;
  tin_cert_url: string | null;
  authorization_letter_url: string | null;
  authorizing_body_name: string | null;
  estate_utility_url: string | null;
  cac_verification_status: "pending" | "verified" | "rejected";
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  city: string;
  town: string;

  //possible temps
  business_type: string | null;
  registered_address: string | null;
  registration_date: string | null;

  // Admin User Data
  admin_id: string;
  admin_name: string;
  admin_email: string;
  admin_status: "unverified" | "pending" | "verified" | "rejected";
  verification_step: number;
  nin_number: string | null;
  bvn_number: string | null;
  admin_selfie_url: string | null;
  liveness_snaps: string[] | null;
  signature_url: string | null;
  identity_type: string;
  admin_utility_url: string | null;
  identiy_type: string;
  avatar: string | null;

  // Metadata
  kyc_submitted_at: string; // ISO Date string
}

// Helper type for the approval/rejection payload
export interface ReviewAction {
  adminId: string;
  estateId: string;
  status: "verified" | "rejected";
  notes?: string;
}

export enum ViewState {
  DASHBOARD = "dashboard",
  REQUESTS = "requests",
  ADD_USER = "add_user",
  ESTATES = "estates",
}

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export interface sessionResponse {
  success: boolean;
  user: User | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface BlockedUser {
  id: string;
  name: string;
  email: string;
}

export interface Invitation {
  id: string;
  guest_name: string;
  guest_image_url: string | null;
  access_code: string;
  invite_type: "one_time" | "multi_entry";
  start_date: any;
  end_date: any;
  start_time: any;
  end_time: any;
  excluded_dates: string[];
  status: string;
  actual_checkin: any;
  actual_checkout: any;
  actual_checkin_date: any;
  actual_checkout_date: any;
  created_at: string;
  is_cancelled: boolean;
}

export interface BlockedSecurityUser {
  id: string;
  name: string;
  email: string;
}

export interface ActiveEstate {
  // Core Identity
  estate_id: string;
  estate_name: string;
  estate_code: string;
  city: string;
  town: string;
  created_at: string;

  // Business Details
  cac_number: string | null;
  tin_number: string | null;
  business_type: string | null;
  registered_address: string | null;
  registration_date: string | null;
  cac_verification_status: "verified";

  // Document URLs
  cac_cert_url: string | null;
  tin_cert_url: string | null;
  estate_utility_url: string | null;
  authorization_letter_url: string | null;
  authorizing_body_name: string | null;

  // Financial Info
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_code: string | null;
  paystack_subaccount_code: string | null;
  wallet_balance: number | string;

  // Stats
  tenant_count: number | string;

  // Admin Context
  admin_id: string;
  admin_name: string;
  admin_email: string;
  admin_status: string;
}

export interface PermissionNode {
  id: string;
  name: string;
  parent_permission: string | null;
}

export interface CustomRoleMapping {
  id: number;
  role_name: string;
  description?: string;
  permission_ids: string[];
}

// 📝 Interface structure matching your database return schema
export interface UserLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action_type: string;
  target_resource: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}


export interface SuperAdminUser {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  mfa_enabled: boolean;
  mfa_type: "NONE" | "EMAIL" | "TOTP" | "SMS";
  sub_account: boolean;
  permissions: string[];
  phone_verified: boolean;
  email_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface FetchAdminsResponse {
  success: boolean;
  count?: number;
  users?: SuperAdminUser[];
  message?: string;
}
