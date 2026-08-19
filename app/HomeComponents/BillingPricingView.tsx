import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, CheckCircle2, Save, Info } from "lucide-react";
import {
  PricingConfigResponse,
  PricingModules,
  SubscriptionPricing,
  UpdatePricingResponse,
} from "../services/types";
import { billingApi } from "../services/apis_estates";

type ModulePricingInputs = {
  [K in keyof PricingModules]: number | "";
};

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
];

const MODULE_KEYS: (keyof PricingModules)[] = [
  "payments",
  "security",
  "community",
  "facility_bookings",
  "resident_management",
  "services_dispatch",
];

export default function PricingConfigView() {
  // Temporary mock for user context permissions (Replace with your actual context hook)
  const canChangePricing = true;

  // ─── STATE ───
  const [basePrice, setBasePrice] = useState<number | "">(0);
  const [modulePrices, setModulePrices] = useState<ModulePricingInputs>({
    payments: 0,
    security: 0,
    community: 0,
    facility_bookings: 0,
    resident_management: 0,
    services_dispatch: 0,
  });

  const [initialBasePrice, setInitialBasePrice] = useState<number>(0);
  const [initialModulePrices, setInitialModulePrices] =
    useState<PricingModules>({
      payments: 0,
      security: 0,
      community: 0,
      facility_bookings: 0,
      resident_management: 0,
      services_dispatch: 0,
    });

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchPricing = async () => {
    console.log("Fetching pricing");
    setIsLoading(true);
    try {
      const res = await billingApi.getPricingConfig();
      if (res.success && res.pricing) {
        const base = res.pricing.base_platform_price ?? 0;
        const mods = res.pricing.modules || {};

        const fetchedModules: PricingModules = {
          payments: mods.payments ?? 0,
          security: mods.security ?? 0,
          community: mods.community ?? 0,
          facility_bookings: mods.facility_bookings ?? 0,
          resident_management: mods.resident_management ?? 0,
          services_dispatch: mods.services_dispatch ?? 0,
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

  const handleModuleChange = (key: keyof PricingModules, value: string) => {
    setModulePrices((prev) => ({
      ...prev,
      [key]: value === "" ? "" : Number(value),
    }));
  };

  // ─── CHANGE DETECTION ───
  const hasChanges = useMemo(() => {
    const curBase = basePrice === "" ? 0 : basePrice;
    if (curBase !== initialBasePrice) return true;

    for (const key of MODULE_KEYS) {
      const currentVal = modulePrices[key] === "" ? 0 : modulePrices[key];
      const initialVal = initialModulePrices[key] ?? 0;
      if (currentVal !== initialVal) return true;
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

    const curBase = basePrice === "" ? 0 : Number(basePrice);
    if (curBase < 0) {
      toast.error("Base platform price cannot be negative.");
      return;
    }

    const sanitizedModules: PricingModules = {
      payments:
        modulePrices.payments === "" ? 0 : Number(modulePrices.payments),
      security:
        modulePrices.security === "" ? 0 : Number(modulePrices.security),
      community:
        modulePrices.community === "" ? 0 : Number(modulePrices.community),
      facility_bookings:
        modulePrices.facility_bookings === ""
          ? 0
          : Number(modulePrices.facility_bookings),
      resident_management:
        modulePrices.resident_management === ""
          ? 0
          : Number(modulePrices.resident_management),
      services_dispatch:
        modulePrices.services_dispatch === ""
          ? 0
          : Number(modulePrices.services_dispatch),
    };

    for (const key of MODULE_KEYS) {
      if (sanitizedModules[key] < 0) {
        toast.error("Feature module prices cannot be negative.");
        return;
      }
    }

    const payload: SubscriptionPricing = {
      base_platform_price: curBase,
      modules: sanitizedModules,
    };

    setIsSaving(true);
    try {
      const res = await billingApi.updatePricingConfig(payload);

      if (res.success) {
        toast.success(
          res.message || "Feature pricing matrix updated successfully!",
        );
        const newBase = res.pricing.base_platform_price ?? curBase;
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
            Configure monthly standalone costs for each optional module.
          </p>
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm text-black font-bold uppercase tracking-wider">
              Optional Add-on Modules (Configurable)
            </h4>
            <span className="text-xs text-slate-400">Monthly Rate (NGN)</span>
          </div>

          {/* Base Platform Entry */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1 max-w-sm">
              <label className="text-sm font-bold text-indigo-300 block">
                Base Platform Access Fee
              </label>
              <p className="text-xs text-slate-400">
                Minimum monthly fee billed to any estate regardless of selected
                modules.
              </p>
            </div>
            <div className="relative w-36 shrink-0">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">
                ₦
              </span>
              <input
                type="number"
                min="0"
                disabled={!canChangePricing}
                value={basePrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBasePrice(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Dynamic Module Inputs */}
          <div className="space-y-3">
            {MODULE_KEYS.map((key) => (
              <div
                key={key}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-md">
                  <span className="text-sm font-semibold text-slate-200 block capitalize">
                    {key.replace("_", " ")}
                  </span>
                </div>
                <div className="relative w-36 shrink-0">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    disabled={!canChangePricing}
                    value={modulePrices[key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleModuleChange(key, e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
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
            <h4 className="text-sm font-bold text-black uppercase tracking-wider">
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
