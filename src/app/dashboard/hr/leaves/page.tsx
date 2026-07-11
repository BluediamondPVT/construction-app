"use client";

import { useState, useEffect, useMemo } from "react";
import {
    ClipboardList,
    Calendar,
    Check,
    X,
    History,
    User,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    SlidersHorizontal,
    Sparkles,
    CheckSquare,
    Square,
    ChevronRight,
    Briefcase,
    ShieldCheck,
    RefreshCw,
    Info,
    ArrowUpRight,
    Layers,
    FileText
} from "lucide-react";

interface LeaveItem {
    _id: string;
    userId?: {
        _id?: string;
        name?: string;
        role?: string;
    };
    date: string;
    endDate?: string;
    type: string;
    status: "Pending" | "Approved" | "Rejected";
    reason?: string;
    approvedLeavesThisMonth?: number;
    isPaidLeaveQuotaUsed?: boolean;
    payImpactText?: string;
    createdAt?: string;
}

export default function PendingLeavesPage() {
    const [leaves, setLeaves] = useState<LeaveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Bulk selection state
    const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);

    // Smart Context Right Drawer state
    const [drawerLeave, setDrawerLeave] = useState<LeaveItem | null>(null);

    // Filters for Leave History Table
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "Approved" | "Rejected">("ALL");
    const [monthFilter, setMonthFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");

    const fetchLeaves = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/hr/leaves");
            const data = await res.json();
            setLeaves(data.leaves || []);
        } catch (error) {
            console.error("Failed to fetch leaves:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleAction = async (leaveId: string, status: "Approved" | "Rejected") => {
        setActionLoadingId(leaveId);
        try {
            await fetch("/api/hr/leaves", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leaveId, status }),
            });
            await fetchLeaves();
            // Update drawer state if the open leave was actioned
            if (drawerLeave && drawerLeave._id === leaveId) {
                setDrawerLeave(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error("Error updating leave:", error);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleBulkAction = async (status: "Approved" | "Rejected") => {
        if (selectedLeaveIds.length === 0) return;
        setIsProcessingBulk(true);
        try {
            await Promise.all(
                selectedLeaveIds.map(leaveId =>
                    fetch("/api/hr/leaves", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ leaveId, status }),
                    })
                )
            );
            setSelectedLeaveIds([]);
            await fetchLeaves();
            if (drawerLeave && selectedLeaveIds.includes(drawerLeave._id)) {
                setDrawerLeave(prev => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            console.error("Bulk action error:", error);
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const pendingLeaves = useMemo(() => leaves.filter(l => l.status === "Pending"), [leaves]);
    const historyLeaves = useMemo(() => leaves.filter(l => l.status !== "Pending"), [leaves]);

    // Select All Checkbox logic
    const isAllSelected = pendingLeaves.length > 0 && selectedLeaveIds.length === pendingLeaves.length;
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedLeaveIds([]);
        } else {
            setSelectedLeaveIds(pendingLeaves.map(l => l._id));
        }
    };

    const toggleSelectCard = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedLeaveIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // KPI Metrics calculation
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    const kpis = useMemo(() => {
        const pendingCount = pendingLeaves.length;

        const onLeaveTodayCount = leaves.filter(
            l => l.status === "Approved" && l.date <= todayStr && (!l.endDate || l.endDate >= todayStr)
        ).length;

        const rejectedThisMonthCount = leaves.filter(
            l => l.status === "Rejected" && String(l.date).startsWith(currentMonthStr)
        ).length;

        const approvedThisMonthCount = leaves.filter(
            l => l.status === "Approved" && String(l.date).startsWith(currentMonthStr)
        ).length;

        return {
            pendingCount,
            onLeaveTodayCount,
            rejectedThisMonthCount,
            approvedThisMonthCount
        };
    }, [leaves, pendingLeaves, todayStr, currentMonthStr]);

    // Filtered History
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        historyLeaves.forEach(l => {
            if (l.date) months.add(l.date.slice(0, 7));
        });
        return Array.from(months).sort().reverse();
    }, [historyLeaves]);

    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        historyLeaves.forEach(l => {
            if (l.type) types.add(l.type);
        });
        return Array.from(types).sort();
    }, [historyLeaves]);

    const filteredHistory = useMemo(() => {
        return historyLeaves.filter(leave => {
            const empName = leave.userId?.name || "";
            const reasonText = leave.reason || "";
            const matchesSearch =
                empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reasonText.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "ALL" || leave.status === statusFilter;

            const matchesMonth =
                monthFilter === "ALL" || String(leave.date).startsWith(monthFilter);

            const matchesType =
                typeFilter === "ALL" || leave.type === typeFilter;

            return matchesSearch && matchesStatus && matchesMonth && matchesType;
        });
    }, [historyLeaves, searchQuery, statusFilter, monthFilter, typeFilter]);

    // Smart Context Drawer: Compute Employee Leave Balances
    const drawerEmployeeStats = useMemo(() => {
        if (!drawerLeave) return null;
        const empId = drawerLeave.userId?._id;
        const empName = drawerLeave.userId?.name || "Employee";

        const empLeaves = leaves.filter(l => l.userId?._id === empId);
        const approvedEmpLeaves = empLeaves.filter(l => l.status === "Approved");

        const clUsed = approvedEmpLeaves.filter(l => l.type === "CL").length;
        const slUsed = approvedEmpLeaves.filter(l => l.type === "SL").length;
        const elUsed = approvedEmpLeaves.filter(l => l.type === "EL").length;

        return {
            empName,
            clBalance: { quota: 7, used: clUsed, remaining: Math.max(0, 7 - clUsed) },
            slBalance: { quota: 8, used: slUsed, remaining: Math.max(0, 8 - slUsed) },
            elBalance: { quota: 15, used: elUsed, remaining: Math.max(0, 15 - elUsed) },
            history: empLeaves.sort((a, b) => b.date.localeCompare(a.date))
        };
    }, [drawerLeave, leaves]);

    const formatLeaveDateRange = (start: string, end?: string) => {
        if (!start) return "N/A";
        const startDate = new Date(start).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        if (!end || end === start) {
            return startDate;
        }
        const endDate = new Date(end).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        return `${startDate} — ${endDate}`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 font-sans selection:bg-amber-500/20">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Enterprise Control Center</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        HR Leave Management
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Review authorizations, analyze employee attendance quotas, and audit leave logs.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLeaves}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* TOP KPI 'CONTROL CENTER' WIDGETS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Pending Approvals */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-md border border-amber-500/30 p-5 shadow-[0_0_20px_rgba(245,158,11,0.08)] transition-all duration-300 hover:border-amber-500/50">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Pending Approvals
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white font-mono tracking-tight">
                            {kpis.pendingCount}
                        </span>
                        {kpis.pendingCount > 0 && (
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Action Required
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Requests waiting for HR authorization
                    </p>
                </div>

                {/* 2. On Leave Today */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-md border border-emerald-500/30 p-5 shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all duration-300 hover:border-emerald-500/50">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            On Leave Today
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white font-mono tracking-tight">
                            {kpis.onLeaveTodayCount}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Employees out of office today
                    </p>
                </div>

                {/* 3. Rejected This Month */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-md border border-rose-500/30 p-5 shadow-[0_0_20px_rgba(244,63,94,0.08)] transition-all duration-300 hover:border-rose-500/50">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Rejected This Month
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                            <XCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white font-mono tracking-tight">
                            {kpis.rejectedThisMonthCount}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Declined applications this month
                    </p>
                </div>

                {/* 4. Approved This Month */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-md border border-blue-500/30 p-5 shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all duration-300 hover:border-blue-500/50">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Approved This Month
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white font-mono tracking-tight">
                            {kpis.approvedThisMonthCount}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Authorized applications this month
                    </p>
                </div>
            </div>

            {/* PENDING AUTHORIZATIONS SECTION (GRID + BULK ACTIONS) */}
            <div className="space-y-4">
                {/* Bulk Action Header Bar */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            disabled={pendingLeaves.length === 0}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
                        >
                            {isAllSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                                <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                            )}
                            <span>Select All</span>
                        </button>
                        <span className="h-4 w-px bg-slate-800" />
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <span>Pending Authorizations</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                {pendingLeaves.length}
                            </span>
                        </h2>
                    </div>

                    {/* Bulk Action Controls */}
                    {selectedLeaveIds.length > 0 && (
                        <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 px-3.5 py-1.5 rounded-xl">
                            <span className="text-xs text-amber-300 font-medium font-mono">
                                {selectedLeaveIds.length} selected
                            </span>
                            <button
                                type="button"
                                disabled={isProcessingBulk}
                                onClick={() => handleBulkAction("Approved")}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-50"
                            >
                                {isProcessingBulk ? "Processing..." : "Bulk Approve"}
                            </button>
                            <button
                                type="button"
                                disabled={isProcessingBulk}
                                onClick={() => handleBulkAction("Rejected")}
                                className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition-all disabled:opacity-50"
                            >
                                Bulk Reject
                            </button>
                        </div>
                    )}
                </div>

                {/* 3-Column Responsive Cards Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-60 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse" />
                        ))}
                    </div>
                ) : pendingLeaves.length === 0 ? (
                    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-10 text-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-white">All Clear</h3>
                        <p className="text-xs text-slate-400 mt-1">
                            No pending leave authorization requests right now.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pendingLeaves.map(leave => {
                            const isSelected = selectedLeaveIds.includes(leave._id);
                            const isActioning = actionLoadingId === leave._id;

                            return (
                                <div
                                    key={leave._id}
                                    onClick={() => setDrawerLeave(leave)}
                                    className={`group relative bg-slate-900/50 backdrop-blur-md rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg ${
                                        isSelected
                                            ? "border-amber-500/60 bg-amber-500/[0.03] shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                                            : "border-slate-800 hover:border-slate-700"
                                    }`}
                                >
                                    <div>
                                        {/* Top Card Row: Checkbox, Name, Pending Badge */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleSelectCard(e, leave._id)}
                                                    className="text-slate-500 hover:text-amber-400 transition-colors"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-amber-400" />
                                                    ) : (
                                                        <Square className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <div>
                                                    <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-300 transition-colors">
                                                        {leave.userId?.name || "Unknown Employee"}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {leave.userId?.role || "Staff Member"}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)] inline-flex items-center gap-1 shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                Pending
                                            </span>
                                        </div>

                                        {/* Date Range & Leave Type Pill */}
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                                {formatLeaveDateRange(leave.date, leave.endDate)}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                                                {leave.type} Leave
                                            </span>
                                        </div>

                                        {/* Quota Status */}
                                        <div className="mt-2.5">
                                            {leave.isPaidLeaveQuotaUsed ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    Quota Used ({leave.approvedLeavesThisMonth || 1}/1) → LWP
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Quota Available (0/1) → Paid Leave
                                                </span>
                                            )}
                                        </div>

                                        {/* Reason Box */}
                                        <div className="mt-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                                            <p className="text-xs text-slate-300 italic line-clamp-2">
                                                &ldquo;{leave.reason || "No reason specified"}&rdquo;
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions & Drawer Hint */}
                                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={isActioning}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAction(leave._id, "Approved");
                                                }}
                                                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isActioning}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAction(leave._id, "Rejected");
                                                }}
                                                className="flex-1 py-2.5 bg-slate-950/80 border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                <X className="w-3.5 h-3.5 stroke-[3]" />
                                                Reject
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors pt-0.5">
                                            <span>Click card for Smart Context</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* COMPACT & FILTERABLE LEAVE HISTORY TABLE */}
            <div className="space-y-4">
                {/* Section Title & Filter Controls Bar */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <History className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Leave History Archive</h2>
                    </div>

                    {/* Filters and Search Bar */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-56">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        {/* Month Filter */}
                        <select
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                        >
                            <option value="ALL">All Months</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                        >
                            <option value="ALL">All Status</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        {/* Leave Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                        >
                            <option value="ALL">All Types</option>
                            {availableTypes.map(t => (
                                <option key={t} value={t}>{t} Leave</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                                    <th className="px-5 py-3.5 font-semibold">Employee</th>
                                    <th className="px-5 py-3.5 font-semibold">Date Range</th>
                                    <th className="px-5 py-3.5 font-semibold">Type</th>
                                    <th className="px-5 py-3.5 font-semibold">Reason</th>
                                    <th className="px-5 py-3.5 font-semibold">Pay Impact</th>
                                    <th className="px-5 py-3.5 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80">
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                                            No leave history records matching your current filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map(leave => (
                                        <tr
                                            key={leave._id}
                                            onClick={() => setDrawerLeave(leave)}
                                            className="even:bg-slate-900/30 odd:bg-slate-900/10 hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-white text-sm">
                                                    {leave.userId?.name || "Unknown"}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {leave.userId?.role || "Staff Member"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-slate-300">
                                                {formatLeaveDateRange(leave.date, leave.endDate)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                                                    {leave.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-300 max-w-xs truncate italic">
                                                {leave.reason || "—"}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                        leave.isPaidLeaveQuotaUsed
                                                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                                    }`}
                                                >
                                                    {leave.payImpactText ||
                                                        (leave.isPaidLeaveQuotaUsed
                                                            ? "LWP"
                                                            : "Paid Leave (1 Quota)")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {leave.status === "Approved" ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                        Rejected
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-800">
                        {filteredHistory.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                No leave history records matching your current filter criteria.
                            </div>
                        ) : (
                            filteredHistory.map(leave => (
                                <div
                                    key={leave._id}
                                    onClick={() => setDrawerLeave(leave)}
                                    className="p-4 space-y-2.5 hover:bg-slate-800/40 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">
                                                {leave.userId?.name || "Unknown Employee"}
                                            </h4>
                                            <p className="text-xs text-slate-400">
                                                {formatLeaveDateRange(leave.date, leave.endDate)} •{" "}
                                                <span className="text-slate-300 font-semibold">{leave.type} Leave</span>
                                            </p>
                                        </div>
                                        {leave.status === "Approved" ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                Approved
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                                Rejected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-300 italic">
                                        &ldquo;{leave.reason || "No reason specified"}&rdquo;
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* INTERACTIVE 'SMART CONTEXT' RIGHT DRAWER */}
            {drawerLeave && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop Overlay */}
                    <div
                        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
                        onClick={() => setDrawerLeave(null)}
                    />

                    {/* Slide-out Drawer Panel */}
                    <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base shadow-sm">
                                    {drawerLeave.userId?.name?.[0]?.toUpperCase() || "E"}
                                </div>
                                <div>
                                    <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                                        Employee Smart Context
                                    </span>
                                    <h3 className="text-lg font-bold text-white">
                                        {drawerLeave.userId?.name || "Employee Details"}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {drawerLeave.userId?.role || "Staff Member"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDrawerLeave(null)}
                                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* 1. Request Details Card */}
                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                                        Selected Leave Request
                                    </span>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                                            drawerLeave.status === "Approved"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                : drawerLeave.status === "Rejected"
                                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                        }`}
                                    >
                                        {drawerLeave.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                    <div>
                                        <p className="text-slate-500">Leave Type</p>
                                        <p className="font-bold text-white mt-0.5">{drawerLeave.type} Leave</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Date Range</p>
                                        <p className="font-bold text-white mt-0.5">
                                            {formatLeaveDateRange(drawerLeave.date, drawerLeave.endDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-900">
                                    <p className="text-xs text-slate-500 mb-1">Reason provided</p>
                                    <p className="text-xs text-slate-200 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                                        &ldquo;{drawerLeave.reason || "No reason specified"}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {/* 2. Employee Leave Balances (CL, SL, EL) */}
                            {drawerEmployeeStats && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                                        Current Leave Balances (Annual Policy)
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* CL Card */}
                                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                Casual (CL)
                                            </span>
                                            <p className="text-2xl font-black text-white font-mono mt-1">
                                                {drawerEmployeeStats.clBalance.remaining}
                                                <span className="text-xs font-normal text-slate-500">
                                                    /{drawerEmployeeStats.clBalance.quota}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Used: {drawerEmployeeStats.clBalance.used}
                                            </p>
                                        </div>

                                        {/* SL Card */}
                                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                Sick (SL)
                                            </span>
                                            <p className="text-2xl font-black text-white font-mono mt-1">
                                                {drawerEmployeeStats.slBalance.remaining}
                                                <span className="text-xs font-normal text-slate-500">
                                                    /{drawerEmployeeStats.slBalance.quota}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Used: {drawerEmployeeStats.slBalance.used}
                                            </p>
                                        </div>

                                        {/* EL Card */}
                                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                Earned (EL)
                                            </span>
                                            <p className="text-2xl font-black text-white font-mono mt-1">
                                                {drawerEmployeeStats.elBalance.remaining}
                                                <span className="text-xs font-normal text-slate-500">
                                                    /{drawerEmployeeStats.elBalance.quota}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">
                                                Used: {drawerEmployeeStats.elBalance.used}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Recent Leave History for Employee */}
                            {drawerEmployeeStats && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                                        Recent Leave Requests ({drawerEmployeeStats.empName})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {drawerEmployeeStats.history.map(item => (
                                            <div
                                                key={item._id}
                                                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <span className="font-bold text-white">{item.type} Leave</span>
                                                    <span className="text-slate-500 mx-1.5">•</span>
                                                    <span className="text-slate-400 font-mono">
                                                        {formatLeaveDateRange(item.date, item.endDate)}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        item.status === "Approved"
                                                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                                            : item.status === "Rejected"
                                                            ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                                            : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer Actions */}
                        {drawerLeave.status === "Pending" ? (
                            <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAction(drawerLeave._id, "Approved")}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    Approve Authorization
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAction(drawerLeave._id, "Rejected")}
                                    className="flex-1 py-3 bg-slate-950 border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4 stroke-[3]" />
                                    Reject Application
                                </button>
                            </div>
                        ) : (
                            <div className="p-5 border-t border-slate-800 bg-slate-900/90 text-center">
                                <p className="text-xs text-slate-400">
                                    This request is currently marked as{" "}
                                    <span className="font-bold text-white uppercase">{drawerLeave.status}</span>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}