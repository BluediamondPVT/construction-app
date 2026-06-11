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
  Building2
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    // MAIN WRAPPER: Fixed to 100vh height and hidden overflow so inner sections scroll independently
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR: Height exactly 100vh and fixed */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col lg:static lg:h-screen lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-500 mr-2" />
          <span className="text-xl font-bold text-slate-900 dark:text-white">ERP System</span>
        </div>

        {/* Custom scrollbar inside sidebar if menu items get too long */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" 
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* RIGHT SIDE: Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        
        {/* Top Header: Fixed height, doesn't scroll */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT: Only this area scrolls! */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}