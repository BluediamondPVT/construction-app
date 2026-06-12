// src/app/dashboard/accounts/page.tsx
import { Wallet, Receipt, IndianRupee, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AccountsDashboardOverview() {
  const metrics = [
    { name: "Total Billing (MTD)", value: "₹45.2 L", icon: IndianRupee, color: "text-emerald-400", change: "12 Invoices generated" },
    { name: "Pending Payments", value: "₹8.5 L", icon: Receipt, color: "text-orange-400", change: "Vendor dues this week" },
    { name: "Project P/L Status", value: "+18%", icon: TrendingUp, color: "text-blue-400", change: "Overall healthy margin" },
    { name: "Ledger Entries", value: "142", icon: Wallet, color: "text-purple-400", change: "Needs reconciliation" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Wallet className="mr-3 h-8 w-8 text-blue-500 drop-shadow-lg" />
            Finance & Accounts Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
            Manage automated invoicing, track project-wise profit/loss, and clear vendor payments directly from here.
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
          <Receipt className="h-10 w-10 text-blue-500" strokeWidth={1}/>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Billing Engine Starting Up</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium">
          Once the Project team uploads the &quot;Work Completion Certificate&quot;, you will receive a notification here to generate the automated invoice.
        </p>
        <Link href="/dashboard/accounts/billing" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all">
          Go to Client Billing <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}