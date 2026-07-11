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
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
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

    const amount = parseFloat(adjustForm.amount);
    const type = adjustForm.type;

    if ((type === "BONUS" || type === "ALLOWANCE" || type === "Bonus" || type === "Allowance") && amount < 0) {
      toast.error("Bonus must be a positive value.");
      setIsLoading(false);
      return;
    }
    if ((type === "PENALTY" || type === "Penalty") && amount > 0) {
      toast.error("Penalty must be a negative value.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Applying adjustment...");
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
        toast.success("Adjustment applied and net payout recalculated!", { id: toastId });
        setActionMessage({ type: "success", text: "Adjustment applied and net payout recalculated!" });
        fetchPayrollSummary(selectedMonth);
      } else {
        toast.error(data.error || "Adjustment failed", { id: toastId });
        setActionMessage({ type: "error", text: data.error || "Adjustment failed" });
      }
    } catch (err: any) {
      toast.error(err.message || "Adjustment failed", { id: toastId });
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeLockPeriod = async (userId?: string) => {
    const toastId = toast.loading("Locking payroll records...");
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
        toast.success(data.message || "Payroll locked successfully!", { id: toastId });
        setActionMessage({ type: "success", text: data.message || "Payroll locked successfully!" });
        fetchPayrollSummary(selectedMonth);
      } else {
        toast.error(data.error || "Lock operation failed", { id: toastId });
        setActionMessage({ type: "error", text: data.error || "Lock operation failed" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to lock payroll records", { id: toastId });
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleLockPeriod = (userId?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: userId ? "Lock Employee Salary" : "Lock All Payroll Records",
      message: userId
        ? "Lock salary for this employee?"
        : `Lock all payroll records for ${selectedMonth}? Once locked, they cannot be edited.`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        executeLockPeriod(userId);
      },
    });
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12 min-h-screen bg-[#0B1121] text-slate-200 p-4 sm:p-6 rounded-3xl">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Payroll & Calculation Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Automated shift calculations, attendance formulas & HR override management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-900/60 p-2 px-4 rounded-xl border border-slate-800 shadow-inner">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2">Period:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer [color-scheme:dark]"
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
            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Salary Structure
          </button>

          <button
            onClick={() => fetchPayrollSummary(selectedMonth)}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </button>

          <button
            onClick={() => handleLockPeriod()}
            disabled={summary.draftRecordsCount === 0 || loading}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
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
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400 backdrop-blur-md"
              : "bg-rose-950/80 border-rose-500/50 text-rose-400 backdrop-blur-md"
          }`}
        >
          <div className="flex items-center">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 mr-2.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2.5 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold tracking-wide">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-emerald-500/40 hover:bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
            Total Enterprise Payout
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ₹{summary.totalPayrollCost.toLocaleString("en-IN")}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <IndianRupee className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 block">
            Aggregated for {summary.totalEmployees} personnel
          </span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-blue-500/40 hover:bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
            Total Logged Hours
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {summary.totalHoursWorked} hrs
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 block">
            Avg Shift Formula: Hours / 9 Standard
          </span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-indigo-500/40 hover:bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
            Avg Working Days
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {summary.avgEnterpriseWorkingDays} days
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <UserCheck className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 block">Enterprise worker mean</span>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-amber-500/40 hover:bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)] p-5 sm:p-6 rounded-2xl transition-all duration-300 group">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
            Period Lock Status
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {summary.lockedRecordsCount} / {summary.totalEmployees}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 block">
            {summary.draftRecordsCount} remaining draft records
          </span>
        </div>
      </div>

      {/* PAYROLL ENGINE TABLE SECTION */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Calculated Worker Breakdown ({selectedMonth})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
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
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-5 px-6">Personnel</th>
                <th className="py-5 px-4 text-center">Working Hrs</th>
                <th className="py-5 px-4 text-center">Avg Days (Hrs/9)</th>
                <th className="py-5 px-4 text-center">Overtime</th>
                <th className="py-5 px-4 text-right">Rates (Daily / OT)</th>
                <th className="py-5 px-4 text-right">Adjustments</th>
                <th className="py-5 px-6 text-right">Net Payable</th>
                <th className="py-5 px-4 text-center">Status</th>
                <th className="py-5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs animate-pulse">
                    Calculating shift durations & payroll engine outputs...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
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
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">
                          {rec.user?.name || "Staff Worker"}
                        </div>
                        <div className="text-xs text-slate-400">{rec.user?.email || ""}</div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold text-slate-300">
                          {rec.totalWorkingHours} hrs
                        </div>
                        {((rec.approvedLeavesCount || 0) > 0) && (
                          <div className="mt-1.5 flex flex-col items-center gap-0.5">
                            {(rec.paidLeaveDays || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                🌴 1 Paid Leave (+9h)
                              </span>
                            )}
                            {(rec.lwpDays || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                                ⚠️ {rec.lwpDays} LWP Day(s)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-xs">
                          {rec.averageWorkingDays} days
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            rec.overtimeHours > 0 ? "text-amber-400" : "text-slate-500"
                          }`}
                        >
                          {rec.overtimeHours} hrs
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="text-xs font-semibold text-slate-200">
                          ₹{rec.dailyRate} / day
                        </div>
                        <div className="text-[11px] text-slate-500">₹{rec.overtimeRate} / hr OT</div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span
                          className={`font-bold ${
                            totalAdjust > 0
                              ? "text-emerald-400"
                              : totalAdjust < 0
                              ? "text-rose-400"
                              : "text-slate-500"
                          }`}
                        >
                          {totalAdjust > 0 ? `+₹${totalAdjust}` : totalAdjust === 0 ? "₹0" : `₹${totalAdjust}`}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right font-extrabold text-lg text-white">
                        ₹{rec.netPayableAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isLocked ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
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
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors animate-all"
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
                            className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                            title="Add Override / Bonus / Penalty"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        )}

                        {!isLocked && (
                          <button
                            onClick={() => handleLockPeriod(rec.user?._id || rec.userId)}
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
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

        {/* Mobile View */}
        <div className="md:hidden space-y-4 p-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
              Calculating shift durations & payroll engine outputs...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              No payroll records found for this period.
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const totalAdjust = (rec.adjustments || []).reduce(
                (sum, adj) => sum + (adj.amount || 0),
                0
              );
              const isLocked = rec.status === "APPROVED_LOCKED";

              return (
                <div
                  key={`mobile-${rec._id || rec.userId}`}
                  className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                >
                  {/* Personnel & Status Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{rec.user?.name || "Staff Worker"}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{rec.user?.email || ""}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isLocked ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                          <Unlock className="h-3 w-3 mr-1" />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid displaying Base Pay, OT, Deductions, and Net Pay */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-800/50 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Working Hours / Days
                      </span>
                      <div className="font-semibold text-slate-300">
                        {rec.totalWorkingHours} hrs
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({rec.averageWorkingDays} days)
                      </div>
                      {((rec.approvedLeavesCount || 0) > 0) && (
                        <div className="mt-2 flex flex-col gap-1 w-fit">
                          {(rec.paidLeaveDays || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                              🌴 Paid Leave
                            </span>
                          )}
                          {(rec.lwpDays || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold border border-rose-500/20">
                              ⚠️ {rec.lwpDays} LWP
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Rates (Daily / OT)
                      </span>
                      <div className="font-semibold text-slate-300">₹{rec.dailyRate} / day</div>
                      <div className="text-[10px] text-slate-500">₹{rec.overtimeRate} / hr OT</div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Overtime / Adjust
                      </span>
                      <div className="font-semibold text-slate-300">
                        OT: <span className={rec.overtimeHours > 0 ? "text-amber-400" : "text-slate-500"}>{rec.overtimeHours} hrs</span>
                      </div>
                      <div className={`font-bold mt-0.5 ${totalAdjust > 0 ? "text-emerald-400" : totalAdjust < 0 ? "text-rose-400" : "text-slate-500"}`}>
                        Adj: {totalAdjust > 0 ? `+₹${totalAdjust}` : totalAdjust === 0 ? "₹0" : `₹${totalAdjust}`}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Net Payable
                      </span>
                      <span className="font-extrabold text-white text-base">
                        ₹{rec.netPayableAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
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
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                      title="Configure Salary Structure"
                    >
                      <Settings className="h-3.5 w-3.5 flex-shrink-0" /> Structure
                    </button>

                    {!isLocked && (
                      <button
                        onClick={() => {
                          setSelectedRecordForAdjust(rec);
                          setAdjustModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                        title="Add Override / Bonus / Penalty"
                      >
                        <PlusCircle className="h-3.5 w-3.5 flex-shrink-0" /> Adjust
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        onClick={() => handleLockPeriod(rec.user?._id || rec.userId)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                        title="Final Approval & Lock"
                      >
                        <Lock className="h-3.5 w-3.5 flex-shrink-0" /> Lock
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SALARY STRUCTURE MODAL */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1121] rounded-3xl max-w-md w-full p-6 border border-slate-700/50 shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white tracking-wide flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-500" />
                Configure Salary Structure
              </h3>
              <button
                onClick={() => setRateModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Employee / Worker
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedUserForRate?._id || ""}
                    onChange={(e) => {
                      const found = allEmployeesList.find((emp) => emp._id === e.target.value);
                      setSelectedUserForRate(found || { _id: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 appearance-none rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0B1121]">
                      -- Select Employee --
                    </option>
                    {allEmployeesList.map((emp) => (
                      <option key={emp._id} value={emp._id} className="bg-[#0B1121]">
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                    {selectedUserForRate && !allEmployeesList.some((e) => e._id === selectedUserForRate._id) && (
                      <option value={selectedUserForRate._id} className="bg-[#0B1121]">{selectedUserForRate.name || selectedUserForRate._id}</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Daily Rate (₹)
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.dailyRate}
                  onChange={(e) => setRateForm({ ...rateForm, dailyRate: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Overtime Hourly Rate (₹/hr)
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.overtimeRate}
                  onChange={(e) => setRateForm({ ...rateForm, overtimeRate: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Standard Shift Hours
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.standardShiftHours}
                  onChange={(e) => setRateForm({ ...rateForm, standardShiftHours: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Monthly Fixed Salary (₹)
                </label>
                <input
                  type="number"
                  required
                  value={rateForm.monthlyFixedSalary}
                  onChange={(e) => setRateForm({ ...rateForm, monthlyFixedSalary: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1121] rounded-3xl max-w-md w-full p-6 border border-slate-700/50 shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide flex items-center">
                  <PlusCircle className="w-5 h-5 mr-2 text-blue-500" />
                  Add HR Override
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedRecordForAdjust.user?.name} ({selectedMonth})
                </p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Adjustment Type
                </label>
                <div className="relative">
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 appearance-none rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold cursor-pointer"
                  >
                    <option value="BONUS" className="bg-[#0B1121]">Bonus (+)</option>
                    <option value="ALLOWANCE" className="bg-[#0B1121]">Allowance (+)</option>
                    <option value="PENALTY" className="bg-[#0B1121]">Penalty / Deduction (-)</option>
                    <option value="OTHER" className="bg-[#0B1121]">Other Manual Override</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Amount (₹) - Use positive or negative number
                </label>
                <input
                  type="number"
                  required
                  placeholder={
                    adjustForm.type === "BONUS" || adjustForm.type === "ALLOWANCE" || adjustForm.type === "Bonus" || adjustForm.type === "Allowance"
                      ? "e.g. 500"
                      : adjustForm.type === "PENALTY" || adjustForm.type === "Penalty"
                      ? "e.g. -200"
                      : "e.g. 500 or -200"
                  }
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Reason / Audit Note
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Festive performance bonus or safety gear damage penalty"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 resize-none custom-scrollbar"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  {isLoading ? "Applying..." : "Apply & Recalculate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTWEIGHT DARK ENTERPRISE CONFIRM MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-slate-700/60 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
