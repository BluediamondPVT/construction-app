"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, AlertTriangle, Map, Edit2 } from "lucide-react";

export default function LiveAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [fixingRecord, setFixingRecord] = useState<any | null>(null);
  const [hrNote, setHrNote] = useState("");
  const [customDate, setCustomDate] = useState("");
const [customTime, setCustomTime] = useState("");

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hr/attendance");
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  const handleFixPunch = async () => {
    if (!fixingRecord) return;
    if (!customDate || !customTime) {
      alert("Please select both Date and Out Time.");
      return;
    }
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recordId: fixingRecord._id, 
          hrNotes: hrNote,
          customDate,
          customTime
        }),
      });
      if (res.ok) {
        setFixingRecord(null);
        setHrNote("");
        setCustomDate("");
        setCustomTime("");
        fetchAttendance();
      }
    } catch (err) {
      alert("Error repairing log.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Clock className="mr-2 h-6 w-6 text-blue-500" /> Real-time Site Attendance
        </h1>
        <p className="text-sm text-slate-500">View real-time check-in coordinates and patch dynamic shifts.</p>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 text-xs font-semibold uppercase text-slate-500">
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Punch IN</th>
              <th className="px-6 py-4">Punch OUT</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-white/10 text-sm">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-500">Loading data stream...</td></tr>
            ) : (
              attendances.map((att) => (
                <tr key={att._id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{att.userId?.name}</div>
                    <div className="text-xs text-slate-500">{att.userId?.role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${att.status === "Present" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>{att.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {att.punchIn?.time ? (
                      <div>
                        <div>{new Date(att.punchIn.time).toLocaleTimeString()}</div>
                        <button onClick={() => setSelectedMap({ lat: att.punchIn.location.latitude, lng: att.punchIn.location.longitude, name: att.userId?.name })} className="text-xs text-blue-500 flex items-center hover:underline mt-1">📍 View Map</button>
                      </div>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    {att.punchOut?.time ? (
                      <div>
                        <div>{new Date(att.punchOut.time).toLocaleTimeString()}</div>
                        {att.isEditedByHR && <span className="text-xs text-orange-500 flex items-center mt-1"><Edit2 className="h-3 w-3 mr-1" /> Fixed</span>}
                      </div>
                    ) : <span className="text-xs text-rose-500 font-bold flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Missing</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!att.punchOut?.time && (
                      <button onClick={() => setFixingRecord(att)} className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg">Fix Punch Out</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MAP MODAL */}
      {selectedMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold flex items-center"><Map className="mr-2 h-4 w-4"/> Map View: {selectedMap.name}</h3>
              <button onClick={() => setSelectedMap(null)} className="text-sm font-bold text-slate-400 hover:text-red-500">Close</button>
            </div>
            <div className="w-full h-80">
              <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${selectedMap.lat},${selectedMap.lng}&z=15&output=embed`}></iframe>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
    // Inside the Modal in src/app/dashboard/hr/attendance/page.tsx

{fixingRecord && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border dark:border-slate-800">
      <h3 className="text-lg font-bold mb-4 text-orange-500">Adjust Shift Balance</h3>
      
      {/* 🚀 NEW: DATE & TIME INPUTS */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Date</label>
          <input type="date" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" 
            onChange={(e) => setCustomDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Set Out Time</label>
          <input type="time" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm" 
            onChange={(e) => setCustomTime(e.target.value)} />
        </div>
      </div>

      <input type="text" placeholder="Reason for adjustment" value={hrNote} onChange={(e) => setHrNote(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 outline-none text-sm mb-4" />
      
      <div className="flex gap-2">
        <button onClick={() => setFixingRecord(null)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold">Cancel</button>
        {/* 🚀 updated handleFixPunch call to pass state variables */}
        <button onClick={() => handleFixPunch()} className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold">Confirm Adjust</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}