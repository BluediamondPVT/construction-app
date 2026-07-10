"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Clock,
  Lock,
  Unlock,
  IndianRupee,
  PlusCircle,
  Settings,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

interface PayrollRecord {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: any;
  };
  periodMonth: string;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalWorkingHours: number;
  averageWorkingDays: number;
  overtimeHours: number;
  approvedLeavesCount?: number;
  paidLeaveDays?: number;
  lwpDays?: number;
  dailyRate: number;
  overtimeRate: number;
  baseCalculatedEarnings: number;
  overtimeEarnings: number;
  absentPenaltyDeductions: number;
  adjustments: Array<{
    type: "BONUS" | "PENALTY" | "ALLOWANCE" | "OTHER";
    amount: number;
    reason: string;
    addedBy: string;
    createdAt: string;
  }>;
  netPayableAmount: number;
  status: "DRAFT" | "APPROVED_LOCKED";
}

export default function PayrollDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalPayrollCost: 0,
    totalHoursWorked: 0,
    lockedRecordsCount: 0,
    draftRecordsCount: 0,
    avgEnterpriseWorkingDays: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedUserForRate, setSelectedUserForRate] = useState<any>(null);
  const [allEmployeesList, setAllEmployeesList] = useState<any[]>([]);
  const [rateForm, setRateForm] = useState({
    dailyRate: 800,
    overtimeRate: 120,
    monthlyFixedSalary: 0,
    standardShiftHours: 9,
  });

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedRecordForAdjust, setSelectedRecordForAdjust] = useState<PayrollRecord | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    type: "BONUS",
    amount: "",
    reason: "",
  });

  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPayrollSummary = async (month: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/hr/payroll/summary?month=${month}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setSummary(
          data.summary || {
            totalEmployees: 0,
            totalPayrollCost: 0,
            totalHoursWorked: 0,
            lockedRecordsCount: 0,
            draftRecordsCount: 0,
            avgEnterpriseWorkingDays: 0,
          }
        );
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to load payroll calculation engine." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollSummary(selectedMonth);
    fetch("/api/hr/users")
      .then((res) => (res.ok ? res.json() : { employees: [] }))
      .then((data) => setAllEmployeesList(data.employees || []))
      .catch((err) => console.error("Error loading employees for rate modal:", err));
  }, [selectedMonth]);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRate) return;

    try {
      const res = await fetch("/api/hr/payroll/salary-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserForRate._id,
          dailyRate: Number(rateForm.dailyRate),
          overtimeRate: Number(rateForm.overtimeRate),
          monthlyFixedSalary: Number(rateForm.monthlyFixedSalary),
          standardShiftHours: Number(rateForm.standardShiftHours),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRateModalOpen(false);
        setActionMessage({ type: "success", text: "Salary structure updated. Recalculating payroll..." });
        fetchPayrollSummary(selectedMonth);
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to update rates" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAdjust) return;

    try {
      const res = await fetch("/api/hr/payroll/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedRecordForAdjust.user?._id || selectedRecordForAdjust.userId,
          periodMonth: selectedMonth,
          type: adjustForm.type,
          amount: Number(adjustForm.amount),
          reason: adjustForm.reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdjustModalOpen(false);
        setAdjustForm({ type: "BONUS", amount: "", reason: "" });
        setActionMessage({ type: "success", text: "Adjustment applied and net payout recalculated!" });
        fetchPayrollSummary(selectedMonth);
      } else {
        setActionMessage({ type: "error", text: data.error || "Adjustment failed" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleLockPeriod = async (userId?: string) => {
    if (!confirm(userId ? "Lock salary for this employee?" : `Lock all payroll records for ${selectedMonth}? Once locked, they cannot be edited.`)) {
      return;
    }

    try {
      const res = await fetch("/api/hr/payroll/approve", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodMonth: selectedMonth,
          userId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: "success", text: data.message || "Payroll locked successfully!" });
        fetchPayrollSummary(selectedMonth);
      } else {
        setActionMessage({ type: "error", text: data.error || "Lock operation failed" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const filteredRecords = records.filter((rec) => {
    const name = rec.user?.name || "";
    const email = rec.user?.email || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Payroll & Calculation Engine
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automated shift calculations, attendance formulas & HR override management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10">
            <label className="text-xs font-semibold uppercase text-slate-500 mr-2">Period:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              const defaultUser = selectedUserForRate || (allEmployeesList.length > 0 ? allEmployeesList[0] : null);
              setSelectedUserForRate(defaultUser);
              setRateForm({
                dailyRate: 800,
                overtimeRate: 120,
                monthlyFixedSalary: 0,
                standardShiftHours: 9,
              });
              setRateModalOpen(true);
            }}
            className="flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Salary Structure
          </button>

          <button
            onClick={() => fetchPayrollSummary(selectedMonth)}
            disabled={loading}
            className="flex items-center px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-slate-800 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </button>

          <button
            onClick={() => handleLockPeriod()}
            disabled={summary.draftRecordsCount === 0 || loading}
            className="flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Lock className="h-4 w-4 mr-2" />
            Final Approval ({summary.draftRecordsCount} Drafts)
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 mr-2.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2.5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Enterprise Payout
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              ₹{summary.totalPayrollCost.toLocaleString("en-IN")}
            </span>
            <IndianRupee className="h-7 w-7 text-blue-500 opacity-80" />
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Aggregated for {summary.totalEmployees} personnel
          </span>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Logged Hours
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.totalHoursWorked} hrs
            </span>
            <Clock className="h-7 w-7 text-emerald-500 opacity-80" />
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Avg Shift Formula: Hours / 9 Standard
          </span>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Avg Working Days
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.avgEnterpriseWorkingDays} days
            </span>
            <UserCheck className="h-7 w-7 text-indigo-500 opacity-80" />
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Enterprise worker mean</span>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Period Lock Status
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.lockedRecordsCount} / {summary.totalEmployees}
            </span>
            <ShieldCheck className="h-7 w-7 text-amber-500 opacity-80" />
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            {summary.draftRecordsCount} remaining draft records
          </span>
        </div>
      </div>

      {/* PAYROLL ENGINE TABLE SECTION */}
      <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Calculated Worker Breakdown ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-500">
              Formula: (AvgWorkingDays × DailyRate) + (OvertimeHours × OTRate) − AbsentDeductions + HRAdjustments
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Personnel</th>
                <th className="py-4 px-4 text-center">Working Hrs</th>
                <th className="py-4 px-4 text-center">Avg Days (Hrs/9)</th>
                <th className="py-4 px-4 text-center">Overtime</th>
                <th className="py-4 px-4 text-right">Rates (Daily / OT)</th>
                <th className="py-4 px-4 text-right">Adjustments</th>
                <th className="py-4 px-6 text-right">Net Payable</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Calculating shift durations & payroll engine outputs...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payroll records found for this period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const totalAdjust = (rec.adjustments || []).reduce(
                    (sum, adj) => sum + (adj.amount || 0),
                    0
                  );
                  const isLocked = rec.status === "APPROVED_LOCKED";

                  return (
                    <tr
                      key={rec._id || rec.userId}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rec.user?.name || "Staff Worker"}
                        </div>
                        <div className="text-xs text-slate-500">{rec.user?.email || ""}</div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {rec.totalWorkingHours} hrs
                        </div>
                        {((rec.approvedLeavesCount || 0) > 0) && (
                          <div className="mt-1 flex flex-col items-center gap-0.5">
                            {(rec.paidLeaveDays || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                                🌴 1 Paid Leave (+9h)
                              </span>
                            )}
                            {(rec.lwpDays || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-500/20">
                                ⚠️ {rec.lwpDays} LWP Day(s)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-xs">
                          {rec.averageWorkingDays} days
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            rec.overtimeHours > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                          }`}
                        >
                          {rec.overtimeHours} hrs
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          ₹{rec.dailyRate} / day
                        </div>
                        <div className="text-[11px] text-slate-400">₹{rec.overtimeRate} / hr OT</div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span
                          className={`font-bold ${
                            totalAdjust > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : totalAdjust < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {totalAdjust > 0 ? `+₹${totalAdjust}` : totalAdjust === 0 ? "₹0" : `₹${totalAdjust}`}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right font-extrabold text-lg text-slate-900 dark:text-white">
                        ₹{rec.netPayableAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isLocked ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                            <Unlock className="h-3 w-3 mr-1" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUserForRate(rec.user || { _id: rec.userId });
                            setRateForm({
                              dailyRate: rec.dailyRate || 800,
                              overtimeRate: rec.overtimeRate || 120,
                              monthlyFixedSalary: 0,
                              standardShiftHours: 9,
                            });
                            setRateModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Configure Salary Structure"
                        >
                          <Settings className="h-4 w-4" />
                        </button>

                        {!isLocked && (
                          <button
                            onClick={() => {
                              setSelectedRecordForAdjust(rec);
                              setAdjustModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                            title="Add Override / Bonus / Penalty"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        )}

                        {!isLocked && (
                          <button
                            onClick={() => handleLockPeriod(rec.user?._id || rec.userId)}
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="Final Approval & Lock"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SALARY STRUCTURE MODAL */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Configure Salary Structure
              </h3>
              <button
                onClick={() => setRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Employee / Worker
                </label>
                <select
                  required
                  value={selectedUserForRate?._id || ""}
                  onChange={(e) => {
                    const found = allEmployeesList.find((emp) => emp._id === e.target.value);
                    setSelectedUserForRate(found || { _id: e.target.value });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="" disabled>
                    -- Select Employee --
                  </option>
                  {allEmployeesList.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                  {selectedUserForRate && !allEmployeesList.some((e) => e._id === selectedUserForRate._id) && (
                    <option value={selectedUserForRate._id}>{selectedUserForRate.name || selectedUserForRate._id}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Daily Rate (₹)
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.dailyRate}
                  onChange={(e) => setRateForm({ ...rateForm, dailyRate: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Overtime Hourly Rate (₹/hr)
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.overtimeRate}
                  onChange={(e) => setRateForm({ ...rateForm, overtimeRate: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Standard Shift Hours
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.standardShiftHours}
                  onChange={(e) => setRateForm({ ...rateForm, standardShiftHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Monthly Fixed Salary (₹)
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.monthlyFixedSalary}
                  onChange={(e) => setRateForm({ ...rateForm, monthlyFixedSalary: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20"
                >
                  Save & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUSTMENT / OVERRIDE MODAL */}
      {adjustModalOpen && selectedRecordForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add HR Override / Adjustment
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRecordForAdjust.user?.name} ({selectedMonth})
                </p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="BONUS">Bonus (+)</option>
                  <option value="ALLOWANCE">Allowance (+)</option>
                  <option value="PENALTY">Penalty / Deduction (-)</option>
                  <option value="OTHER">Other Manual Override</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Amount (₹) - Use positive or negative number
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500 or -200"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Reason / Audit Note
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Festive performance bonus or safety gear damage penalty"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20"
                >
                  Apply & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
