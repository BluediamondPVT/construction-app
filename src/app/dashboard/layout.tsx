// src/app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Mobile
  const [isCollapsed, setIsCollapsed] = useState(false);     // For Desktop Collapse Feature
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard/super-admin", icon: LayoutDashboard },
    { name: "Manage Users", href: "/dashboard/super-admin/manage-users", icon: Users },
    { name: "System Settings", href: "/dashboard/super-admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      
      if (response.ok) {
        router.push("/login");
        router.refresh(); 
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

 return (
    // MAIN WRAPPER: Deep Slate Base + Relative positioning for background blobs
    <div className="relative h-screen w-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans">
      
      {/* --- DYNAMIC GLOWING BACKGROUND (The MacBook Soul) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top Left Purple Glow */}
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-purple-400/30 dark:bg-purple-600/15 mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-pulse"></div>
        {/* Bottom Right Blue Glow */}
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/30 dark:bg-blue-600/15 mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-pulse" style={{ animationDelay: "3s" }}></div>
        {/* Center Subtle Indigo Glow */}
        <div className="absolute top-[30%] left-[40%] h-[500px] w-[500px] rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 mix-blend-multiply dark:mix-blend-screen blur-[100px]"></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR: Glassmorphism adjusted to catch the glow */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-r border-slate-200 dark:border-white/10 transition-all duration-300 ease-in-out lg:static lg:h-screen ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-64 lg:w-20" : "w-64"}`}
      >
        {/* Sidebar Header / Logo */}
        <div className={`h-16 flex-shrink-0 flex items-center px-4 border-b border-slate-200 dark:border-white/5 transition-all ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight whitespace-nowrap">
                ERP System
              </span>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar relative z-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-600/10 dark:bg-blue-500/20 border border-blue-600/20 dark:border-blue-400/20 shadow-sm" 
                    : "border border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                }`} />
                {!isCollapsed && (
                  <span className={`ml-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive ? "text-blue-800 dark:text-blue-300" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                  }`}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 hidden lg:flex justify-center relative z-10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 w-full flex justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE: Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        
        {/* Top Header: Glassmorphism adjusted */}
        <header className="h-16 flex-shrink-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 transition-colors">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT: Now with glowing background behind it */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>

      </div>
    </div>
  );
}
