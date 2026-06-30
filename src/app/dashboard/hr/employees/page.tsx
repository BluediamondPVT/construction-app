"use client";

import { useState, useEffect } from "react";
import { Users, Eye, X, CheckCircle, AlertCircle, CalendarRange, Clock, Save } from "lucide-react";

export default function StaffDirectoryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Drawer/Modal States
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<{ attendances: any[]; leaves: any[] }>({ attendances: [], leaves: [] });
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Manual Edit States
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editInTime, setEditInTime] = useState("");
  const [editOutTime, setEditOutTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const currentYear = 2026;
  const currentMonth = 6; 
  const daysInMonth = Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1);

  const getDayMetrics = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const leave = historyData.leaves.find(l => l.date === formattedDate && l.status === "Approved");
    if (leave) return { type: "leave", tag: leave.type, rawData: null };

    const att = historyData.attendances.find(a => a.date === formattedDate);
    if (att) return { type: att.status === "Present" ? "present" : "missed", tag: null, rawData: att };

    return { type: "empty", tag: null, rawData: null };
  };

 // 🚀 Updated handleDateClick
  const handleDateClick = (day: number) => {
    const isAdminOrHR = true; 
    if (!isAdminOrHR) return;

    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const metrics = getDayMetrics(day);

    if (metrics.rawData) {
      setEditInTime(metrics.rawData.punchIn?.time ? new Date(metrics.rawData.punchIn.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' }) : "");
      setEditOutTime(metrics.rawData.punchOut?.time ? new Date(metrics.rawData.punchOut.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' }) : "");
      setEditNote(metrics.rawData.hrNotes || "");
    } else {
      setEditInTime("");
      setEditOutTime("");
      setEditNote("");
    }
    setEditingDate(formattedDate);
  };
  const saveManualEntry = async () => {
    if (!editInTime && !editOutTime) return alert("Please add In or Out time.");
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/hr/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          date: editingDate,
          inTime: editInTime,
          outTime: editOutTime,
          hrNote: editNote
        })
      });
      
      if (res.ok) {
        setEditingDate(null);
        openProfileView(selectedUser);
      } else {
        alert("Failed to update.");
      }
    } catch (err) {
      alert("Network Error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Users className="mr-2 h-6 w-6 text-blue-500" /> Staff & Labor Directory
        </h1>
        <p className="text-sm text-slate-500">Access corporate directory metrics and track historical attendance maps.</p>
      </div>

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
            {isLoading ? <tr><td colSpan={4} className="text-center py-10 text-slate-500">Syncing...</td></tr> : employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-500">{emp.role}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openProfileView(emp)} className="p-2 bg-slate-100 hover:bg-blue-500/10 hover:text-blue-500 dark:bg-slate-800 text-slate-400 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-bold">
                    <Eye className="h-4 w-4"/> View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border dark:border-slate-800 p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedUser.name} — Logs</h3>
                <p className="text-xs text-slate-500">{selectedUser.email} • {selectedUser.role}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:text-red-500"><X className="h-5 w-5"/></button>
            </div>

            {isModalLoading ? <div className="h-48 flex items-center justify-center animate-pulse text-slate-400">Loading...</div> : (
              <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Shift History Calendar</h4>
                  <div className="grid grid-cols-7 gap-3">
                    {daysInMonth.map((day) => {
                      const dayMetrics = getDayMetrics(day);
                      let borderClass = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                      let indicator = null;
                      if (dayMetrics.type === "present") { borderClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"; indicator = <CheckCircle className="h-3 w-3 absolute bottom-1.5 right-1.5" />; }
                      else if (dayMetrics.type === "missed") { borderClass = "bg-rose-500/10 border-rose-500/30 text-rose-500"; indicator = <AlertCircle className="h-3 w-3 absolute bottom-1.5 right-1.5" />; }
                      
                      return (
                        <div key={day} onClick={() => handleDateClick(day)} className={`relative p-3 rounded-xl border font-bold text-center h-14 cursor-pointer hover:border-blue-500 transition-all ${borderClass}`}>
                          {day} {indicator}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

     {/* 🚀 MODAL 2: EDIT MODAL - Z-INDEX 70 aur RETURN ke end mein */}
      {editingDate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Manual Log Update</h3>
                <button onClick={() => setEditingDate(null)}><X className="h-5 w-5"/></button>
             </div>
             {/* Form code same as before... */}
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <input type="time" value={editInTime} onChange={(e) => setEditInTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" />
                 <input type="time" value={editOutTime} onChange={(e) => setEditOutTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" />
               </div>
               <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" />
               <button onClick={saveManualEntry} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold">Save Log</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}