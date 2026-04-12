/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function VerificationResultCard({
  data,
  type,
  error,
}: {
  data?: any;
  type: string;
  error?: string;
}) {
  const isSuccess = !!data && !error;

  return (
    <div
      className={`w-full max-w-md rounded-[2.5rem] shadow-2xl border-b-8 overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${
        isSuccess ? "bg-white border-emerald-500" : "bg-white border-rose-500"
      }`}
    >
      {/* Top Status Banner */}
      <div
        className={`p-6 flex justify-between items-center ${isSuccess ? "bg-emerald-50" : "bg-rose-50"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${isSuccess ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
          >
            {isSuccess ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <h3
              className={`font-black text-lg leading-none ${isSuccess ? "text-emerald-900" : "text-rose-900"}`}
            >
              {isSuccess ? "Verified Result" : "Verification Failed"}
            </h3>
            <p
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSuccess ? "text-emerald-600" : "text-rose-600"}`}
            >
              External {type} Query
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      <div className="p-8 space-y-5">
        {isSuccess ? (
          <>
            <RegistryField
              label="Official Registered Name"
              value={data.registeredName}
              highlight
            />
            <div className="grid grid-cols-2 gap-4">
              <RegistryField label="Status" value={data.status} />
              <RegistryField label="Reg. Date" value={data.date} />
            </div>
            <RegistryField label="Registered Address" value={data.address} />
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <p className="font-bold text-slate-800">
              {error || "No matching record found"}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed px-4">
              The {type} number provided does not match any active records in
              the national database. Please ask the admin to provide a valid
              certificate.
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              Powered by Paystack API
            </p>
          </div>
          {isSuccess && (
            <div className="flex -space-x-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center"
                >
                  <CheckCircle size={10} className="text-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RegistryField({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
        {label}
      </p>
      <p
        className={`font-bold leading-tight wrap-break-word ${
          highlight
            ? "text-indigo-600 text-lg tracking-tight"
            : "text-slate-800 text-sm"
        }`}
      >
        {value || "N/A"}
      </p>
    </div>
  );
}