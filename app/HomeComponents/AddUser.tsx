"use client";

import { useState } from "react";
import { UserPlus, Shield, User } from "lucide-react";
import { db } from "../services/database";

export default function AddSuperAdmin() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [permissions, setPermissions] = useState({
    all_access: false,
    manage_estates: true,
    manage_finances: false,
    view_audit_logs: true,
  });

  const handleToggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await db.registerSuperAdmin(
      formData.fullName,
      formData.email,
      formData.password,
      permissions,
    );
    if (result.success) alert("New Super Admin added!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Add Staff Admin</h1>
        <p className="text-slate-500">
          Create internal accounts for platform management.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Left: Basic Info */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
            <User size={14} /> Basic Information
          </h3>
          <input
            type="text"
            placeholder="Full Name (Signature)"
            className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Work Email"
            className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Temporary Password"
            className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>

        {/* Right: Permissions Control */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
            <Shield size={14} /> Access Control
          </h3>

          <div className="space-y-3">
            {Object.keys(permissions).map((key) => (
              <label
                key={key}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-bold text-slate-700 capitalize">
                  {key.replace("_", " ")}
                </span>
                <input
                  type="checkbox"
                  checked={permissions[key as keyof typeof permissions]}
                  onChange={() => handleToggle(key as keyof typeof permissions)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>

          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-black transition-all">
            <UserPlus size={20} /> Create Admin
          </button>
        </div>
      </form>
    </div>
  );
}
