"use client";
import { useState, useEffect } from "react";
import { Send, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { LeaveBalanceItem } from "./LeaveBalancesWidget";

interface LeaveFormProps {
  selectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OFFICIAL_LEAVE_OPTIONS = [
  { code: "CL", label: "CL (Casual)", tooltip: "7 days/yr" },
  { code: "SL", label: "SL (Sick)", tooltip: "8 days/yr" },
  { code: "EL", label: "EL (Earned)", tooltip: "15 days/yr" },
  { code: "COMP_OFF", label: "Comp-Off", tooltip: "Within 90 days" },
  { code: "BEREAVEMENT", label: "Bereavement", tooltip: "Up to 3 days" },
  { code: "MARRIAGE", label: "Marriage", tooltip: "Up to 3 days" },
  { code: "MATERNITY", label: "Maternity", tooltip: "Up to 26 weeks" },
  { code: "PATERNITY", label: "Paternity", tooltip: "Up to 5 days" },
  { code: "LWP", label: "LWP (Unpaid)", tooltip: "Salary deduction" },
];

export default function LeaveForm({ selectedDate, onClose, onSuccess }: LeaveFormProps) {
  const [type, setType] = useState<string>("CL");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [balances, setBalances] = useState<Record<string, LeaveBalanceItem>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);

  useEffect(() => {
    setIsLoadingBalances(true);
    fetch("/api/leave/balances")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.balances) {
          setBalances(data.balances);
        }
      })
      .catch((err) => console.error("Error fetching balance inside form:", err))
      .finally(() => setIsLoadingBalances(false));
  }, []);

  const selectedBalance = balances[type];
  const isQuotaExhausted = selectedBalance && type !== "LWP" && selectedBalance.remaining === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaExhausted) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/leave/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, type, reason }),
      });

      if (res.ok) {
        onSuccess();
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 custom-scrollbar">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
          Apply Leave for {new Date(selectedDate).toLocaleDateString()}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
          <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>
      </div>

      {error && <div className="mb-3 text-xs sm:text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-1.5">
            Official Leave Policy Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {OFFICIAL_LEAVE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setType(opt.code)}
                className={`py-1.5 px-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                  type === opt.code
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="truncate max-w-full">{opt.label}</span>
                <span className={`text-[8px] sm:text-[10px] opacity-80 ${type === opt.code ? "text-blue-100" : "text-slate-400"}`}>
                  {opt.tooltip}
                </span>
              </button>
            ))}
          </div>

          {/* Dynamic Balance Indicator Box */}
          {!isLoadingBalances && selectedBalance && (
            <div
              className={`mt-2.5 p-2 rounded-lg sm:rounded-xl border flex items-start space-x-2 sm:space-x-2.5 text-[11px] sm:text-xs font-semibold ${
                isQuotaExhausted
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                  : selectedBalance.isLowBalance
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {isQuotaExhausted ? (
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-rose-500" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              )}
              <div>
                {isQuotaExhausted ? (
                  <p>
                    <strong>Quota Exhausted (0 left):</strong> You have used all {selectedBalance.quota} days of{" "}
                    {selectedBalance.name}. Please select <strong>LWP (Unpaid)</strong> instead.
                  </p>
                ) : type === "LWP" ? (
                  <p>
                    <strong>Leave Without Pay:</strong> Unpaid absence. Salary deduction will apply for approved LWP days.
                  </p>
                ) : (
                  <p>
                    <strong>Remaining Balance:</strong> {selectedBalance.remaining} of {selectedBalance.quota} days available
                    (Used: {selectedBalance.used}).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows={2}
            placeholder="Why do you need this leave?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !!isQuotaExhausted}
          className={`w-full flex justify-center items-center py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold shadow-sm transition-all text-xs sm:text-sm ${
            isQuotaExhausted
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border dark:border-slate-700"
              : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-70"
          }`}
        >
          {isSubmitting ? (
            "Submitting..."
          ) : isQuotaExhausted ? (
            "Quota Exhausted - Select LWP"
          ) : (
            <>
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Submit Request
            </>
          )}
        </button>
      </form>
    </div>
  );
}