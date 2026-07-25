/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuditLogEntry,
  BillingAnalyticsResponse,
  DashboardAnalyticsPayload,
  EstateDetailsResponse,
  EstatesDirectoryResponse,
  ExtensionResponse,
  SecurityUser,
  SubscriptionPricing,
  SubscriptionsResponse,
  UpdatePricingResponse,
} from "./types";

export async function getEstatesDashboard(): Promise<EstatesDirectoryResponse> {
  const res = await fetch("/api/master/estates/estates-directory", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("HTTP error polling multi-tenant organizational directory");
  }

  const data: EstatesDirectoryResponse = await res.json();
  console.log("Received estates organizational directory metrics:", data);
  return data;
}

export async function getEstateDetailsContext(
  estateId: string,
): Promise<EstateDetailsResponse> {
  const res = await fetch(`/api/master/estates/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ estateId }),
  });

  if (!res.ok) {
    throw new Error(
      "HTTP error polling detailed estate operational parameters.",
    );
  }

  const data: EstateDetailsResponse = await res.json();
  console.log(
    `Received deep instrumentation dataset for structural node [${estateId}]:`,
    data,
  );
  return data;
}

export const communityApi = {
  getPosts: async (estateId: string) => {
    // console.log("Fetching post:", estateId)
    try {
      const response = await fetch(
        `/api/community/admin-posts?estate_id=${estateId}`,
        { credentials: "include" },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("Posts data:", data);
      return data;
    } catch (error) {
      console.error("getPosts Error:", error);
      return []; // Return empty array so the app doesn't crash
    }
  },
  archivePost: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("archivePost Service Error:", error);
      throw error;
    }
  },

  deletePost: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("deletePost Error:", error);
      throw error; // Throw so the UI can catch it and show an alert
    }
  },

  getLikes: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/likes/${postId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("getLikes Error:", error);
      return []; // Return empty array to keep UI stable
    }
  },

  getComments: async (postId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${postId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("getComments Error:", error);
      return []; // Return empty array to prevent .map() crashes in the modal
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      return await response.json();
    } catch (error) {
      console.error("deleteComment Error:", error);
      throw error;
    }
  },

  sendDirectNotification: async (payload: {
    title: string;
    message: string;
    targets: { residents: boolean; security: boolean };
    type: string;
  }) => {
    try {
      const response = await fetch("/api/community/send-direct-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Broadcast failed");
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export const securityDb = {
  // 5. Fetch all blocked security guards
  fetchBlockedGuards: async () => {
    const res = await fetch("/api/security/blocked-users", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch blocked guards");
    const data = await res.json();
    return data.blockedUsers;
  },

  // 7. Fetch all official security guards in the estate
  getAllSecurity: async (id: string): Promise<SecurityUser[]> => {
    const res = await fetch("/api/master/estates/security/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estateId: id }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Could not fetch security list");
    }
    const data = await res.json();
    return data.securityGuards as SecurityUser[];
  },

  // 8. Delete/Offboard an official security guard
  deleteSecurity: async (id: string) => {
    const res = await fetch(`/api/security/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete failed");
    }
    return await res.json();
  },

  // 9. Fetch security duty logs (Check-in/Check-out history)
  // getSecurityLogs: async (): Promise<SecurityLog[]> => {
  //   const res = await fetch('/api/security/logs', {
  //     credentials: "include",
  //   });
  //   if (!res.ok) {
  //     const err = await res.json();
  //     throw new Error(err.error || "Could not fetch duty logs");
  //   }
  //   const data = await res.json();
  //   return data.logs as SecurityLog[];
  // },
};

/**
 * Toggles or updates the active production access clearance matrix of a regional estate system administrator
 */
export async function updateEstateAdminStatus(
  adminId: string,
  status: "ACTIVE" | "SUSPENDED",
): Promise<{ success: boolean; message: string; admin?: any }> {
  try {
    // Replace URL paths with whatever pattern matches your base setup config block
    const response = await fetch("/api/master/estates/update-admin-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminId, status }),
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "Failed to commit admin security clearance context mutation:",
      error,
    );
    return {
      success: false,
      message:
        "Network request interface runtime failure processing transaction.",
    };
  }
}

/**
 * Alternates the global routing state of an entire estate development cluster map
 */
export async function updateEstateStatus(
  estateId: string,
  status: "ACTIVE" | "SUSPENDED",
): Promise<{ success: boolean; message: string; estate?: any }> {
  try {
    const response = await fetch("/api/master/estates/update-estate-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estateId, status }),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network interface error updating cluster status bounds:",
      error,
    );
    return {
      success: false,
      message: "Infrastructure request lifecycle timeout error.",
    };
  }
}

