import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, CheckCircle2, Save, Info } from "lucide-react";
import { billingApi } from "../services/apis_estates";
import {
  DurationTier,
  ModulePricingInputMatrix,
  ModulePricingMatrix,
  SubscriptionPricingConfig,
  TierPricing,
  TierPricingInputs,
} from "../services/types";
import { useUser } from "../UserContext";

interface DefaultModule {
  title: string;
  description: string;
}

const DEFAULT_MODULES: DefaultModule[] = [
  {
    title: "Core Dashboard",
    description:
      "Operational overview, platform health metrics, and quick action shortcuts.",
  },
  {
    title: "System Users & Sub-accounts",
    description:
      "Admin team management, sub-user creation, and permission controls.",
  },
  {
    title: "Resident Management",
    description:
      "Resident onboarding approvals, directory, and activity audit logs.",
  },
];

const MODULE_KEYS: (keyof ModulePricingMatrix)[] = [
  "payments",
  "security",
  "community",
  "facility_bookings",
  "services_dispatch",
];

const DURATION_TIERS: { key: DurationTier; label: string }[] = [
  { key: "monthly", label: "1 Month" },
  { key: "six_months", label: "6 Months" },
  { key: "twelve_months", label: "12 Months" },
  { key: "twenty_four_months", label: "24 Months" },
];

const DEFAULT_TIERS: TierPricing = {
  monthly: 0,
  six_months: 0,
  twelve_months: 0,
  twenty_four_months: 0,
};

const DEFAULT_TIERS_INPUT: TierPricingInputs = {
  monthly: 0,
  six_months: 0,
  twelve_months: 0,
  twenty_four_months: 0,
};

