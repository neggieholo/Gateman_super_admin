/* eslint-disable @typescript-eslint/no-explicit-any */
import {
} from "./types";

// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const db = {
  // Authenticate Super Admin
  authenticate: async (
    email: string,
    password: string,
    name: string,
  ) => {
    try {
      const res = await fetch("/api/auth/login/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Added 'name' as the required signature
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Super Admin login failed");
      }

      const data = await res.json();
      return data; // returns { success: true, user: { ... }, sessionId: "..." }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Server error",
      };
    }
  },
  // Register a new Super Admin (Staff/Assistant)
  registerSuperAdmin: async (
    fullName: string,
    email: string,
    password: string,
    permissions: {
      all_access?: boolean;
      manage_estates?: boolean;
      manage_finances?: boolean;
      view_audit_logs?: boolean;
    },
  ) => {
    try {
      const res = await fetch("/api/auth/register/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          permissions,
        }),
        credentials: "include", // Required because only a logged-in Super Admin can hit this
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create Super Admin");
      }

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Registration error",
      };
    }
  },

  getAllTenants: async (): Promise<any[]> => {
    const res = await fetch("/api/admin/tenants", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch tenants");
    }
    const data = await res.json();
    return data.tenants as any[];
  },

  // Fetch all join requests (admin-only)
  getAllRequests: async (): Promise<any[]> => {
    const res = await fetch("/api/admin/join-requests", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch join requests");
    }
    const data = await res.json();
    console.log("Request:", data);
    return data.joinRequests as any[];
  },

  deleteTenant: async (id: string) => {
    const res = await fetch("/api/admin/tenant/${id}", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete failed");
    }
    return await res.json();
  },

  fetchBlocked: async () => {
    const res = await fetch("/api/admin/blocked-users", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch blocked users");
    const data = await res.json();
    return data.blockedUsers;
  },

  handleUnblock: async (tempTenantId: string) => {
    const res = await fetch("/api/admin/join-request/unblock", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempTenantId }),
    });
    if (!res.ok) throw new Error("Failed to unblock user");
    return await res.json();
  },

  forgotPassword: async (
    email: string,
    role: "admin" | "tenant" | "superadmin",
  ) => {
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      return await response.json();
    } catch (error) {
      console.error("Forgot Password Service Error:", error);
      return { success: false, message: "Network error" };
    }
  },

  resetPassword: async (
    token: string,
    userId: string,
    role: string,
    password: string,
  ) => {
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId, role, password }),
      });
      return await response.json();
    } catch (error) {
      console.error("Reset Password Service Error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    }
  },
};
