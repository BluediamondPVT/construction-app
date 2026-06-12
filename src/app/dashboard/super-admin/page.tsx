// src/app/dashboard/super-admin/page.tsx
import { Users, Building2, Activity, ShieldCheck, ArrowUpRight, Clock } from "lucide-react";

export default function SuperAdminDashboard() {
  // Dummy data for the UI - Later this will come from your MongoDB database
  const stats = [
    { 
      name: "Total Staff Accounts", 
      value: "24", 
      change: "+2 this week", 
      icon: Users, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10 border-blue-500/20" 
    },
    { 
      name: "Active Modules", 
      value: "4", 
      change: "HR, Store, Project, Accounts", 
      icon: Building2, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10 border-purple-500/20" 
    },
    { 
      name: "System Health", 
      value: "99.9%", 
      change: "All services operational", 
      icon: Activity, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10 border-emerald-500/20" 
    },
    { 
      name: "Security Status", 
      value: "Secure", 
      change: "0 unauthorized attempts", 
      icon: ShieldCheck, 
      color: "text-indigo-500", 
      bg: "bg-indigo-500/10 border-indigo-500/20" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          Welcome back to the ERP Command Center. Here is what&apos;s happening today.
        </p>
      </div>

      {/* Top Stats Grid - Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Subtle hover gradient effect inside the card */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative flex justify-between items-start z-10">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${stat.bg} ${stat.color}`}>
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
              </div>
              <div className="relative mt-4 flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 z-10">
                <span className="truncate">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Quick Actions / Logs (Takes 2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent System Logs</h2>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              View All <ArrowUpRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Dummy Log Items */}
            {[
              { text: "Store Manager account created for Amit", time: "10 mins ago", type: "success" },
              { text: "System backup completed successfully", time: "2 hours ago", type: "info" },
              { text: "HR module permissions updated", time: "5 hours ago", type: "warning" },
            ].map((log, i) => (
              <div key={i} className="flex items-center p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/5">
                <div className={`h-2 w-2 rounded-full mr-4 flex-shrink-0 ${
                  log.type === 'success' ? 'bg-emerald-500' : 
                  log.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">{log.text}</p>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-4">
                  <Clock className="h-3 w-3 mr-1" /> {log.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: System Info (Takes 1/3 width) */}
        <div className="rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Current Version</h2>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-500 tracking-tight">v1.0.0</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Enterprise Resource Planning System. Core architecture and authentication engine active.
            </p>
          </div>
          
          <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Next Step: The Store Management module architecture is pending setup.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}