/**
 * Destroys all transactional relational database lines tied to an estate node
 */
export async function deleteEstateAccount(
  estateId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/master/estates/purge-estate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estateId }),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network runtime fault emitting critical execution vector flags:",
      error,
    );
    return {
      success: false,
      message: "Network route engine error completing operational workflow.",
    };
  }
}
export async function getDashboardAnalytics(): Promise<DashboardAnalyticsPayload> {
  try {
    const response = await fetch("/api/master/estates/dashboard-analytics", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "Failed to retrieve global superadmin analytics telemetry matrix:",
      error,
    );
    return {
      success: false,
      superAdminStats: {
        total: 0,
        subAccounts: 0,
        mainAccounts: 0,
        liveAdmins: 0,
        pendingRequests: 0,
      },
      permissionDistribution: { chartMap: {}, totalAllocatedTokens: 0 },
      ecosystemStats: {
        totalEstates: 0,
        totalResidents: 0,
        activeResidents30m: 0,
        totalGuards: 0,
        activeGuards30m: 0,
      },
      estatesList: [],
      message: "Infrastructure telemetry retrieval lifecycle runtime failure.",
    };
  }
}

export async function fetchSpecifiedLogs(
  id: string,
): Promise<{ success: boolean; data: AuditLogEntry[] }> {
  try {
    const response = await fetch("/api/master/estates/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network runtime fault emitting critical execution vector flags:",
      error,
    );
    return { success: false, data: [] };
  }
}

export async function fetchAllLogs(
  estate_id: string,
  role: string,
): Promise<{ success: boolean; data: AuditLogEntry[] }> {
  try {
    const response = await fetch("/api/master/estates/all-audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estate_id, role }),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network runtime fault emitting critical execution vector flags:",
      error,
    );
    return { success: false, data: [] };
  }
}

export async function fetchUniversalLogs(): Promise<{
  success: boolean;
  data: AuditLogEntry[];
}> {
  try {
    const response = await fetch("/api/master/estates/overall-audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network runtime fault emitting critical execution vector flags:",
      error,
    );
    return { success: false, data: [] };
  }
}

export async function fetchSectionLogs(
  estate_id: string,
): Promise<{ success: boolean; data: AuditLogEntry[] }> {
  try {
    const response = await fetch("/api/master/estates/section-audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estate_id }),
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network runtime fault emitting critical execution vector flags:",
      error,
    );
    return { success: false, data: [] };
  }
}

export const billingApi = {
  // ─── 1. FETCH AGGREGATED BILLING ANALYTICS & PRICING ───
  getAnalytics: async (): Promise<BillingAnalyticsResponse> => {
    try {
      const res = await fetch("/api/billing/analytics", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: BillingAnalyticsResponse = await res.json();
      console.log("Received billing analytics telemetry:", data);
      return data;
    } catch (error) {
      console.error("getAnalytics Error:", error);
      throw error;
    }
  },

  // ─── 2. FETCH ALL ESTATE SUBSCRIPTIONS & LEDGER ───
  getSubscriptions: async (): Promise<SubscriptionsResponse> => {
    try {
      const res = await fetch("/api/billing/subscriptions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: SubscriptionsResponse = await res.json();
      console.log("Received estate subscriptions ledger dataset:", data);
      return data;
    } catch (error) {
      console.error("getSubscriptions Error:", error);
      throw error;
    }
  },

  // ─── 3. UPDATE GLOBAL SUBSCRIPTION PRICING MATRIX ───
  updatePricingConfig: async (
    pricing: SubscriptionPricing,
  ): Promise<UpdatePricingResponse> => {
    try {
      const res = await fetch("/api/billing/pricing-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(pricing),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`,
        );
      }

      const data: UpdatePricingResponse = await res.json();
      console.log("Successfully updated global plan pricing matrix:", data);
      return data;
    } catch (error) {
      console.error("updatePricingConfig Error:", error);
      throw error;
    }
  },

  // ─── 4. MANUAL SUBSCRIPTION EXTENSION / RENEWAL ───
  extendSubscription: async (
    estateId: string,
    durationMonths: number,
  ): Promise<ExtensionResponse> => {
    try {
      const res = await fetch("/api/billing/manual-renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          estate_id: estateId,
          duration_months: durationMonths,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`,
        );
      }

      const data: ExtensionResponse = await res.json();
      console.log(
        `Successfully extended subscription for estate [${estateId}]:`,
        data,
      );
      return data;
    } catch (error) {
      console.error("extendSubscription Error:", error);
      throw error;
    }
  },
};