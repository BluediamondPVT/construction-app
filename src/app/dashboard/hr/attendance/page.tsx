"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, AlertTriangle, Map, Edit2 } from "lucide-react";

export default function LiveAttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
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
        setEditingRecord(null);
        fetchAttendance();
      } else {
        alert("Error saving record.");
      }
    } catch (err) {
      alert("Error saving record.");
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

      {isLoading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse">Loading data stream...</div>
      ) : (
        <div className="w-full">
          
          {/* 💻 DESKTOP VIEW: Normal Table */}
          <div className="hidden md:block bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 overflow-hidden">
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
                {attendances.map((att) => (
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
                          <div>{new Date(att.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <button onClick={() => setSelectedMap({ lat: att.punchIn.location.latitude, lng: att.punchIn.location.longitude, name: att.userId?.name })} className="text-xs text-blue-500 flex items-center hover:underline mt-1">📍 View Map</button>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {att.punchOut?.time ? (
                        <div>
                          <div>{new Date(att.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {att.isEditedByHR && <span className="text-xs text-orange-500 flex items-center mt-1"><Edit2 className="h-3 w-3 mr-1" /> Fixed</span>}
                        </div>
                      ) : <span className="text-xs text-rose-500 font-bold flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Missing</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(att)} className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center ml-auto transition-all hover:bg-blue-700">
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 MOBILE VIEW: Premium Card View */}
          <div className="md:hidden space-y-4">
            {attendances.map((att) => (
              <div key={att._id} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 p-4">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{att.userId?.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">{att.userId?.role}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold flex-shrink-0 ${att.status === "Present" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {att.status}
                  </span>
                </div>

                {/* Timings Grid */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Punch In</p>
                    {att.punchIn?.time ? (
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(att.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <button onClick={() => setSelectedMap({ lat: att.punchIn.location.latitude, lng: att.punchIn.location.longitude, name: att.userId?.name })} className="text-[10px] text-blue-500 font-bold flex items-center mt-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">📍 Map</button>
                      </div>
                    ) : <span className="text-sm text-slate-500">-</span>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Punch Out</p>
                    {att.punchOut?.time ? (
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(att.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {att.isEditedByHR && <span className="text-[10px] text-orange-500 font-bold flex items-center mt-1"><Edit2 className="h-3 w-3 mr-1" /> Fixed</span>}
                      </div>
                    ) : <span className="text-[10px] text-rose-500 font-bold flex items-center mt-1 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded"><AlertTriangle className="h-3 w-3 mr-1" /> Missing</span>}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button 
                    onClick={() => openEditModal(att)} 
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white text-blue-600 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
                  >
                    <Edit2 className="h-4 w-4"/> Manual Edit
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAP MODAL (No Changes Here) */}
      {selectedMap && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border dark:border-slate-800">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold flex items-center text-slate-900 dark:text-white"><Map className="mr-2 h-4 w-4 text-blue-500" /> Map View: {selectedMap.name}</h3>
              <button onClick={() => setSelectedMap(null)} className="text-sm font-bold text-slate-400 hover:text-red-500">Close</button>
            </div>
            <div className="w-full h-80">
              <iframe width="100%" height="100%" frameBorder="0" src={`https://maps.google.com/maps?q=${selectedMap.lat},${selectedMap.lng}&z=15&output=embed`}></iframe>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (No Changes Here) */}
      {editingRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center"><Edit2 className="mr-2 h-5 w-5 text-blue-500" /> Edit Attendance</h3>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Punch In Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                    value={editForm.punchInTime}
                    onChange={(e) => setEditForm({ ...editForm, punchInTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Punch Out Time</label>
                  <input type="time" className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                    value={editForm.punchOutTime}
                    onChange={(e) => setEditForm({ ...editForm, punchOutTime: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Missed Out">Missed Out</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">HR Notes</label>
                <input type="text" placeholder="Reason for adjustment"
                  value={editForm.hrNotes}
                  onChange={(e) => setEditForm({ ...editForm, hrNotes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 outline-none text-sm" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditingRecord(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => handleSaveEdit()} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}