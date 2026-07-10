"use client";

import { useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, AlertCircle, Clock, ShieldAlert } from "lucide-react";

interface LeaveBalanceData {
  periodMonth: string;
  monthlyQuota: number;
  leavesTaken: number;
  pendingLeaves: number;
  remainingBalance: number;
  isAvailable: boolean;
}

interface LeaveBalanceWidgetProps {
  compact?: boolean;
  refreshTrigger?: number;
}

export default function LeaveBalanceWidget({ compact = false, refreshTrigger = 0 }: LeaveBalanceWidgetProps) {
  const [data, setData] = useState<LeaveBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/leave/balance")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) {
          setData(json);
        }
      })
      .catch((err) => console.error("Error fetching leave balance:", err))
      .finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="w-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-white/10 shadow-sm animate-pulse flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>
    );
  }

  const quota = data?.monthlyQuota ?? 1;
  const taken = data?.leavesTaken ?? 0;
  const remaining = data?.remainingBalance ?? Math.max(0, quota - taken);
  const isAvailable = remaining > 0;
  const percentageTaken = Math.min(100, Math.round((taken / quota) * 100));

  return (
    <div className="w-full bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/70 dark:border-white/10 shadow-md transition-all relative overflow-hidden">
      {/* Background ambient light */}
      <div
        className={`absolute -top-10 -right-10 w-28 h-28 blur-3xl rounded-full opacity-20 pointer-events-none transition-colors duration-700 ${
          isAvailable ? "bg-emerald-500" : "bg-rose-500"
        }`}
      ></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Monthly Paid Leave Balance ({data?.periodMonth || "Current Month"})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official Policy: CL (7/yr), SL (8/yr), EL (15/yr). Approved Paid Leaves credit shift hours; LWP applies salary deduction.
          </p>
        </div>

        {/* Status Colored Badge */}
        <div className="flex items-center space-x-2">
          {isAvailable ? (
            <div className="flex items-center px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              Available: {remaining} Day
            </div>
          ) : (
            <div className="flex items-center px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
              Quota Exhausted (LWP Applies)
            </div>
          )}
        </div>
      </div>

      {/* Numerical Breakdown */}
      <div className="grid grid-cols-3 gap-3 mt-4 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/5">
        <div className="text-center sm:text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Quota</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white">{quota} Day</span>
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Leaves Taken (Approved)</span>
          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{taken} Day</span>
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Balance</span>
          <span
            className={`text-lg font-extrabold ${
              isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {remaining} Day
          </span>
        </div>
      </div>

      {/* Visual Indicator: Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className="text-slate-600 dark:text-slate-300">Paid Quota Usage</span>
          <span
            className={
              isAvailable ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"
            }
          >
            {taken}/{quota} Used ({percentageTaken}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              isAvailable
                ? "bg-gradient-to-r from-emerald-500 to-green-500"
                : "bg-gradient-to-r from-rose-500 to-red-600"
            }`}
            style={{ width: `${Math.max(percentageTaken, taken > 0 ? 100 : 0)}%` }}
          ></div>
        </div>
      </div>

      {/* Subnote if pending leaves exist */}
      {(data?.pendingLeaves ?? 0) > 0 && (
        <div className="mt-3 flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium">
          <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          You have {data?.pendingLeaves} leave request(s) currently pending HR authorization.
        </div>
      )}
    </div>
  );
}
