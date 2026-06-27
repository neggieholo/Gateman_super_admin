"use client";

import React, { useState } from "react";
import {
  Home,
  ChevronDown,
  LogOut,
  User2,
  Users,
  Shield,
  Building2,
  Contact2,
  ShieldAlert,
} from "lucide-react";
import { ViewState } from "../services/types";
import { useUser } from "../UserContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { postLogout } from "../services/apis";

interface SideBarProps {
  isOpen?: boolean;
  afterNavClick?: () => void;
}

function defaultAfterNavClick() {
  console.log("");
}

export default function SideBar({
  isOpen = true,
  afterNavClick = defaultAfterNavClick,
}: SideBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await postLogout();
    } catch (error) {
      console.error("Backend session termination failed:", error);
    } finally {
      localStorage.removeItem("rememberMe");
      sessionStorage.setItem("loggedOut", "true");
      router.push("/");
      setUser(null);
    }
  };

  // Group 1: General Core Admin Navigation
  const generalNavItems = [
    {
      id: ViewState.DASHBOARD,
      label: "Home Dashboard",
      icon: Home,
      url: "/home/dashboard",
    },
    {
      id: ViewState.ADD_USER,
      label: "System Users",
      icon: Users,
      url: "/home/add_user",
    },
    {
      id: ViewState.SECURITY,
      label: "Security Controls",
      icon: Shield,
      url: "/home/security",
    },
  ];

  // Group 2: Estate Core Ecosystem Nodes (Linked via UI Category Heading)
  const estateNavItems = [
    {
      id: ViewState.ESTATES,
      label: "Estates Registry",
      icon: Building2,
      url: "/home/estates",
    },
    {
      id: ViewState.RESIDENT,
      label: "Residents",
      icon: Contact2,
      url: "/home/estate_residents",
    },
    {
      id: ViewState.GUARDS,
      label: "Guards",
      icon: ShieldAlert,
      url: "/home/estate_guards",
    },
  ];

  const getRoleBadgeColor = () => {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  };

  // Helper renderer to eliminate code duplication across map variants
  const renderNavButton = (item: (typeof generalNavItems)[0]) => {
    const isActive = pathname === item.url;
    return (
      <button
        key={item.id}
        onClick={() => {
          afterNavClick();
          router.push(item.url);
        }}
        className={`flex items-center font-sans space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-white text-primary"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <item.icon
          size={19}
          className={`transition-colors ${isActive ? "text-primary" : "text-white/60 group-hover:text-white"}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="text-[13px] font-semibold tracking-tight">
          {item.label}
        </span>

        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </button>
    );
  };

  return (
    <>
      <aside
        className={`${
          isOpen ? "" : "hidden"
        } flex flex-col w-60 bg-gm-charcoal h-screen border-r border-slate-100/10 z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]`}
      >
        {/* Brand Identity / Logo Header Layout */}
        <div className="p-6 flex items-center border-b border-white/5">
          <div className="relative w-full h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white/5">
            <Image
              src="/gmlogo.jpg"
              alt="GateMan Logo"
              fill
              className="object-contain p-1"
            />
          </div>
        </div>

        {/* Master Navigation Links Container */}
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-none">
          {/* Section A: Core System Routes */}
          <div className="space-y-1">
            {generalNavItems.map(renderNavButton)}
          </div>

          {/* Section B: Unified Estate Registry Elements Mapping */}
          <div className="space-y-1 pt-2">
            <div className="px-4 mb-2 flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-indigo-500/80" />
              <label className="text-[9px] text-white/40 font-black uppercase tracking-widest block">
                Estate Ecosystem
              </label>
            </div>
            {estateNavItems.map(renderNavButton)}
          </div>
        </div>

        {/* User Profile / Role Switcher Footer */}
        <div className="p-4 border-t border-white/5 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-xl hover:bg-white/5 transition-colors border border-transparent group"
          >
            <div className="relative text-white/70 group-hover:text-white transition-colors">
              <User2 size={20} />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gm-charcoal rounded-full"></div>
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-xs font-bold text-white truncate w-full text-left">
                {user?.full_name || "GateMan Admin"}
              </span>
              <div className="flex items-center mt-0.5">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide ${getRoleBadgeColor()}`}
                >
                  Super Admin
                </span>
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-white/40 transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Role Switcher Menu Popup */}
          {showUserMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-150">
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors font-bold"
                >
                  <LogOut size={14} />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
