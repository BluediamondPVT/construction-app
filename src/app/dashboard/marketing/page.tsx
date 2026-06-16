// src/app/dashboard/marketing/page.tsx
import { Target, Users, FileText, Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MarketingDashboardOverview() {
  const metrics = [
    { name: "Active Leads", value: "28", icon: Users, color: "text-blue-400", change: "5 high priority" },
    { name: "Quotations Sent", value: "14", icon: FileText, color: "text-emerald-400", change: "Awaiting client response" },
    { name: "Pending BOQs", value: "3", icon: Target, color: "text-orange-400", change: "Requested from Design team" },
    { name: "Conversion Rate", value: "22%", icon: Megaphone, color: "text-purple-400", change: "+2% from last month" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Megaphone className="mr-3 h-8 w-8 text-blue-500 drop-shadow-lg" />
            Marketing & Pre-Sales Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
            Track new clients, manage tender submissions, and request BOQs from the technical team seamlessly.
          </p>
        </div>
      </div>

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

      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 md:p-12 border border-slate-200/50 dark:border-white/10 shadow-sm text-center min-h-[350px] flex flex-col justify-center items-center">
        <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg shadow-blue-500/10">
          <Target className="h-10 w-10 text-blue-500" strokeWidth={1}/>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Lead & Quote Engine</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium">
          The central hub for generating quotations and submitting tenders is under construction. BOQ requests routed to the Design team will appear here.
        </p>
        <Link href="/dashboard/marketing/leads" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all">
          Manage Leads <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}