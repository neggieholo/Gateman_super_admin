import React from "react";
import {
  Bell,
  Info,
  ShieldAlert,
  Megaphone,
  Clock,
  Trash2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

interface Props {
  item: NotificationItem;
  onDelete: (id: string) => void;
}

export default function NotificationCard({ item, onDelete }: Props) {
  const getTheme = () => {
    const type = item.type?.toLowerCase();
    switch (type) {
      case "emergency":
        return {
          color: "text-rose-600",
          bg: "bg-rose-50 border-rose-100",
          icon: ShieldAlert,
          label: "Emergency Alert Plane",
        };
      case "invite":
        return {
          color: "text-sky-600",
          bg: "bg-sky-50 border-sky-100",
          icon: Bell,
          label: "Guest Token Invite",
        };
      case "announcement":
        return {
          color: "text-amber-600",
          bg: "bg-amber-50 border-amber-100",
          icon: Megaphone,
          label: "Global System Announcement",
        };
      default:
        return {
          color: "text-indigo-600",
          bg: "bg-indigo-50 border-indigo-100",
          icon: Bell,
          label: "Core System Update",
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4 font-sans text-slate-800 relative group">
      <div className="flex flex-col sm:flex-row items-start gap-4 justify-between">
        {/* Left Informational Core Block */}
        <div className="flex items-start gap-4 flex-1">
          {/* Dynamic Telemetry Icon Frame */}
          <div
            className={`p-3 rounded-xl border ${theme.bg} ${theme.color} shrink-0`}
          >
            <Icon size={20} />
          </div>

          <div className="space-y-1 flex-1">
            {/* Header Telemetry Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${theme.color}`}
              >
                {theme.label}
              </span>
              <span className="text-slate-300 font-mono text-xs">|</span>
              <span className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                {formatDate(item.created_at)}
              </span>
            </div>

            {/* Bold Structural Dashboard Headline */}
            <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug">
              {item.title}
            </h4>
          </div>
        </div>

        {/* Action Trash Vector Anchor */}
        <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 self-end sm:self-start">
          <button
            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Structured Inner Payload Block */}
      <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed break-words w-full">
          {item.message}
        </p>
      </div>
    </div>
  );
}