export default function PricingConfigView() {
  const { user } = useUser();

  const hasRootBilling =
    user?.permissions.includes("all-access") ||
    user?.permissions.includes("billing_management");

  const canChangePricing =
    hasRootBilling || user?.permissions.includes("manage_pricing");

  // ─── STATE ───
  const [basePrice, setBasePrice] =
    useState<TierPricingInputs>(DEFAULT_TIERS_INPUT);

  const [modulePrices, setModulePrices] = useState<ModulePricingInputMatrix>({
    payments: { ...DEFAULT_TIERS_INPUT },
    security: { ...DEFAULT_TIERS_INPUT },
    community: { ...DEFAULT_TIERS_INPUT },
    facility_bookings: { ...DEFAULT_TIERS_INPUT },
    services_dispatch: { ...DEFAULT_TIERS_INPUT },
  });

  const [initialBasePrice, setInitialBasePrice] =
    useState<TierPricing>(DEFAULT_TIERS);
    
  const [initialModulePrices, setInitialModulePrices] =
    useState<ModulePricingMatrix>({
      payments: { ...DEFAULT_TIERS },
      security: { ...DEFAULT_TIERS },
      community: { ...DEFAULT_TIERS },
      facility_bookings: { ...DEFAULT_TIERS },
      services_dispatch: { ...DEFAULT_TIERS },
    });

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchPricing = async () => {
    setIsLoading(true);
    try {
      // Replace with your API endpoint call
      const res = await billingApi.getPricingConfig();
      if (res.success && res.pricing) {
        const base = res.pricing.base_platform_price || DEFAULT_TIERS;
        const mods = res.pricing.modules || {};

        const fetchedModules: ModulePricingMatrix = {
          payments: { ...DEFAULT_TIERS, ...mods.payments },
          security: { ...DEFAULT_TIERS, ...mods.security },
          community: { ...DEFAULT_TIERS, ...mods.community },
          facility_bookings: { ...DEFAULT_TIERS, ...mods.facility_bookings },
          services_dispatch: { ...DEFAULT_TIERS, ...mods.services_dispatch },
        };

        setBasePrice(base);
        setInitialBasePrice(base);
        setModulePrices(fetchedModules);
        setInitialModulePrices(fetchedModules);
        setLastUpdated(res.updated_at || null);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load pricing configuration.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  // ─── HANDLERS ───
  const handleBaseChange = (tier: DurationTier, value: string) => {
    setBasePrice((prev) => ({
      ...prev,
      [tier]: value === "" ? "" : Number(value),
    }));
  };

  const handleModuleChange = (
    moduleKey: keyof ModulePricingMatrix,
    tier: DurationTier,
    value: string,
  ) => {
    setModulePrices((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [tier]: value === "" ? "" : Number(value),
      },
    }));
  };

  // ─── CHANGE DETECTION ───
  const hasChanges = useMemo(() => {
    for (const { key: tier } of DURATION_TIERS) {
      const curBase = basePrice[tier] === "" ? 0 : basePrice[tier];
      if (curBase !== initialBasePrice[tier]) return true;
    }

    for (const modKey of MODULE_KEYS) {
      for (const { key: tier } of DURATION_TIERS) {
        const curVal =
          modulePrices[modKey][tier] === "" ? 0 : modulePrices[modKey][tier];
        const initVal = initialModulePrices[modKey]?.[tier] ?? 0;
        if (curVal !== initVal) return true;
      }
    }
    return false;
  }, [basePrice, modulePrices, initialBasePrice, initialModulePrices]);

  // ─── SAVE HANDLER ───
  const handleSavePricing = async () => {
    if (!hasChanges) return;

    if (!canChangePricing) {
      toast.error("You do not have permission to modify pricing.");
      return;
    }

    const sanitizeTiers = (input: TierPricingInputs): TierPricing => ({
      monthly: input.monthly === "" ? 0 : Number(input.monthly),
      six_months: input.six_months === "" ? 0 : Number(input.six_months),
      twelve_months:
        input.twelve_months === "" ? 0 : Number(input.twelve_months),
      twenty_four_months:
        input.twenty_four_months === "" ? 0 : Number(input.twenty_four_months),
    });

    const sanitizedBase = sanitizeTiers(basePrice);
    const sanitizedModules: ModulePricingMatrix = {
      payments: sanitizeTiers(modulePrices.payments),
      security: sanitizeTiers(modulePrices.security),
      community: sanitizeTiers(modulePrices.community),
      facility_bookings: sanitizeTiers(modulePrices.facility_bookings),
      services_dispatch: sanitizeTiers(modulePrices.services_dispatch),
    };

    // Validation
    for (const { key: tier } of DURATION_TIERS) {
      if (sanitizedBase[tier] < 0) {
        toast.error("Base platform price cannot be negative.");
        return;
      }
      for (const modKey of MODULE_KEYS) {
        if (sanitizedModules[modKey][tier] < 0) {
          toast.error("Module prices cannot be negative.");
          return;
        }
      }
    }

    const payload: SubscriptionPricingConfig = {
      base_platform_price: sanitizedBase,
      modules: sanitizedModules,
    };

    setIsSaving(true);
    try {
      const res = await billingApi.updatePricingConfig(payload);

      if (res.success) {
        toast.success(res.message || "Pricing matrix updated successfully!");
        const newBase = res.pricing.base_platform_price || sanitizedBase;
        const newMods = res.pricing.modules || sanitizedModules;

        setBasePrice(newBase);
        setInitialBasePrice(newBase);
        setModulePrices(newMods);
        setInitialModulePrices(newMods);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update pricing matrix.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Loading feature pricing configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Modular Feature Pricing Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure rates per duration tier (1m, 6m, 12m, 24m) for each
            optional module.
          </p>
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Duration Matrix Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm text-slate-200 font-bold uppercase tracking-wider">
              Add-on Modules Matrix
            </h4>
            <span className="text-xs text-slate-400">Total NGN / Period</span>
          </div>

          {/* Base Platform Entry */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <label className="text-sm font-bold text-indigo-300 block">
                Base Platform Access Fee
              </label>
              <p className="text-xs text-slate-400">
                Minimum fee billed to any estate across subscription durations.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_TIERS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    {label}
                  </span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-500 text-xs font-bold">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="0"
                      disabled={!canChangePricing}
                      value={basePrice[key]}
                      onChange={(e) => handleBaseChange(key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Module Inputs */}
          <div className="space-y-3">
            {MODULE_KEYS.map((modKey) => (
              <div
                key={modKey}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <span className="text-sm font-semibold text-slate-200 block capitalize">
                  {modKey.replace("_", " ")}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DURATION_TIERS.map(({ key: tierKey, label }) => (
                    <div key={tierKey} className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        {label}
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-500 text-xs font-bold">
                          ₦
                        </span>
                        <input
                          type="number"
                          min="0"
                          disabled={!canChangePricing}
                          value={modulePrices[modKey][tierKey]}
                          onChange={(e) =>
                            handleModuleChange(modKey, tierKey, e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSavePricing}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {isSaving ? "Saving Config..." : "Save Feature Pricing Matrix"}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Default Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Included Core Defaults
            </h4>
            <span className="text-xs text-emerald-400 font-semibold">
              Free / Core
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-indigo-950/40 border border-indigo-900/50 p-3 rounded-lg">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                These foundational modules are permanently unlocked for all
                registered estates.
              </span>
            </div>

            <div className="space-y-3">
              {DEFAULT_MODULES.map((mod) => (
                <div
                  key={mod.title}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {mod.title}
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                      Included
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
