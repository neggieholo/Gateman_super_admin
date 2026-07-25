import React from "react";
import {
  X,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Clock,
} from "lucide-react";

export interface AdminUser {
  id: string;
  estate_id: string;
  estate_name?: string;
  name: string;
  email: string;
  phone_number: string;
  role: "admin";
  avatar?: string | Blob;
  subscription_expiry?: string;
  last_activity_at: string;
  created_at?: string;
  admin_selfie_url?: string;
  profile_image_url?: string;
  admin_role?: string;
  residential_address?: string;
  consent_given: boolean;
  consent_timestamp?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

interface AdminListModalProps {
  isOpen: boolean;
  onClose: () => void;
  admins?: AdminUser[];
  onSelectAdmin?: (admin: AdminUser) => void;
}

export const AdminListModal: React.FC<AdminListModalProps> = ({
  isOpen,
  onClose,
  admins = [],
  onSelectAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden transition-all transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Estate Administrators
            </h2>
            <p className="text-xs text-slate-400">
              {admins.length} {admins.length === 1 ? "personnel" : "personnels"}{" "}
              provisioned
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {admins.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              No administrators provisioned.
            </div>
          ) : (
            admins.map((admin) => {
              const avatarSrc =
                admin.profile_image_url ||
                admin.admin_selfie_url ||
                (typeof admin.avatar === "string" ? admin.avatar : undefined);

              const isActive = admin.status === "ACTIVE";

              return (
                <div
                  key={admin.id}
                  onClick={() => {
                    if (onSelectAdmin) onSelectAdmin(admin);
                  }}
                  className="group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar / Initial Fallback */}
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={admin.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center ring-2 ring-white flex-shrink-0">
                        {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                      </div>
                    )}

                    {/* Name & Contact Info */}
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {admin.name || "Unnamed Admin"}
                        </p>
                        {admin.admin_role && (
                          <span className="text-[9px] bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600 font-semibold uppercase">
                            {admin.admin_role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {admin.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 ml-2">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        SUSPENDED
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
