// Example for: src/app/dashboard/store/page.tsx
import { Package } from "lucide-react";

export default function StoreDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
          <Package className="mr-3 h-8 w-8 text-blue-500" />
          Store Management Module
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Welcome to your isolated workspace. Inventory and materials will be managed here.
        </p>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Module Under Construction</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">The UI and logic for this specific role are being developed.</p>
        </div>
      </div>
    </div>
  );
}
