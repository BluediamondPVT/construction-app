// src/components/attendance/CalendarModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, CheckCircle, AlertCircle } from "lucide-react";
import LeaveForm from "./LeaveForm";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedDateForLeave, setSelectedDateForLeave] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Current Date Setup
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  
  // YYYY-MM-DD format mein aaj ki date banate hain strict comparison ke liye
  const todayFormatted = `${year}-${String(month).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fetchMonthData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/monthly?month=${month}&year=${year}`);
      const data = await res.json();
      setAttendances(data.attendances || []);
      setLeaves(data.leaves || []);
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMonthData();
  }, [isOpen]);

  if (!isOpen) return null;

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayStatus = (day: number) => {
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const leave = leaves.find(l => l.date === formattedDate);
    if (leave) {
      return { type: "leave", data: leave };
    }

    const att = attendances.find(a => a.date === formattedDate);
    if (att) {
      if (att.status === "Present") return { type: "present", data: att };
      if (att.status === "Missed Out" || att.status === "In Progress") return { type: "missed", data: att };
    }

    return { type: "empty", data: null };
  };

  const handleDayClick = (day: number) => {
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = getDayStatus(day);
    
    // 🚀 STRICT CHECK: Past dates par leave allow nahi karni hai
    const isPastDate = formattedDate < todayFormatted;

    if (status.type === "empty" && !isPastDate) {
      setSelectedDateForLeave(formattedDate);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {selectedDateForLeave ? (
        <LeaveForm 
          selectedDate={selectedDateForLeave} 
          onClose={() => setSelectedDateForLeave(null)} 
          onSuccess={() => {
            setSelectedDateForLeave(null);
            fetchMonthData();
          }} 
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
          
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="mr-3 h-7 w-7 text-blue-500" />
              Attendance History & Leaves
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="mb-6 flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
              <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Present</span>
              <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div> Missed Out</span>
              <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Leave</span>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center animate-pulse text-slate-400">Loading Calendar...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {daysArray.map((day) => {
                  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const status = getDayStatus(day);
                  const isPastDate = formattedDate < todayFormatted; // 🚀 Date Check Loop Ke Andar
                  
                  let bgClass = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"; 
                  let cursorClass = "cursor-pointer group hover:border-blue-400";
                  let icon = null;

                  if (status.type === "present") {
                    bgClass = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 shadow-sm";
                    icon = <CheckCircle className="h-4 w-4 text-emerald-500 mt-2" />;
                  } else if (status.type === "missed") {
                    bgClass = "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 shadow-sm";
                    icon = <AlertCircle className="h-4 w-4 text-rose-500 mt-2" />;
                  } else if (status.type === "leave") {
                    const isApproved = status.data.status === "Approved";
                    bgClass = isApproved 
                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                      : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30";
                    icon = <div className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400">{status.data.type}</div>;
                  } else if (status.type === "empty" && isPastDate) {
                    // 🚀 Past Empty Dates ke liye UI dim kar do
                    cursorClass = "cursor-not-allowed opacity-40";
                  }

                  return (
                    <div 
                      key={day} 
                      onClick={() => handleDayClick(day)}
                      className={`relative p-4 rounded-2xl border transition-all ${bgClass} ${cursorClass}`}
                    >
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{day}</span>
                      {icon}
                      
                      {/* Hover Tooltip/Info - Sirf valid future/today dates par */}
                      {status.type === "empty" && !isPastDate && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/90 rounded-2xl">
                          <span className="text-xs font-bold text-white">Request Leave</span>
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