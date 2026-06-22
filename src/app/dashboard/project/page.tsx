// src/app/dashboard/project/page.tsx
import { HardHat, ClipboardCheck, ShoppingCart, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import AttendanceCard from "@/components/AttendanceCard"; // 🚀 ATTENDANCE CARD IMPORTED

export default function ProjectDashboardOverview() {
  // Dummy data for Project metrics - later fetched from MongoDB
  const metrics = [
    { name: "Active Sites", value: "3", icon: HardHat, color: "text-blue-400", change: "Phase 2 execution ongoing" },
    { name: "Pending DPRs", value: "2", icon: ClipboardCheck, color: "text-emerald-400", change: "Requires your review today" },
    { name: "Material Requests", value: "5", icon: ShoppingCart, color: "text-purple-400", change: "Pending with Store Dept." },
    { name: "Site Alerts", value: "0", icon: AlertTriangle, color: "text-orange-400", change: "All safety protocols met" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🚀 THE PREMIUM ATTENDANCE SYSTEM PLUGGED IN AT THE TOP */}
      <AttendanceCard />

      {/* 🚀 Premium Header (PERSONALIZED for Project) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <HardHat className="mr-3 h-8 w-8 text-blue-500 drop-shadow-lg" />
            Site Execution & Operations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
            Welcome to the Project Command Center. Track daily site progress, manage material requests, and generate work completion certificates for billing.
          </p>
        </div>
      </div>

      {/* 🚀 Project Key Metrics Grid - Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-white/10 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{metric.name}</span>
                <Icon className={`h-6 w-6 ${metric.color}`} strokeWidth={1.5}/>
              </div>
              <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metric.value}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 truncate">{metric.change}</p>
            </div>
          );
        })}
      </div>

      {/* 🚀 THE STARTER PLACEHOLDER (Focused on DPR and Materials) */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 md:p-12 border border-slate-200/50 dark:border-white/10 shadow-sm text-center min-h-[350px] flex flex-col justify-center items-center">
        <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/10">
          <ClipboardCheck className="h-10 w-10 text-blue-500" strokeWidth={1}/>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Module Under Construction</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium">
          The interactive forms for Daily Progress Reports (DPR) and Material Requisitions (which link directly to the Store) are currently being built. You'll be able to manage site operations from here very soon.
        </p>
        
        {/* Placeholder Button */}
        <Link href="/dashboard/project/dpr" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md transition-all">
          Explore DPR Module <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>

    </div>
  );
}