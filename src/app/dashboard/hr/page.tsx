// src/app/dashboard/hr/page.tsx
import { Users, BriefcaseBusiness, Banknote, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HRDashboardOverview() {
  // Dummy data for HR overview metrics - later from MongoDB
  const metrics = [
    { name: "Active Employees", value: "112", icon: Users, color: "text-emerald-400", change: "+4 joining this month" },
    { name: "Total Departments", value: "6", icon: BriefcaseBusiness, color: "text-purple-400", change: "HR, Store, Project, Accounts, CRM, Purchase" },
    { name: "Pending Leave Requests", value: "9", icon: Clock, color: "text-orange-400", change: "Requires immediate approval" },
    { name: "Payroll (Current Month)", value: "₹24.8 Lakhs", icon: Banknote, color: "text-blue-400", change: "Payment pending on 1st" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🚀 Premium Header (PERSONALIZED) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Users className="mr-3 h-8 w-8 text-blue-500 drop-shadow-lg" />
            Human Resources Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
            Welcome to your centralized hub. Orchestrate employee lifecycles, manage payroll structures, and streamline departmental approvals with precision.
          </p>
        </div>
      </div>

      {/* 🚀 HR Key Metrics Grid - Glassmorphism Cards */}
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

      {/* 🚀 THE STARTER PLACEHOLDER (PERSONALIZED for HR) */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 md:p-12 border border-slate-200/50 dark:border-white/10 shadow-sm text-center min-h-87.5 flex flex-col justify-center items-center">
        <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/10">
          <Users className="h-10 w-10 text-blue-500" strokeWidth={1}/>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Welcome to your isolated workplace</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium">
          The core modules for employee management, leave request processing, and payroll execution are currently being developed. You will find them under the &quot;Employees&quot; link in the sidebar soon.
        </p>
        
        {/* Placeholder Button for future call to action */}
        <Link href="/dashboard/hr/employees" className="inline-flex items-center px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-md transition-all">
          Go to Employee List <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>

    </div>
  );
}