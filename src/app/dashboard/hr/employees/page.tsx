"use client";

import { useState, useEffect } from "react";
import { Users, Eye, X, CheckCircle, AlertCircle, CalendarRange, Clock, Save, Mail, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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

  // Dynamic Month States
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
    if (!editInTime && !editOutTime) {
      toast.error("Please add In or Out time.");
      return;
    }
    
    setIsSaving(true);
    const toastId = toast.loading("Saving attendance entry...");
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
        toast.success("Attendance record updated successfully.", { id: toastId });
        setEditingDate(null);
        openProfileView(selectedUser);
      } else {
        toast.error("Failed to update attendance record.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while updating attendance record.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });

  // 🎨 NEON THEMES (For rotating/random border colors)
  const neonThemes = [
    { wrapper: "bg-amber-500/5 border-amber-500/40 hover:bg-amber-500/10 hover:border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]", button: "hover:bg-amber-500/20 border-slate-700 hover:border-amber-500/50 hover:text-amber-400 text-slate-300" },
    { wrapper: "bg-emerald-500/5 border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]", button: "hover:bg-emerald-500/20 border-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300" },
    { wrapper: "bg-rose-500/5 border-rose-500/40 hover:bg-rose-500/10 hover:border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]", button: "hover:bg-rose-500/20 border-slate-700 hover:border-rose-500/50 hover:text-rose-400 text-slate-300" },
    { wrapper: "bg-blue-500/5 border-blue-500/40 hover:bg-blue-500/10 hover:border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]", button: "hover:bg-blue-500/20 border-slate-700 hover:border-blue-500/50 hover:text-blue-400 text-slate-300" },
    { wrapper: "bg-purple-500/5 border-purple-500/40 hover:bg-purple-500/10 hover:border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]", button: "hover:bg-purple-500/20 border-slate-700 hover:border-purple-500/50 hover:text-purple-400 text-slate-300" },
  ];

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center tracking-tight">
          <Users className="mr-3 h-6 w-6 text-blue-500" /> Staff & Labor Directory
        </h1>
        <p className="text-sm text-slate-400 mt-1">Access corporate directory metrics and track historical attendance maps.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-blue-400/70 animate-pulse text-sm font-semibold tracking-widest uppercase">Syncing indexes...</div>
      ) : (
        <div className="w-full">
          {/* 📱 MOBILE VIEW (Mobile First Layout with Rotating Colored Borders) */}
          <div className="md:hidden space-y-4">
            {employees.map((emp, idx) => {
              const theme = neonThemes[idx % neonThemes.length];
              return (
                <div key={emp._id} className={`backdrop-blur-xl rounded-2xl border p-5 transition-all duration-300 ${theme.wrapper}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg tracking-wide">{emp.name}</h3>
                      <div className="flex items-center text-slate-400 text-xs mt-1.5"><Mail className="h-3 w-3 mr-1.5" /> {emp.email}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border flex items-center ${theme.badge}`}>
                      <Briefcase className="h-3 w-3 mr-1.5" /> {emp.role}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-800/50">
                    <button onClick={() => openProfileView(emp)} className={`w-full py-2.5 bg-slate-900/40 border transition-all flex items-center justify-center gap-2 text-sm font-bold rounded-xl ${theme.button}`}>
                      <Eye className="h-4 w-4"/> View History & Logs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 💻 DESKTOP VIEW (List view with colored accents on hover) */}
          <div className="hidden md:block bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-5">Name</th>
                  <th className="px-6 py-5">Corporate Email</th>
                  <th className="px-6 py-5">Assigned Role</th>
                  <th className="px-6 py-5 text-right">Profile Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {employees.map((emp, idx) => {
                  const theme = neonThemes[idx % neonThemes.length];
                  return (
                    <tr key={emp._id} className={`hover:bg-slate-800/30 transition-colors group`}>
                      <td className="px-6 py-4 font-bold text-white">{emp.name}</td>
                      <td className="px-6 py-4 text-slate-400">{emp.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>{emp.role}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openProfileView(emp)} className={`p-2.5 bg-slate-900/40 border transition-all inline-flex items-center gap-2 text-xs font-bold rounded-xl ${theme.button}`}>
                          <Eye className="h-4 w-4"/> View Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📅 MODAL 1: History Viewer (Calendar) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1121] border border-slate-700/50 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-800/80 bg-slate-900/20">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">{selectedUser.name} <span className="text-slate-600 font-light hidden sm:inline-block">— Logs</span></h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">{selectedUser.email} • <span className="text-blue-400 font-semibold uppercase">{selectedUser.role}</span></p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-slate-800 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-full transition-all">
                <X className="h-5 w-5"/>
              </button>
            </div>

            {isModalLoading ? <div className="h-64 flex items-center justify-center animate-pulse text-blue-400 font-mono tracking-widest text-sm">FETCHING DATA...</div> : (
              <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar">
                
                <div className="flex items-center justify-between mb-5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
                  <button onClick={handlePrevMonth} className="p-2.5 hover:bg-slate-800 border border-transparent hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="font-bold text-sm sm:text-base text-white uppercase tracking-widest">
                    {monthName} <span className="text-blue-400">{currentYear}</span>
                  </h3>
                  <button onClick={handleNextMonth} className="p-2.5 hover:bg-slate-800 border border-transparent hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6 flex flex-wrap gap-3 sm:gap-5 text-[10px] sm:text-xs font-bold text-slate-400 justify-center uppercase tracking-wider">
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] mr-2"></div> Present</span>
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] mr-2"></div> Missed Out</span>
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] mr-2"></div> Approved Leave</span>
                  <span className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] mr-2"></div> Pending Leave</span>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-2 text-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {weekdays.map((wd) => (<div key={wd}>{wd}</div>))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                  {emptyDays.map((_, idx) => (
                    <div key={`empty-${idx}`} className="bg-transparent border border-transparent rounded-xl min-h-[48px] sm:min-h-[64px]"></div>
                  ))}

                  {daysInMonth.map((day) => {
                    const dayMetrics = getDayMetrics(day);
                    let borderClass = "bg-slate-900/40 border-slate-800 text-slate-400";
                    let indicator = null;

                    if (dayMetrics.type === "present") { 
                      borderClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]"; 
                      indicator = <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 opacity-80" />; 
                    } else if (dayMetrics.type === "missed") { 
                      borderClass = "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[inset_0_0_15px_rgba(244,63,94,0.05)]"; 
                      indicator = <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 opacity-80" />; 
                    } else if (dayMetrics.type === "leave") {
                      const isApproved = dayMetrics.status === "Approved";
                      borderClass = isApproved 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]" 
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[inset_0_0_15px_rgba(245,158,11,0.05)]";
                      indicator = (
                        <>
                          <span className={`absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider hidden sm:inline-block ${isApproved ? 'text-blue-500' : 'text-amber-500'}`}>
                            {dayMetrics.tag}
                          </span>
                          <CalendarRange className="h-3 w-3 sm:h-4 sm:w-4 absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 opacity-80" />
                        </>
                      );
                    }
                    
                    return (
                      <div key={day} onClick={() => handleDateClick(day)} className={`relative p-2 sm:p-3 rounded-xl border font-bold text-center h-12 sm:h-16 flex items-start justify-start cursor-pointer hover:border-slate-500 hover:bg-slate-800/80 transition-all duration-200 ${borderClass}`}>
                        <span className="text-xs sm:text-sm">{day}</span> 
                        {indicator}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✏️ MODAL 2: EDIT MODAL */}
      {editingDate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-[#0B1121] rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50">
             <div className="flex justify-between items-center mb-5">
               <h3 className="text-lg font-bold text-white flex items-center tracking-wide">
                 <Clock className="w-5 h-5 mr-2 text-blue-500"/> Manual Update
               </h3>
               <button onClick={() => setEditingDate(null)} className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><X className="h-5 w-5"/></button>
             </div>
             
             <div className="flex items-center justify-between text-xs text-slate-400 mb-5 pb-5 border-b border-slate-800">
                <span className="uppercase tracking-widest font-semibold">Target Date</span>
                <strong className="text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">{editingDate}</strong>
             </div>

             <div className="space-y-5">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Punch In</label>
                   <input type="time" value={editInTime} onChange={(e) => setEditInTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors [color-scheme:dark]" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Punch Out</label>
                   <input type="time" value={editOutTime} onChange={(e) => setEditOutTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors [color-scheme:dark]" />
                 </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">HR Operations Note</label>
                  <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Reason for manual edit..." className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors placeholder:text-slate-600" />
               </div>
               
               <button onClick={saveManualEntry} disabled={isSaving} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold mt-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center">
                 {isSaving ? (
                    <span className="animate-pulse tracking-widest">SAVING...</span>
                  ) : (
                    <><Save className="w-4 h-4 mr-2"/> CONFIRM UPDATE</>
                  )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}