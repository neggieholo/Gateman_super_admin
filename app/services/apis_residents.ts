/* eslint-disable @typescript-eslint/no-explicit-any */

import { SecurityUser } from "./types";

export async function getAllResidents() {
  try {
    // Replace with your standard dynamic base URL wrapper if applicable
    const response = await fetch(`/api/master/residents/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error("API Error fetching estate residents:", error);
    return {
      success: false,
      message: "Network connectivity execution mismatch.",
    };
  }
}
export async function getEstateResidents(estateId: string) {
  try {
    // Replace with your standard dynamic base URL wrapper if applicable
    const response = await fetch(`/api/master/residents/${estateId}/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error("API Error fetching estate residents:", error);
    return {
      success: false,
      message: "Network connectivity execution mismatch.",
    };
  }
}

export async function updateGlobalResidentStatus(
  residentId: string,
  targetStatus: "ACTIVE" | "SUSPENDED",
): Promise<{ success: boolean; message?: string; resident?: any }> {
  try {
    const response = await fetch(`/api/master/residents/${residentId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus }),
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network response failure on updateGlobalResidentStatus:",
      error,
    );
    return { success: false, message: "Network structural error occurred." };
  }
}

/**
 * Superadmin global deletion request pipeline
 */
export async function deleteGlobalResidentAccount(
  residentId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/master/residents/${residentId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network response failure on deleteGlobalResidentAccount configuration:",
      error,
    );
    return { success: false, message: "Network structural error occurred." };
  }
}

export async function getAllSecurityUsers(): Promise<{
  success: boolean;
  message?: string;
  securityUsers?: SecurityUser[];
}> {
  try {
    const response = await fetch(`/api/master/security/all`, {
      method: "GET",
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network response failure on getAllSecurityUsers API hook:",
      error,
    );
    return {
      success: false,
      message: "Network pipeline error structural anomaly.",
    };
  }
}


export async function getEstateSecurityUsers(estateId: string): Promise<{
  success: boolean;
  message?: string;
  securityUsers?: SecurityUser[];
}> {
  try {
    const response = await fetch(`/api/master/security/${estateId}/all`, {
      method: "GET",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network response failure on getEstateSecurityUsers API hook:",
      error,
    );
    return {
      success: false,
      message: "Network pipeline error structural anomaly.",
    };
  }
}

export async function updateGlobalSecurityStatus(
  SecurityId: string,
  targetStatus: "ACTIVE" | "SUSPENDED",
): Promise<{ success: boolean; message?: string; securityUser?: any }> {
  try {
    const response = await fetch(`/api/master/security/${SecurityId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus }),
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network response failure on updateGlobalSecurityStatus:",
      error,
    );
    return { success: false, message: "Network structural error occurred." };
  }
}

/**
 * Superadmin global deletion request pipeline
 */
export async function deleteGlobalSecurityAccount(
  securityId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`/api/master/security/${securityId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error(
      "Network response failure on deleteGlobalSecurityAccount configuration:",
      error,
    );
    return { success: false, message: "Network structural error occurred." };
  }
}