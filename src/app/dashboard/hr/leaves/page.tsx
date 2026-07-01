"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Calendar, Check, X, History, User } from "lucide-react";

export default function PendingLeavesPage() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaves = async () => {
        setIsLoading(true);
        const res = await fetch("/api/hr/leaves");
        const data = await res.json();
        setLeaves(data.leaves || []);
        setIsLoading(false);
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleAction = async (leaveId: string, status: "Approved" | "Rejected") => {
        await fetch("/api/hr/leaves", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leaveId, status }),
        });
        fetchLeaves();
    };

    const pending = leaves.filter(l => l.status === "Pending");
    const history = leaves.filter(l => l.status !== "Pending");

    return (
        <div className="space-y-10">
            {/* PENDING SECTION (Already Mobile Friendly - Using Cards) */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                    <ClipboardList className="mr-2 h-6 w-6 text-yellow-500" /> Pending Authorizations
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pending.length === 0 ? <p className="text-slate-500 dark:text-slate-400">No pending requests.</p> : pending.map(leave => (
                        <div key={leave._id} className="bg-white dark:bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{leave.userId?.name}</h3>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 mt-1 bg-slate-100 dark:bg-slate-700/50 inline-block px-2 py-1 rounded">
                                    {leave.type} Leave • {new Date(leave.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleAction(leave._id, "Approved")} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">Approve</button>
                                <button onClick={() => handleAction(leave._id, "Rejected")} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold rounded-xl transition-colors">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* HISTORY SECTION (Updated with Responsive Card View) */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                    <History className="mr-2 h-5 w-5 text-blue-500" /> Leave History
                </h2>
                
                <div className="w-full">
                    {/* 💻 DESKTOP VIEW: Normal Table */}
                    <div className="hidden md:block bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border dark:border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Employee</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(leave => (
                                    <tr key={leave._id} className="border-b dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{leave.userId?.name}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(leave.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{leave.type}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold ${leave.status === "Approved" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 📱 MOBILE VIEW: Premium Card View */}
                    <div className="md:hidden space-y-4">
                        {history.map(leave => (
                            <div key={leave._id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700 p-4 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center">
                                            {leave.userId?.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                {new Date(leave.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">
                                                {leave.type} Leave
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold flex-shrink-0 ${leave.status === "Approved" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"}`}>
                                        {leave.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        
                        {history.length === 0 && (
                            <p className="text-center py-6 text-sm text-slate-500">No leave history available.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}