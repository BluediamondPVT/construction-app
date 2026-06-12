// src/app/dashboard/purchase/page.tsx
import { ShoppingBag, FileSignature, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PurchaseDashboardOverview() {
  const metrics = [
    { name: "Pending POs", value: "7", icon: ShoppingBag, color: "text-orange-400", change: "Requires creation" },
    { name: "Approved POs", value: "12", icon: CheckCircle, color: "text-emerald-400", change: "Awaiting material delivery" },
    { name: "Vendor Quotes", value: "24", icon: FileSignature, color: "text-blue-400", change: "Needs comparison" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <ShoppingBag className="mr-3 h-8 w-8 text-blue-500 drop-shadow-lg" />
            Purchase & Procurement
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
            Handle Purchase Orders (PO), vendor quotations, and coordinate with the Store for incoming materials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-10 md:p-12 border border-slate-200/50 dark:border-white/10 shadow-sm text-center min-h-[300px] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">PO Generation System</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium">
          The Purchase Order generation and vendor management interface is under development.
        </p>
      </div>
    </div>
  );
}