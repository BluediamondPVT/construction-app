"use client";
import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import LeaveForm from "./LeaveForm";

import LeaveBalancesWidget from "./LeaveBalancesWidget";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  
  // Modals States
  const [selectedDateForLeave, setSelectedDateForLeave] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<{ date: string, data: any } | null>(null);
  const [holidayNotice, setHolidayNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // 🚀 Month Navigation States
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/monthly?month=${currentMonth}&year=${currentYear}`);
      const data = await res.json();
      setAttendances(data.attendances || []);
      setLeaves(data.leaves || []);
      setHolidays(data.holidays || []);
    } catch (err) {

      console.error("Failed to fetch calendar", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Jab bhi mahina ya saal badle, naya data fetch karo
  useEffect(() => {
    if (isOpen) fetchMonthData();
  }, [isOpen, currentMonth, currentYear]);

  if (!isOpen) return null;

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
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

  const getDayStatus = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const holiday = holidays.find(h => h.dateString === formattedDate);
    if (holiday) return { type: "holiday", data: holiday };

    const leave = leaves.find(l => l.date === formattedDate);
    if (leave) return { type: "leave", data: leave };

    const att = attendances.find(a => a.date === formattedDate);
    if (att) {
      if (att.status === "Present") return { type: "present", data: att };
      if (att.status === "Missed Out" || att.status === "In Progress") return { type: "missed", data: att };
    }

    return { type: "empty", data: null };
  };

  const handleDayClick = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = getDayStatus(day);
    const isPastDate = formattedDate < todayFormatted;

    if (status.type === "holiday") {
      setHolidayNotice(`🎉 ${status.data.name} is a declared Company-wide ${status.data.type} Holiday. Standard leave application is not needed as it is automatically treated as a Paid Holiday.`);
      return;
    }

    // 🚀 NAYA LOGIC: Agar record hai toh View Popup dikhao
    if (status.type === "present" || status.type === "missed") {
      setViewingRecord({ date: formattedDate, data: status.data });
    } 
    // Agar future/today date khali hai, toh leave apply karne do
    else if (status.type === "empty" && !isPastDate) {
      setSelectedDateForLeave(formattedDate);
    }
  };


  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* LEAVE APPLICATION MODAL */}
      {selectedDateForLeave ? (
        <LeaveForm 
          selectedDate={selectedDateForLeave} 
          onClose={() => setSelectedDateForLeave(null)} 
          onSuccess={() => {
            setSelectedDateForLeave(null);
            fetchMonthData();
          }} 
        />
      ) : 
      
      /* READ-ONLY VIEW MODAL (For Past Attendance) */
      viewingRecord ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative z-[70] animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-6 border-b dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold flex items-center text-slate-900 dark:text-white">
              <Clock className="mr-2 h-5 w-5 text-blue-500" /> Log Details
            </h3>
            <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-red-500"><X className="h-5 w-5"/></button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">Record for: <strong className="text-slate-900 dark:text-white">{viewingRecord.date}</strong></p>
            
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Punch In</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {viewingRecord.data.punchIn?.time ? new Date(viewingRecord.data.punchIn.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' }) : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Punch Out</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {viewingRecord.data.punchOut?.time ? new Date(viewingRecord.data.punchOut.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit' }) : "N/A"}
                </p>
              </div>
            </div>

            {viewingRecord.data.hrNotes && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">HR Note</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{viewingRecord.data.hrNotes}</p>
              </div>
            )}
          </div>
        </div>
      ) : 

      /* MAIN CALENDAR MODAL */
      (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
          
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 flex items-center justify-between p-3 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="mr-1.5 sm:mr-3 h-4 w-4 sm:h-7 sm:w-7 text-blue-500" />
              History & Leaves
            </h2>
            <button onClick={onClose} className="p-1 sm:p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-full transition-colors">
              <X className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-2 pb-6 sm:p-6">
            <div className="mb-4">
              <LeaveBalancesWidget />
            </div>

            {/* 🚀 Month Navigation Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-6 bg-slate-50 dark:bg-slate-800/50 p-1 sm:p-2 rounded-2xl border dark:border-slate-800">
              <button onClick={handlePrevMonth} className="p-1 sm:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
                <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h3 className="font-bold text-xs sm:text-lg text-slate-800 dark:text-white uppercase tracking-wider">
                {monthName} {currentYear}
              </h3>
              <button onClick={handleNextMonth} className="p-1 sm:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
                <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Legend */}
            <div className="mb-3 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-4 text-[8px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 justify-center sm:justify-start">
              <span className="flex items-center"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 mr-1 sm:mr-1.5"></div> Present</span>
              <span className="flex items-center"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-purple-500 mr-1 sm:mr-1.5"></div> Public Holiday</span>
              <span className="flex items-center"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-rose-500 mr-1 sm:mr-1.5"></div> Missed Out</span>
              <span className="flex items-center"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 mr-1 sm:mr-1.5"></div> Approved Leave</span>
              <span className="flex items-center"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500 mr-1 sm:mr-1.5"></div> Pending Leave</span>
            </div>

            {holidayNotice && (
              <div className="mb-4 p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs sm:text-sm font-semibold flex items-center justify-between">
                <span>{holidayNotice}</span>
                <button onClick={() => setHolidayNotice(null)} className="ml-2 font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950">✕</button>
              </div>
            )}


            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-4 mb-2 text-center text-[9px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {weekdays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center animate-pulse text-slate-400">Loading Calendar...</div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-4">
                {/* Empty offset days */}
                {emptyDays.map((_, idx) => (
                  <div key={`empty-${idx}`} className="bg-transparent border border-transparent rounded-xl min-h-[36px] sm:min-h-[80px]"></div>
                ))}

                {/* Actual month days */}
                {daysArray.map((day) => {
                  const formattedDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const status = getDayStatus(day);
                  const isPastDate = formattedDate < todayFormatted; 
                  
                  let bgClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"; 
                  let cursorClass = "cursor-pointer group hover:border-blue-400 hover:shadow-md";
                  let icon = null;

                  if (status.type === "present") {
                    bgClass = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-sm";
                    icon = <CheckCircle className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-emerald-500 mt-0.5 sm:mt-2" />;
                  } else if (status.type === "holiday") {
                    bgClass = "bg-purple-50 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/40 shadow-sm";
                    icon = (
                      <div className="mt-0.5 sm:mt-1 flex flex-col items-center">
                        <Sparkles className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-purple-600 dark:text-purple-300" />
                        <span className="text-[6px] sm:text-[9px] font-extrabold text-purple-700 dark:text-purple-200 truncate max-w-[44px] sm:max-w-[70px]" title={status.data.name}>
                          {status.data.name}
                        </span>
                      </div>
                    );
                  } else if (status.type === "missed") {

                    bgClass = "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 shadow-sm";
                    icon = <AlertCircle className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-rose-500 mt-0.5 sm:mt-2" />;
                  } else if (status.type === "leave") {
                    const isApproved = status.data.status === "Approved";
                    bgClass = isApproved 
                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                      : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30";
                    icon = <div className="mt-0.5 sm:mt-2 text-[6px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">{status.data.type}</div>;
                  } else if (status.type === "empty" && isPastDate) {
                    cursorClass = "cursor-not-allowed opacity-40";
                  }

                  return (
                    <div 
                      key={day} 
                      onClick={() => handleDayClick(day)}
                      className={`relative p-1 sm:p-4 rounded-lg sm:rounded-2xl border transition-all ${bgClass} ${cursorClass} min-h-[36px] sm:min-h-[80px] flex flex-col items-center sm:items-start`}
                    >
                      <span className="text-[10px] sm:text-lg font-bold text-slate-700 dark:text-slate-200">{day}</span>
                      {icon}
                      
                      {/* Hover Actions */}
                      {status.type === "empty" && !isPastDate && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/90 rounded-lg sm:rounded-2xl">
                          <span className="text-[7px] sm:text-xs font-bold text-white">Apply</span>
                        </div>
                      )}
                      {(status.type === "present" || status.type === "missed") && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/90 rounded-lg sm:rounded-2xl">
                          <span className="text-[7px] sm:text-xs font-bold text-white flex items-center"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1"/> Log</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}