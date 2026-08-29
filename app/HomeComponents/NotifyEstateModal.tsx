/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { MessageSquare, Send, X, AlertCircle } from "lucide-react";
import { broadcastAllEstatesNotification, sendEstateNotification } from "../services/apis_estates";
import toast from "react-hot-toast";

interface NotifyEstateModalProps {
  isOpen: boolean;
  onClose: () => void;
  estate?: { id: string | number; name: string } | null;
  isGlobal?: boolean;
  onSuccess?: (message: string) => void;
}

export const NotifyEstateModal: React.FC<NotifyEstateModalProps> = ({
  isOpen,
  onClose,
  estate,
  isGlobal = false,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Please fill in both the title and message fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isGlobal || !estate) {
        res = await broadcastAllEstatesNotification({ title, message });
      } else {
        res = await sendEstateNotification(estate.id, { title, message });
      }

      setTitle("");
      setMessage("");
      toast.success(res?.message || "Message Delivered");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to dispatch notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {isGlobal
                  ? "Broadcast to All Estates"
                  : "Notify Estate Root Admin"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isGlobal
                  ? "Dispatch system message to root admins across all active estates"
                  : `Target: ${estate?.name || "Selected Estate"}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled System Maintenance"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Message Content
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your official announcement or directive here..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {isGlobal ? "Broadcast Now" : "Send Notification"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
