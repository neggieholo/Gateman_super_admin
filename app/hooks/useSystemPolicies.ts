import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { getSystemPolicies, updateSystemPolicies } from "../services/apis_sec";
import { SystemPolicySettings } from "../services/types";

export function useSystemPolicies() {
  const [policies, setPolicies] = useState<SystemPolicySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSystemPolicies();
      if (res.success && res.policies) {
        setPolicies(res.policies);
      } else {
        toast.error(
          res.message ||
            "Failed to parse system policy operational matrix snapshots.",
        );
      }
    } catch (err) {
      console.error("Policy hook initialization failure:", err);
      toast.error(
        "Network communication failure hydrating policy matrix states.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const mutatePolicies = async (
    updatedPayload: SystemPolicySettings,
  ): Promise<boolean> => {
    setUpdating(true);
    try {
      const res = await updateSystemPolicies(updatedPayload);
      if (res.success) {
        toast.success(
          "Security frameworks updated globally and cache synchronized instantly.",
        );
        setPolicies(updatedPayload);
        return true;
      } else {
        toast.error(res.message || "Rule compiler rejected policy updates.");
        return false;
      }
    } catch (err) {
      console.error("Policy configuration sync failure:", err);
      toast.error("Internal processing exception modifying security vectors.");
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    policies,
    setPolicies,
    loading,
    updating,
    refresh: fetchPolicies,
    mutatePolicies,
  };
}
