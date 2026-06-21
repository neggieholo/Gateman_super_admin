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

  payment_type: string;
  external_api_url: string;

  bank_account_number?: string;
  bank_code?: string;
  bank_account_name?: string;
  bank_name?: string;
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
  SECURITY = "security",
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

export interface LocationPair {
  block: string;
  unit: string[];
}

// export interface Invitation {
//   id: string;
//   guest_name: string;
//   guest_phone: string;
//   guest_image_url: string | null;
//   access_code: string;
//   invite_type: "one_time" | "multi_entry" | "staff_entry";
//   start_date: any;
//   end_date: any;
//   start_time: any;
//   end_time: any;
//   excluded_dates: string[];
//   status: string;
//   actual_checkin: any;
//   actual_checkout: any;
//   actual_checkin_date: any;
//   actual_checkout_date: any;
//   created_at: string;
//   is_cancelled: boolean;
//   resident_name?: string;
//   locations: {
//     [estateId: string]: LocationPair[];
//   };
//   estate_name?: string;
//   estate_address?: string;
//   lga?: string;
//   town?: string;
//   staff_position?: string;
//   permitted_days: number[];
//   is_activated?: boolean;
// }

export interface Invitation {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_image_url?: string;
  access_code: string;
  status: "pending" | "checked_in" | "checked_out" | "overstayed";
  invite_type: "one_time" | "multi_entry" | "staff_entry";
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  actual_checkin_date?: string;
  actual_checkout_date?: string;
  is_cancelled: boolean;
  excluded_dates?: string[];
  // Joined Fields
  resident_name?: string;
  locations: {
    [estateId: string]: LocationPair[];
  };
  estate_name?: string;
  estate_address?: string;
  lga?: string;
  town?: string;
  staff_position?: string;
  permitted_days: number[];
  is_activated?: boolean;
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

export interface NetworkNode {
  id: string;
  name: string;
  email: string;
  ip: string;
  location: string;
  device: string;
}

export interface RuleNode {
  id: string;
  network: string;
  type: "ALLOW" | "DENY";
  label: string;
  addedBy: string;
}

export interface MatrixResponse {
  success: boolean;
  liveConnections: NetworkNode[];
  pendingRequests: NetworkNode[];
  message?: string;
}

export interface RulesResponse {
  success: boolean;
  rules: RuleNode[];
  message?: string;
}

export interface StandardActionResponse {
  success: boolean;
  message?: string;
}

// ../services/types.ts

export interface SystemPolicySettings {
  sessionTimeoutMinutes: number;
  rememberMeDurationDays: number;
  absoluteTimeoutHours: number;
  pwdMinLength: number;
  pwdRequireUppercase: boolean;
  pwdRequireLowercase: boolean;
  pwdRequireNumbers: boolean;
  pwdRequireSymbols: boolean;
  pwdPreventReuseCount: number;
  pwdExpiryDays: number;
  maxLoginAttemptsBeforeLockout: number;
  lockoutDurationMinutes: number;
  requireMfaForSubaccounts: boolean;
  enforceActionAcceptanceBeforeLogin: boolean;
  updatedAt?: string;
}

export interface FetchPoliciesResponse {
  success: boolean;
  policies?: SystemPolicySettings;
  message?: string;
}

export interface UpdatePoliciesResponse {
  success: boolean;
  message: string;
}

// --- Interface Contracts matching your exact schema layout ---
export interface DashboardEstateNode {
  id: string;
  name: string;
  estate_code: string;
  lga: string;
  state: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  joined_date: string;
  total_residents: number;
  active_residents_30_days: number;
  total_guards: number;
  guards_on_duty: number;
}

export interface EstatesDirectoryResponse {
  success: boolean;
  count: number;
  estates: DashboardEstateNode[];
}

export interface EstateDetailedContext extends DashboardEstateNode {
  gatepasses: any[];
  posts: any[];
  events: any[];
  reports: any[];
  locations: any[];
  services: any[];
  vendors: Vendor[];
  service_requests: any[];
  admin: any;
  estate: any;
}

export interface EstateDetailsResponse {
  success: boolean;
  estate: EstateDetailedContext;
}

export interface EmergencyContact {
  id: number; // or string, depending on Date.now() or UUID
  name: string;
  phone: string;
}

export interface AdminUser {
  id: string;
  estate_id: string;
  estate_name?: string;
  name: string;
  email: string;
  phone_number: string;
  role: "admin";
  avatar?: string | Blob;
  subscription_expiry?: string;
  last_activity_at: string;
  created_at?: string;

  admin_selfie_url?: string;

  profile_image_url?: string;

  admin_role?: string;
  residential_address?: string;
  consent_given: boolean;
  consent_timestamp?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

export interface Post {
  id: string;
  estate_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  created_at: string;
  admin_seen: boolean;
  is_archived: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  user_type: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Like {
  user_id: string;
  author_name: string;
  created_at: string;
}

export type ReportType = "GENERAL" | "SECURITY" | "PAYMENT" | "SERVICES";
export type ReportCategory = "COMPLAINT" | "INFORMATION" | "EMERGENCY";
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED";

export interface EstateReport {
  id: string;
  estate_id: string;
  reporter_id: string;
  reporter_name?: string; // From the JOIN
  type: ReportType;
  category: ReportCategory;
  target_security_ids: string[];
  subject: string;
  description: string;
  status: ReportStatus;
  linked_payment_id?: string;
  admin_response?: string;
  responded_at?: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  estate_id: string;
  service_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface EstateService {
  id: string;
  estate_id: string;
  service_name: string;
  vendors: Vendor[];
  is_available: boolean;
  created_at: string;
}


export interface ServiceRequest {
  id: string;
  estate_id: string;
  service_id: string | null;
  resident_id: string;
  resident_name: string;
  resident_unit: string;
  time_preferred: string;
  description: string | null;
  is_dispatched: boolean | null;
  is_completed: boolean | null;
  requested_at: string | null;
  dispatched_vendors: string[] | null;
}
export interface EventRegistration {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_code: string; // The "GUEST-XXXX" code for the gate guard
  status: "registered" | "checked_in";
  checked_in_at: string | null;
  created_at: string;
}


export interface EstateEvent {
  id: string;
  estate_id: string;
  organizer_id: string | null;
  title: string;
  description: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  venue_type: string | null;
  venue_detail: string | null; 
  expected_guests: number | null;
  banner_url: string | null;
  is_paid: boolean | null;
  ticket_price: number | string | null;
  subaccount_id: string | null;
  ref_code: string;
  is_approved: boolean | null;
  is_rejected: boolean | null;
  created_at: string | null;
  bank_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  registered_guests: number;
  booked_dates: string[]; // ARRAY of date strings
}

export interface EstateLocation {
  id: number;
  estate_id: string;
  name: string;
  location_in_estate: string | null;
  permitted_days: number[];
  event_booked_on: Record<
    string,
    {
      event_banner_url: string;
      dates: string[];
    }
  >;
  capacity?: number;
  created_at: string;
}

export interface SecurityUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  estate_id: string;
  push_token?: string;
  is_on_duty: boolean;
  last_checkin?: string;
  last_checkout?: string;
  checkin_location?: string;
  checkout_location?: string;
  last_known_location?: string;
  last_location_time?: string;
  role: "SECURITY";
  id_type?: string;
  id_front_url?: string;
  id_back_url?: string;
}