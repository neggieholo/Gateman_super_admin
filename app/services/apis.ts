/* eslint-disable @typescript-eslint/no-explicit-any */
import { FetchAdminsResponse, sessionResponse } from "./types";
import { parseISO, formatDistanceToNow } from "date-fns";

// const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const checkSession = async (): Promise<sessionResponse> => {
  try {
    const response = await fetch("/api/session-check", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Session Check Error:", error);
    return { success: false, user: null };
  }
};

export const postLogout = async () => {
  const res = await fetch("/api/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const data = await res.json();

  return data;
};

export const sendOtpApi = async (email: string) => {
  try {
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    console.log("OTP error:", err);
    return { success: false, message: "Network error" };
  }
};

export const sendPofileChangeOtpApi = async (target: string, type: string) => {
  try {
    const res = await fetch("/api/master/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, type }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  role: string,
) => {
  try {
    const response = await fetch("/api/master/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, role }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

export const fetchReadableAddress = async (locationData: string) => {
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    // 1. Check if the string actually looks like JSON
    if (locationData.trim().startsWith("{")) {
      const parsed = JSON.parse(locationData);
      lat = parsed.latitude;
      lng = parsed.longitude;
    } else {
      // 2. Otherwise, treat it as a "lat, lng" string
      const parts = locationData.split(",");
      if (parts.length >= 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
    }

    // 3. If we couldn't find valid numbers, exit early
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      console.warn("Could not extract numbers from:", locationData);
      return locationData;
    }

    // 4. Call your PHP service
    const url = `https://geo.employeetracker.app/reverse.php?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    return (
      data.display_name ||
      data.address ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    );
  } catch (error) {
    console.error("❌ Error fetching address:", error);
    return locationData; // Return the raw coordinates if anything fails
  }
};

export const getCloudinaryUrl = async (
  file: File, // Pass the native Browser File object directly here instead of a string URI
  selectionType: "image" | "audio" | "video" | "document",
) => {
  console.log("uploading into cloudinary");
  try {
    if (!file) {
      console.error("No file provided for upload.");
      return null;
    }
    console.log("uploading into cloudinary:", file);

    const fileSize = file.size;
    const MAX_SIZE = 50 * 1024 * 1024;

    if (fileSize > MAX_SIZE) {
      alert("File too large. Max limit is 50MB.");
      return null;
    }

    const formData = new FormData();

    // 2. Resource Type Logic
    let cloudinaryType = "image";

    if (selectionType === "audio" || selectionType === "video") {
      cloudinaryType = "video"; // Cloudinary treats audio as a video resource type
    } else if (selectionType === "document") {
      cloudinaryType = "raw";
    }

    // Standard web browsers natively know how to read and stream the File object via FormData
    formData.append("file", file);
    formData.append("upload_preset", "gateman uploads");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/diubaoqcr/${cloudinaryType}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();

    if (data.error) {
      console.error("Cloudinary Error:", data.error.message);
      return null;
    }
    console.log("Cloudinary Url", data.secure_url);

    return data.secure_url;
  } catch (err) {
    console.error("Upload Logic Error:", err);
    return null;
  }
};

export const formatLastSeen = (timestamp: string | null) => {
  if (!timestamp) return "Never";

  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return then.toLocaleDateString(); // Fallback for older dates
};

export const getRelativeTime = (timestamp: string) => {
  if (!timestamp) return "";
  try {
    const date = parseISO(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return timestamp; // Fallback to raw string if it fails
  }
};

export const fetchSystemPermissionsApi = async () => {
  try {
    const res = await fetch("/api/master/system-permissions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    console.log("Fetched system permissions matrix:", data);
    return data;
  } catch (err) {
    console.error("API Error fetching system permissions matrix:", err);
    return { success: false, permissions: [] };
  }
};

/**
 * Fetches saved reusable role templates.
 */
export const fetchCustomRolesApi = async () => {
  try {
    const res = await fetch("/api/master/custom-roles", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await res.json();
  } catch (err) {
    console.error("API Error fetching custom roles lists:", err);
    return { success: false, roles: [] };
  }
};

/**
 * Saves a chosen assortment of permissions as a new role template row blueprint.
 */
export const createCustomRoleApi = async (
  roleName: string,
  description: string,
  permissionIds: string[],
) => {
  try {
    const res = await fetch("/api/master/custom-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_name: roleName,
        description,
        permission_ids: permissionIds,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("API Error creating custom role:", err);
    return {
      success: false,
      message: "Network connection fault storing role template.",
    };
  }
};

export const createSuperAdminUserWorkspaceApi = async (payload: {
  full_name: string;
  email: string;
  phone_number: string | null;
  require_password_change: boolean;
  sub_account: boolean;
  permissions: string[];
}) => {
  try {
    const res = await fetch("/api/master/admins/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error("API Error creating administrative account:", err);
    return {
      success: false,
      message: "Network connection fault creating user workspace profile.",
    };
  }
};

export const fetchAllSuperAdminsApi =
  async (): Promise<FetchAdminsResponse> => {
    try {
      const response = await fetch("/api/master/admins", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Fetch All Super Admins Endpoint Exception:", error);
      return {
        success: false,
        message:
          "Network layer connection failure synchronizing admin registry data.",
      };
    }
  };

export const fetchUserLogsApi = async (filters?: {
  action_type?: string;
  target_resource?: string;
}) => {
  try {
    let url = "/api/master/user-logs";
    if (filters) {
      const params = new URLSearchParams(filters as any);
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await res.json();
  } catch (err) {
    console.error("API Error fetching system activity audit table:", err);
    return { success: false, logs: [] };
  }
};

// Helper to format 24h to AM/PM
export const formatTime = (timeStr: string) => {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}-${month}-${year}`;
};

export async function updateAdminPermissionsApi(
  userId: string,
  permissions: string[],
) {
  try {
    const response = await fetch(`/api/master/${userId}/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ permissions }),
      credentials: "include",
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message:
        "Network synchronization failure updating authorization layout map.",
    };
  }
}

export async function submitSuperAdminResetPasswordApi(payload: {
  token: string;
  password: string;
  userId: string;
}) {
  try {
    const response = await fetch("/api/master/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message:
        "Network handshake exception writing updated access credentials to database mapping.",
    };
  }
}

export async function forceOverrideSubAccountPasswordApi(subAccountId: string, newPassword: string) {
  try {
    const response = await fetch(`/api/master/${subAccountId}/override-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPassword }),
      credentials: "include",
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      message: "Network exception attempting administrative override pipeline transmission.",
    };
  }
}

/**
 * 🔐 PERSISTENCE LAYER: Explicitly modify MFA policies for a target administrator instance
 */
export async function updateAdminMfaPolicyApi(userId: string, enforceMfa: boolean) {
  try {
    const response = await fetch(`/api/master/${userId}/mfa-policy`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mfa_enabled: enforceMfa }),
      credentials: "include",
    });
    return await response.json();
  } catch (err) {
    return { 
      success: false, 
      message: "Network synchronization failure updating security MFA policy configuration." 
    };
  }
}

export async function toggleAdminStatusApi(userId: string, targetActiveState: boolean) {
  try {
    const response = await fetch(`/api/master/${userId}/toggle-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: targetActiveState }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: "Network synchronization failure changing account status." };
  }
}


export async function deleteAdminProfileApi(userId: string) {
  try {
    const response = await fetch(`/api/master/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: "Network failure executing hard deletion pipeline." };
  }
}