"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, AlertTriangle, Map, Edit2, Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 10 + i);

export default function LiveAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  
  // Date Filter State
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [editForm, setEditForm] = useState({
    date: "",
    punchInTime: "",
    punchOutTime: "",
    status: "",
    hrNotes: ""
  });

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/attendance?date=${selectedDate}`);
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchAttendance(); 
  }, [selectedDate]);

  const openEditModal = (att: any) => {
    setEditingRecord(att);
    const inTimeStr = att.punchIn?.time ? new Date(att.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "";
    const outTimeStr = att.punchOut?.time ? new Date(att.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "";
    setEditForm({
      date: att.date || "",
      punchInTime: inTimeStr,
      punchOutTime: outTimeStr,
      status: att.status || "Absent",
      hrNotes: att.hrNotes || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const toastId = toast.loading("Saving attendance record...");
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: editingRecord._id,
          ...editForm
        }),
      });
      if (res.ok) {
        toast.success("Attendance record updated successfully.", { id: toastId });
        setEditingRecord(null);
        fetchAttendance();
      } else {
        toast.error("Failed to save attendance record.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while saving attendance record.", { id: toastId });
    }
  };

  // 🎨 Status-Based Theme Generator
  const getStatusTheme = (status: string) => {
    switch(status) {
      case "Present": return { wrapper: "border-emerald-500/40 hover:border-emerald-500/80 hover:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]", badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]", icon: "text-emerald-400" };
      case "Absent":
      case "Missed Out": return { wrapper: "border-rose-500/40 hover:border-rose-500/80 hover:bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.05)]", badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]", icon: "text-rose-400" };
      case "In Progress": return { wrapper: "border-blue-500/40 hover:border-blue-500/80 hover:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.05)]", badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]", icon: "text-blue-400" };
      default: return { wrapper: "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50", badge: "bg-slate-800 text-slate-400 border border-slate-700", icon: "text-slate-400" };
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* 🚀 HEADER WITH PREMIUM DATE PICKER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center tracking-tight">
            <Clock className="mr-3 h-6 w-6 text-blue-500" /> 
            {selectedDate === todayStr ? "Real-time Site Attendance" : "Historical Attendance"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            {selectedDate === todayStr 
              ? "View real-time check-in coordinates and patch shifts." 
              : `Viewing records for ${selectedDate.split("-").reverse().join("/")}`}
          </p>
        </div>

        {/* Premium React DatePicker (Forced Dark Theme) */}
        <div className="relative flex items-center bg-slate-900/60 p-2.5 px-4 rounded-2xl border border-slate-700/80 shadow-[0_0_15px_rgba(0,0,0,0.2)] w-fit self-start md:self-auto hover:border-blue-500/50 transition-colors group z-40 cursor-pointer backdrop-blur-md">
          <Calendar className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <DatePicker
            selected={new Date(selectedDate + 'T00:00:00')}
            onChange={(date: Date | null) => {
              if (date) {
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                setSelectedDate(adjustedDate.toISOString().split("T")[0]);
              }
            }}
            maxDate={new Date()}
            dateFormat="dd/MM/yyyy"
            renderCustomHeader={({
              date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled,
            }) => (
              <div className="p-3 sm:p-4 pb-2 bg-[#0B1121] border-b border-slate-800/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="text-base sm:text-lg font-bold text-white tracking-wide">{MONTHS[date.getMonth()]} {date.getFullYear()}</span>
                  </div>
                  <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="relative">
                    <select value={MONTHS[date.getMonth()]} onChange={({ target: { value } }) => changeMonth(MONTHS.indexOf(value))} className="appearance-none bg-slate-900 border border-slate-700 rounded-xl px-3 sm:px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-200 outline-none cursor-pointer hover:border-blue-500 transition-colors">
                      {MONTHS.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(Number(value))} className="appearance-none bg-slate-900 border border-slate-700 rounded-xl px-3 sm:px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-200 outline-none cursor-pointer hover:border-blue-500 transition-colors">
                      {YEARS.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
            popperPlacement="bottom-end"
            className="bg-transparent border-none outline-none text-sm font-bold text-slate-200 w-24 cursor-pointer placeholder:text-slate-500"
            calendarClassName="shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-slate-700/50 rounded-3xl bg-[#0B1121] text-slate-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-blue-400/70 animate-pulse bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 text-sm font-bold tracking-widest uppercase shadow-sm">
          Syncing records...
        </div>
      ) : (
        <div className="w-full relative z-10">
          
          {/* 💻 DESKTOP VIEW */}
          <div className="hidden md:block bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-5 w-1/5">Employee</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 w-1/4">Punch IN</th>
                  <th className="px-6 py-5 w-1/4">Punch OUT</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {attendances.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-500 font-medium">No records found for this date.</td></tr>
                ) : attendances.map((att) => {
                  const theme = getStatusTheme(att.status);
                  return (
                    <tr key={att._id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{att.userId?.name}</div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">{att.userId?.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${theme.badge}`}>{att.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        {att.punchIn?.time ? (
                          <div>
                            <div className="font-bold text-white tracking-wide">{new Date(att.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="flex items-start mt-1.5 gap-1.5 text-[11px] text-slate-400">
                              <MapPin className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                              <span className="leading-tight line-clamp-2">{att.punchIn.location?.address || "Location fetched"}</span>
                            </div>
                            <button onClick={() => setSelectedMap({ lat: att.punchIn.location.latitude, lng: att.punchIn.location.longitude, name: att.userId?.name })} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center mt-1.5">View Map →</button>
                          </div>
                        ) : <span className="text-slate-600 font-bold">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {att.punchOut?.time ? (
                          <div>
                            <div className="font-bold text-white tracking-wide">{new Date(att.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="flex items-start mt-1.5 gap-1.5 text-[11px] text-slate-400">
                              <MapPin className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                              <span className="leading-tight line-clamp-2">{att.punchOut.location?.address || "Location fetched"}</span>
                            </div>
                            <button onClick={() => setSelectedMap({ lat: att.punchOut.location.latitude, lng: att.punchOut.location.longitude, name: att.userId?.name })} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center mt-1.5">View Map →</button>
                            {att.isEditedByHR && <span className="text-[10px] text-orange-400 flex items-center mt-1.5 font-bold tracking-wider bg-orange-500/10 px-2 py-0.5 rounded w-fit"><Edit2 className="h-2.5 w-2.5 mr-1" /> HR Fixed</span>}
                          </div>
                        ) : <span className={`text-xs font-bold flex items-center ${theme.icon}`}><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Missing</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(att)} className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center ml-auto transition-all shadow-sm">
                          <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📱 MOBILE VIEW: Premium Neon Cards */}
          <div className="md:hidden space-y-4">
            {attendances.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 font-medium">No records found.</div>
            ) : attendances.map((att) => {
              const theme = getStatusTheme(att.status);
              return (
                <div key={att._id} className={`bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-300 ${theme.wrapper}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg tracking-wide">{att.userId?.name}</h3>
                      <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{att.userId?.role}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider flex-shrink-0 ${theme.badge}`}>
                      {att.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-800/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Punch In</p>
                      {att.punchIn?.time ? (
                        <div>
                          <div className="text-sm font-bold text-white">{new Date(att.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[9px] leading-tight text-slate-400 mt-1 line-clamp-2">{att.punchIn.location?.address}</div>
                          <button onClick={() => setSelectedMap({ lat: att.punchIn.location.latitude, lng: att.punchIn.location.longitude, name: att.userId?.name })} className="text-[10px] text-blue-400 font-bold flex items-center mt-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded w-fit">📍 View Map</button>
                        </div>
                      ) : <span className="text-sm font-bold text-slate-600">-</span>}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Punch Out</p>
                      {att.punchOut?.time ? (
                        <div>
                          <div className="text-sm font-bold text-white">{new Date(att.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[9px] leading-tight text-slate-400 mt-1 line-clamp-2">{att.punchOut.location?.address}</div>
                          <button onClick={() => setSelectedMap({ lat: att.punchOut.location.latitude, lng: att.punchOut.location.longitude, name: att.userId?.name })} className="text-[10px] text-blue-400 font-bold flex items-center mt-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded w-fit">📍 View Map</button>
                          {att.isEditedByHR && <span className="text-[9px] text-orange-400 font-bold flex items-center mt-1.5 uppercase tracking-wider"><Edit2 className="h-2.5 w-2.5 mr-1" /> Fixed</span>}
                        </div>
                      ) : <span className={`text-[10px] font-bold flex items-center mt-1 px-2 py-1 rounded w-fit uppercase tracking-wider ${theme.badge}`}><AlertTriangle className="h-3 w-3 mr-1" /> Missing</span>}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/50">
                    <button onClick={() => openEditModal(att)} className="w-full py-2.5 bg-slate-800 border border-slate-700 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm">
                      <Edit2 className="h-4 w-4"/> Manual Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🗺️ MAP MODAL */}
      {selectedMap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1121] border border-slate-700/50 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/40">
              <h3 className="font-bold flex items-center text-white tracking-wide"><Map className="mr-2 h-5 w-5 text-blue-500" /> Location: {selectedMap.name}</h3>
              <button onClick={() => setSelectedMap(null)} className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <div className="w-full h-[400px]">
              <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${selectedMap.lat},${selectedMap.lng}&z=15&output=embed`} className="filter contrast-125 dark:invert dark:grayscale dark:brightness-75 dark:hue-rotate-180"></iframe>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-[#0B1121] rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-white flex items-center tracking-wide">
                 <Edit2 className="w-5 h-5 mr-2 text-blue-500"/> Override Shift
               </h3>
               <button onClick={() => setEditingRecord(null)} className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><X className="h-5 w-5"/></button>
             </div>

            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Date Target</label>
                <input type="date" className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 [color-scheme:dark] transition-colors"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Punch In</label>
                  <input type="time" className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 [color-scheme:dark] transition-colors"
                    value={editForm.punchInTime}
                    onChange={(e) => setEditForm({ ...editForm, punchInTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Punch Out</label>
                  <input type="time" className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 [color-scheme:dark] transition-colors"
                    value={editForm.punchOutTime}
                    onChange={(e) => setEditForm({ ...editForm, punchOutTime: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Shift Status</label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2.5 appearance-none border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 text-sm outline-none focus:border-blue-500 cursor-pointer transition-colors"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Missed Out">Missed Out</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Audit Note</label>
                <input type="text" placeholder="Reason for override..."
                  value={editForm.hrNotes}
                  onChange={(e) => setEditForm({ ...editForm, hrNotes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900/50 placeholder:text-slate-600 text-slate-200 outline-none text-sm focus:border-blue-500 transition-colors" />
              </div>
            </div>

            <button onClick={() => handleSaveEdit()} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center">
              CONFIRM OVERRIDE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}