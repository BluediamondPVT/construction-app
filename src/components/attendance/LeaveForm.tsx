"use client";
import { useState } from "react";
import { Send, X } from "lucide-react";

interface LeaveFormProps {
  selectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LeaveForm({ selectedDate, onClose, onSuccess }: LeaveFormProps) {
  const [type, setType] = useState<"CL" | "SL" | "TL">("CL");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/leave/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, type, reason }),
      });

      if (res.ok) {
        onSuccess(); // Parent ko batao ki form submit ho gaya
      } else {
        const data = await res.json();
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Apply Leave for {new Date(selectedDate).toLocaleDateString()}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
          <div className="grid grid-cols-3 gap-3">
            {["CL", "SL", "TL"].map((lType) => (
              <button
                key={lType}
                type="button"
                onClick={() => setType(lType as any)}
                className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                  type === lType 
                    ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                {lType}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            *CL: Casual Leave | SL: Sick Leave | TL: Travel/Other
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            placeholder="Why do you need this leave?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-md hover:opacity-90 disabled:opacity-70 transition-opacity"
        >
          {isSubmitting ? "Submitting..." : <><Send className="h-4 w-4 mr-2" /> Submit Request</>}
        </button>
      </form>
    </div>
  );
}