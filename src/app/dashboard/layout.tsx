// src/app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Users, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Package, ShoppingCart, ShieldCheck, Briefcase, FileText, IndianRupee,
  PenTool, Megaphone, HardHat, FileClock, Wallet, ClipboardList
} from "lucide-react";

interface CurrentUser {
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setCurrentUser(data);
      })
      .catch((err) => console.error("Failed to fetch user:", err));
  }, []);

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

  // 🚀 DYNAMIC MENUS FOR ALL 6 ERP MODULES
  let navItems: any[] = [];
  
  if (currentUser) {
    // 1. SUPER ADMIN
    if (currentUser.role.includes("Super") || currentUser.role.includes("Admin")) {
      navItems = [
        { name: "System Overview", href: "/dashboard/super-admin", icon: ShieldCheck },
        { name: "Manage Users", href: "/dashboard/super-admin/manage-users", icon: Users },
        { name: "System Settings", href: "/dashboard/super-admin/settings", icon: Settings },
      ];
    } 
    // 2. HR MODULE
    else if (currentUser.role === "HR") {
      navItems = [
        { name: "HR Dashboard", href: "/dashboard/hr", icon: LayoutDashboard },
        { name: "Employees & Labor", href: "/dashboard/hr/employees", icon: Users },
        { name: "Payroll & Attendance", href: "/dashboard/hr/payroll", icon: FileClock },
        { name: "Document Vault", href: "/dashboard/hr/vault", icon: Briefcase },
      ];
    } 
    // 3. STORE MODULE
    else if (currentUser.role === "Store") {
      navItems = [
        { name: "Store Dashboard", href: "/dashboard/store", icon: LayoutDashboard },
        { name: "Live Inventory", href: "/dashboard/store/inventory", icon: Package },
        { name: "Material Logs", href: "/dashboard/store/logs", icon: ClipboardList },
        { name: "Issue Material", href: "/dashboard/store/issue", icon: ShoppingCart },
      ];
    } 
    // 4. PROJECT MODULE
    else if (currentUser.role === "Project") {
      navItems = [
        { name: "Site Dashboard", href: "/dashboard/project", icon: LayoutDashboard },
        { name: "Daily Progress (DPR)", href: "/dashboard/project/dpr", icon: HardHat },
        { name: "Material Request", href: "/dashboard/project/request", icon: ShoppingCart },
        { name: "Work Certificates", href: "/dashboard/project/certificates", icon: FileText },
      ];
    } 
    // 5. ACCOUNTS MODULE
    else if (currentUser.role === "Accounts") {
      navItems = [
        { name: "Finance Dashboard", href: "/dashboard/accounts", icon: LayoutDashboard },
        { name: "Client Billing", href: "/dashboard/accounts/billing", icon: FileText },
        { name: "Vendor Payments", href: "/dashboard/accounts/payments", icon: IndianRupee },
        { name: "Ledger & P/L", href: "/dashboard/accounts/ledger", icon: Wallet },
      ];
    } 
    // 6. MARKETING MODULE
    else if (currentUser.role === "Marketing") {
      navItems = [
        { name: "Marketing Dashboard", href: "/dashboard/marketing", icon: LayoutDashboard },
        { name: "Lead Tracking", href: "/dashboard/marketing/leads", icon: Megaphone },
        { name: "Quotations", href: "/dashboard/marketing/quotations", icon: FileText },
      ];
    } 
    // 7. DESIGN MODULE
    else if (currentUser.role === "Design") {
      navItems = [
        { name: "Design Dashboard", href: "/dashboard/design", icon: LayoutDashboard },
        { name: "Blueprints Vault", href: "/dashboard/design/blueprints", icon: PenTool },
        { name: "BOQ Uploads", href: "/dashboard/design/boq", icon: FileText },
      ];
    } 
    // FALLBACK
    else {
      navItems = [
        { name: "Dashboard", href: `/dashboard/${currentUser.role.toLowerCase()}`, icon: LayoutDashboard }
      ];
    }
  }

  return (
    <div className="relative h-screen w-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans">
      
      {/* Dynamic Glowing Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-purple-400/30 dark:bg-purple-600/15 mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/30 dark:bg-blue-600/15 mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-pulse" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-[30%] left-[40%] h-[500px] w-[500px] rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 mix-blend-multiply dark:mix-blend-screen blur-[100px]"></div>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar with Glassmorphism */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-r border-slate-200 dark:border-white/10 transition-all duration-300 ease-in-out lg:static lg:h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isCollapsed ? "w-64 lg:w-20" : "w-64"}`}>
        
        {/* User Profile Header */}
        <div className={`h-[72px] flex-shrink-0 flex items-center px-4 border-b border-slate-200 dark:border-white/5 transition-all ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 flex-shrink-0 text-white font-bold text-lg uppercase border border-white/20">
              {currentUser ? currentUser.name.charAt(0) : "..."}
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex flex-col justify-center animate-in fade-in duration-300">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate w-36">
                  {currentUser ? currentUser.name : "Loading..."}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-blue-400 truncate w-36">
                  {currentUser ? `${currentUser.role} Dept.` : "Please wait"}
                </span>
              </div>
            )}
          </div>
          <button className="lg:hidden p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Dynamic Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar relative z-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} title={isCollapsed ? item.name : ""} className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-blue-600/10 dark:bg-blue-500/20 border border-blue-600/20 dark:border-blue-400/20 shadow-sm" : "border border-transparent hover:bg-slate-100 dark:hover:bg-white/5"} ${isCollapsed ? "justify-center" : ""}`}>
                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
                {!isCollapsed && <span className={`ml-3 text-sm font-semibold whitespace-nowrap transition-colors ${isActive ? "text-blue-800 dark:text-blue-300" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`}>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Collapse Button */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 hidden lg:flex justify-center relative z-10">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 w-full flex justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}