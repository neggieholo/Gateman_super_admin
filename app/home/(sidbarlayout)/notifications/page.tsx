"use client";

import React, { useEffect, useState } from "react";
import { BellRing, RefreshCw, Trash2, Inbox } from "lucide-react";
import NotificationCard from "@/app/HomeComponents/NotificationsCard";
import {
  deleteNotificationApi,
  markAllAsReadApi,
  deleteAllNotificationsApi,
} from "@/app/services/apis";
import { useUser } from "@/app/UserContext";

export default function NotificationsPage() {
  const {
    notifications,
    setNotifications,
    triggerRefresh,
    setBadgeCount,
    loadingNotifications,
  } = useUser();
  const [clearing, setClearing] = useState(false);

  // Mark as read immediately on page open
  useEffect(() => {
    const handleRead = async () => {
      if (notifications.length > 0) {
        await markAllAsReadApi();
        setBadgeCount(0);
      }
    };
    handleRead();
  }, [notifications.length]);

  const clearAll = async () => {
    if (confirm("Delete all notifications?")) {
      setClearing(true);
      await deleteAllNotificationsApi();
      setNotifications([]);
      setClearing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    await deleteNotificationApi(id);
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* NOTIFICATIONS HEADER OPERATIONAL BAR                                      */}
      {/* ========================================================================= */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <BellRing size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              System Broadcast Ledger
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time message routing and emergency notifications logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Refresh Action Hook */}
          <button
            onClick={triggerRefresh}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl shadow-sm transition-all flex items-center justify-center"
          >
            <RefreshCw
              size={16}
              className={loadingNotifications ? "animate-spin" : ""}
            />
          </button>

          {/* Purge All Action Hook */}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              disabled={clearing}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <Trash2 size={14} />
              {clearing ? "Purging..." : "Purge Ledger"}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIMELINE LEDGER CONTAINER                                                 */}
      {/* ========================================================================= */}
      <div className="max-w-4xl mx-auto space-y-4">
        {loadingNotifications ? (
          // System Hydration State
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-slate-200/60 border border-slate-200 rounded-2xl w-full"
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          // Render Clean Telemetry Cards
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onDelete={() => {
                handleDelete(item.id);
              }}
            />
          ))
        ) : (
          // Empty Queue Fallback Block
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm space-y-2">
            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-300 rounded-2xl">
              <Inbox size={36} />
            </div>
            <div className="text-center">
              <h3 className="text-slate-900 font-black text-sm uppercase tracking-wider">
                Telemetry Queue Empty
              </h3>
              <p className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">
                All background logs and event clusters have been triaged.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
