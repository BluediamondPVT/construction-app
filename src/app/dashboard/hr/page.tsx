"use client";

import { useEffect, useState } from "react";
import { Users, Clock, ClipboardList, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import AttendanceCard from "@/components/AttendanceCard";

export default function HROverviewDashboard() {
  const [stats, setStats] = useState({ totalStaff: 0, activeToday: 0, pendingLeaves: 0 });

  useEffect(() => {
    // Dynamic overview pipeline calculations with fail-safes
    Promise.all([
      fetch("/api/hr/users").then(res => res.ok ? res.json() : { employees: [] }),
      fetch("/api/hr/attendance").then(res => res.ok ? res.json() : { attendances: [] }),
      fetch("/api/hr/leaves").then(res => res.ok ? res.json() : { leaves: [] })
    ]).then(([usersData, attData, leavesData]) => {
      setStats({
        totalStaff: usersData.employees?.length || 0,
        activeToday: attData.attendances?.filter((a: any) => a.status === "In Progress" || a.status === "Present").length || 0,
        pendingLeaves: leavesData.leaves?.length || 0
      });
    }).catch(err => console.error("Dashboard Stats Error:", err));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AttendanceCard />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <LayoutDashboard className="mr-2 text-blue-500" /> HR Administration Hub
        </h1>
        <p className="text-sm text-slate-500 mt-1">High-level enterprise operation logs and resource status summaries.</p>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/dashboard/hr/employees" className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border p-6 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Total Personnel</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalStaff} Workers</span>
          </div>
          <Users className="h-8 w-8 text-blue-500 opacity-80" />
        </Link>

        <Link href="/dashboard/hr/attendance" className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border p-6 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Punched In Today</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.activeToday} Active</span>
          </div>
          <Clock className="h-8 w-8 text-emerald-500 opacity-80" />
        </Link>

        <Link href="/dashboard/hr/leaves" className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border p-6 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Leave Filings</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.pendingLeaves} Pending</span>
          </div>
          <ClipboardList className="h-8 w-8 text-yellow-500 opacity-80" />
        </Link>
      </div>
    </div>
  );
}