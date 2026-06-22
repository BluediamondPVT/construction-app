"use client";

import { useState, useEffect } from "react";
import { Users, Eye, X, CheckCircle, AlertCircle, CalendarRange } from "lucide-react";

export default function StaffDirectoryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Drawer/Modal States
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<{ attendances: any[]; leaves: any[] }>({ attendances: [], leaves: [] });
  const [isModalLoading, setIsModalLoading] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hr/users");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openProfileView = async (user: any) => {
    setSelectedUser(user);
    setIsModalLoading(true);
    try {
      const res = await fetch(`/api/hr/users/history?userId=${user._id}`);
      const data = await res.json();
      setHistoryData({ attendances: data.attendances || [], leaves: data.leaves || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  // Calendar logic rendering inside profile card
  const currentYear = 2026;
  const currentMonth = 6; // June
  const daysInMonth = Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1);

  const getDayMetrics = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const leave = historyData.leaves.find(l => l.date === formattedDate && l.status === "Approved");
    if (leave) return { type: "leave", tag: leave.type };

    const att = historyData.attendances.find(a => a.date === formattedDate);
    if (att) return { type: att.status === "Present" ? "present" : "missed", tag: null };

    return { type: "empty", tag: null };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Users className="mr-2 h-6 w-6 text-blue-500" /> Staff & Labor Directory
        </h1>
        <p className="text-sm text-slate-500">Access corporate directory metrics and track historical attendance maps.</p>
      </div>

      {/* LIST TABLE CONTAINER */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 text-xs font-semibold uppercase text-slate-500">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Corporate Email</th>
              <th className="px-6 py-4">Assigned Role</th>
              <th className="px-6 py-4 text-right">Profile Track</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-white/10 text-sm">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-10 text-slate-500">Syncing indexes...</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                  <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-500">{emp.role}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openProfileView(emp)} className="p-2 bg-slate-100 hover:bg-blue-500/10 hover:text-blue-500 dark:bg-slate-800 text-slate-400 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-bold">
                      <Eye className="h-4 w-4"/> View History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 360-DEGREE ATTENDANCE TRACKER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border dark:border-slate-800 p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUser.name} — Logs Dashboard</h3>
                <p className="text-xs text-slate-500">{selectedUser.role} Department Portfolio</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:text-red-500"><X className="h-5 w-5"/></button>
            </div>

            {isModalLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 animate-pulse">Recompiling timeline registers...</div>
            ) : (
              <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                {/* Visual Tracker Details */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center mb-4">
                    <CalendarRange className="h-4 w-4 mr-1.5 text-blue-500" /> Shift History Calendar (June 2026)
                  </h4>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
                    {daysInMonth.map((day) => {
                      const dayMetrics = getDayMetrics(day);
                      let borderClass = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                      let indicator = null;

                      if (dayMetrics.type === "present") {
                        borderClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-500";
                        indicator = <CheckCircle className="h-3 w-3 absolute bottom-1.5 right-1.5" />;
                      } else if (dayMetrics.type === "missed") {
                        borderClass = "bg-rose-500/10 border-rose-500/30 text-rose-500";
                        indicator = <AlertCircle className="h-3 w-3 absolute bottom-1.5 right-1.5" />;
                      } else if (dayMetrics.type === "leave") {
                        borderClass = "bg-blue-500/10 border-blue-500/30 text-blue-500";
                        indicator = <span className="text-[10px] font-extrabold absolute bottom-1 right-1.5 uppercase">{dayMetrics.tag}</span>;
                      }

                      return (
                        <div key={day} className={`relative p-3 rounded-xl border font-bold text-center flex flex-col h-14 justify-start items-start ${borderClass}`}>
                          <span className="text-sm opacity-80">{day}</span>
                          {indicator}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Guide Footer */}
                <div className="flex gap-4 text-xs font-semibold text-slate-500 justify-center">
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-emerald-500 mr-1.5" /> Checked Shift</span>
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-rose-500 mr-1.5" /> Missed Check</span>
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-blue-500 mr-1.5" /> Approved Leave</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}