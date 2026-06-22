"use client";

import { Menu, LogOut } from "lucide-react";

interface HeaderProps {
  setIsSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  isLoggingOut: boolean;
}

export default function Header({ setIsSidebarOpen, handleLogout, isLoggingOut }: HeaderProps) {
  return (
    <header className="h-[72px] flex-shrink-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 transition-colors">
      <div className="flex items-center">
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 mr-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 flex justify-end">
        <button onClick={handleLogout} disabled={isLoggingOut} className="flex items-center px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all disabled:opacity-50">
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}