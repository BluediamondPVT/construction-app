"use client";

import { useState, useEffect } from "react";
import { Users, Eye, X, CheckCircle, AlertCircle, CalendarRange, Clock, Save, Mail, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";

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

  // 🚀 NAYA: Dynamic Month States
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

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

  // 🚀 NAYA: User history fetch logic (Ab month aur year bhi bhejega, API support karti hai toh theek warna poora history filter karenge)
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

  const daysInMonth = Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1);
  const startDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Month Change Handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDayMetrics = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const leave = historyData.leaves.find(l => l.date === formattedDate);
    if (leave) return { type: "leave", tag: leave.type, status: leave.status, rawData: null };

    const att = historyData.attendances.find(a => a.date === formattedDate);
    if (att) return { type: att.status === "Present" ? "present" : "missed", tag: null, status: null, rawData: att };

    return { type: "empty", tag: null, status: null, rawData: null };
  };

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

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Users className="mr-2 h-6 w-6 text-blue-500" /> Staff & Labor Directory
        </h1>
        <p className="text-sm text-slate-500">Access corporate directory metrics and track historical attendance maps.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">Syncing indexes...</div>
      ) : (
        <div className="w-full">
          {/* DESKTOP VIEW */}
          <div className="hidden md:block bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 overflow-hidden">
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
                {employees.map((emp) => (
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

          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-4">
            {employees.map((emp) => (
              <div key={emp._id} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{emp.name}</h3>
                    <div className="flex items-center text-slate-500 text-xs mt-1"><Mail className="h-3 w-3 mr-1" /> {emp.email}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-blue-500/10 text-blue-500 flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {emp.role}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <button onClick={() => openProfileView(emp)} className="w-full py-2.5 bg-slate-50 hover:bg-blue-500/10 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm">
                    <Eye className="h-4 w-4"/> View History & Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: History Viewer (Upgraded for Mobile & Month Navigation) */}
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
                  
                  {/* 🚀 NAYA: Navigation Header inside Calendar */}
                  <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-800/50 p-2 rounded-2xl border dark:border-slate-700 shadow-sm">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                      <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white uppercase tracking-wider">
                      {monthName} {currentYear}
                    </h3>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                      <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  {/* 💡 Legend */}
                  <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 justify-center">
                    <span className="flex items-center"><div className="w-3 h-3 rounded bg-emerald-500 mr-1.5"></div> Present</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded bg-rose-500 mr-1.5"></div> Missed Out</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded bg-blue-500 mr-1.5"></div> Approved Leave</span>
                    <span className="flex items-center"><div className="w-3 h-3 rounded bg-amber-500 mr-1.5"></div> Pending/Other Leave</span>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {weekdays.map((wd) => (
                      <div key={wd}>{wd}</div>
                    ))}
                  </div>

                  {/* 🚀 Upgraded Responsive Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-3">
                    {/* Empty offset days */}
                    {emptyDays.map((_, idx) => (
                      <div key={`empty-${idx}`} className="bg-transparent border border-transparent rounded-xl min-h-[40px] sm:min-h-[56px]"></div>
                    ))}

                    {/* Actual month days */}
                    {daysInMonth.map((day) => {
                      const dayMetrics = getDayMetrics(day);
                      let borderClass = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                      let indicator = null;
                      if (dayMetrics.type === "present") { 
                        borderClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"; 
                        indicator = <CheckCircle className="h-3 w-3 absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5" />; 
                      } else if (dayMetrics.type === "missed") { 
                        borderClass = "bg-rose-500/10 border-rose-500/30 text-rose-500"; 
                        indicator = <AlertCircle className="h-3 w-3 absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5" />; 
                      } else if (dayMetrics.type === "leave") {
                        const isApproved = dayMetrics.status === "Approved";
                        borderClass = isApproved 
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                          : "bg-amber-500/10 border-amber-500/30 text-amber-500";
                        indicator = (
                          <>
                            <span className={`absolute bottom-1 left-2 text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${isApproved ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {dayMetrics.tag}
                            </span>
                            <CalendarRange className="h-3 w-3 absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5" />
                          </>
                        );
                      }
                      
                      return (
                        <div key={day} onClick={() => handleDateClick(day)} className={`relative p-1.5 sm:p-3 rounded-xl border font-bold text-center h-10 sm:h-14 flex items-start justify-start cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all ${borderClass}`}>
                          <span className="text-xs sm:text-sm">{day}</span> 
                          {indicator}
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

      {/* MODAL 2: EDIT MODAL */}
      {editingDate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500"/> Manual Update
                </h3>
                <button onClick={() => setEditingDate(null)} className="text-slate-400 hover:text-red-500"><X className="h-5 w-5"/></button>
             </div>
             
             <p className="text-xs text-slate-500 mb-4 pb-4 border-b dark:border-slate-800">Date: <strong className="text-blue-500">{editingDate}</strong></p>

             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase">In Time</label>
                   <input type="time" value={editInTime} onChange={(e) => setEditInTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm mt-1 outline-none" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Out Time</label>
                   <input type="time" value={editOutTime} onChange={(e) => setEditOutTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm mt-1 outline-none" />
                 </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">HR Note</label>
                  <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Reason for edit..." className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm mt-1 outline-none" />
               </div>
               <button onClick={saveManualEntry} disabled={isSaving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold mt-2 shadow-lg transition-all flex items-center justify-center">
                 {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2"/> Save Log</>}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}