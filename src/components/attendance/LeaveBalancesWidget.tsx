"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Briefcase,
} from "lucide-react";

export interface LeaveBalanceItem {
  code: string;
  name: string;
  quota: number;
  used: number;
  pending: number;
  remaining: number;
  isPaid: boolean;
  description: string;
  isLowBalance: boolean;
  percentageUsed: number;
}

interface LeaveBalancesResponse {
  year: string;
  balances: Record<string, LeaveBalanceItem>;
  summaryList: LeaveBalanceItem[];
}

interface LeaveBalancesWidgetProps {
  refreshTrigger?: number;
}

export default function LeaveBalancesWidget({ refreshTrigger = 0 }: LeaveBalancesWidgetProps) {
  const [data, setData] = useState<LeaveBalancesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllLeaves, setShowAllLeaves] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/leave/balances")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.balances) {
          setData(json);
        }
      })
      .catch((err) => console.error("Error fetching leave balances:", err))
      .finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="w-full bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/60 dark:border-white/10 shadow-lg animate-pulse">
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-2xl"></div>
          <div className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-2xl"></div>
          <div className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const balances = data?.balances || {};
  const mainCodes = ["CL", "SL", "EL"];
  const mainCards = mainCodes.map((code) => balances[code]).filter(Boolean);

  const secondaryCards = (data?.summaryList || []).filter(
    (item) => !mainCodes.includes(item.code) && item.code !== "TL" && item.code !== "OTHER"
  );

  return (
    <div className="w-full bg-gradient-to-br from-white/90 via-white/75 to-slate-50/80 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-950/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-xl transition-all relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6 relative z-10">
        <div>
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                Annual Leave Balances ({data?.year || new Date().getFullYear()})
                <span className="text-[8px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border dark:border-slate-700">
                  Official Policy
                </span>
              </h3>
            </div>
          </div>
          <p className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-8 sm:pl-11">
            Real-time balance tracking for Casual (CL), Sick (SL), and Earned/Privilege (EL) leave quotas.
          </p>
        </div>

        <button
          onClick={() => setShowAllLeaves(!showAllLeaves)}
          className="self-start sm:self-auto inline-flex items-center px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 transition-all border border-slate-200/60 dark:border-white/5 shadow-sm"
        >
          {showAllLeaves ? (
            <>
              Hide Special <ChevronUp className="ml-1 h-3 w-3 sm:ml-1.5 sm:h-3.5 sm:w-3.5" />
            </>
          ) : (
            <>
              View Special <ChevronDown className="ml-1 h-3 w-3 sm:ml-1.5 sm:h-3.5 sm:w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Main Accrued Leave Cards: CL, SL, EL */}
      <div className="grid grid-cols-3 gap-2 sm:gap-5 relative z-10">
        {mainCards.map((card) => {
          const isZero = card.remaining === 0;
          const isLow = card.remaining <= 1 && !isZero;

          // Theme styling based on remaining balance
          const borderColor = isZero
            ? "border-rose-300/80 dark:border-rose-500/30"
            : isLow
            ? "border-amber-300/80 dark:border-amber-500/30"
            : "border-slate-200/80 dark:border-white/10";

          const badgeBg = isZero
            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
            : isLow
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";

          const progressGradient = isZero
            ? "from-rose-500 to-red-600"
            : isLow
            ? "from-amber-500 to-orange-500"
            : "from-blue-500 to-emerald-500";

          return (
            <div
              key={card.code}
              className={`bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-5 border shadow-sm sm:shadow-md hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between ${borderColor}`}
            >
              <div>
                {/* Top Row: Code + Status Badge */}
                <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] sm:text-xs font-black tracking-wider">
                      {card.code}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-white text-[9px] sm:text-sm truncate max-w-[40px] sm:max-w-none">{card.name}</h4>
                  </div>

                  <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}>
                    {isZero ? "Exhausted (0)" : isLow ? "Low Balance" : "Available"}
                  </span>
                </div>

                {/* Big Remaining Balance Display */}
                <div className="flex items-center justify-between mt-1 sm:mt-4">
                  <div>
                    <span className="text-[7px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Remaining
                    </span>
                    <div className="flex items-baseline space-x-0.5 sm:space-x-1.5 mt-0.5">
                      <span
                        className={`text-sm sm:text-3xl font-black ${
                          isZero
                            ? "text-rose-600 dark:text-rose-400"
                            : isLow
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {card.remaining}
                      </span>
                      <span className="text-[7px] sm:text-xs font-bold text-slate-500">d</span>
                    </div>
                  </div>

                  {/* Circular Usage Indicator */}
                  <div className="relative w-8 h-8 sm:w-14 sm:h-14 flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-14 sm:h-14 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={
                          isZero
                            ? "text-rose-500"
                            : isLow
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }
                        strokeDasharray={`${card.percentageUsed}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[7px] sm:text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                      {card.percentageUsed}%
                    </span>
                  </div>
                </div>

                {/* Quota vs Used Breakdown */}
                <div className="grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[9px] sm:text-xs font-medium">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[7px] sm:text-[10px] font-bold uppercase">Quota</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {card.quota}d
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-slate-400 text-[7px] sm:text-[10px] font-bold uppercase">Used</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      {card.used}d
                    </span>
                  </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="mt-2">
                  <div className="w-full h-1 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-700 rounded-full`}
                      style={{ width: `${Math.max(card.percentageUsed, card.used > 0 ? 8 : 0)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Pending Requests Notice */}
              {card.pending > 0 && (
                <div className="mt-2 pt-1.5 flex items-center text-[7px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                  <span>
                    {card.pending} <span className="hidden sm:inline">request(s)</span> pending
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expandable Special Leaves Section */}
      {showAllLeaves && (
        <div className="mt-4 pt-4 sm:mt-6 sm:pt-6 border-t border-slate-200/70 dark:border-white/10 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-[9px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
            Special & Statutory Leave Quotas
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {secondaryCards.map((item) => (
              <div
                key={item.code}
                className="bg-white/60 dark:bg-slate-800/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-slate-200/60 dark:border-white/5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-white">{item.code}</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">{item.quota}d Max</span>
                </div>
                <p className="text-[9px] sm:text-[11px] font-medium text-slate-500 truncate mt-0.5">{item.name}</p>
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[9px] sm:text-xs">
                  <span className="text-slate-400 text-[8px] sm:text-[10px]">Used: {item.used}d</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rem: {item.remaining}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
