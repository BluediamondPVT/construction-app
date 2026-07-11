// src/app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Settings, ShieldCheck, Package, ShoppingCart,
  Briefcase, FileText, IndianRupee, PenTool, Megaphone, HardHat, FileClock, Wallet, ClipboardList, CalendarDays
} from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import BottomNav from "@/components/dashboard/BottomNav"; // 🚀 NEW IMPORT

interface CurrentUser {
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const router = useRouter();

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

  // DYNAMIC MENUS
  let navItems: any[] = [];
  if (currentUser) {
    const hrItems = [
      { name: "Overview", href: "/dashboard/hr", icon: LayoutDashboard },
      { name: "Staff", href: "/dashboard/hr/employees", icon: Users },
      { name: "Attendance", href: "/dashboard/hr/attendance", icon: FileClock },
      { name: "Leaves", href: "/dashboard/hr/leaves", icon: ClipboardList },
      { name: "Holidays", href: "/dashboard/hr/holidays", icon: CalendarDays },
      { name: "Payroll", href: "/dashboard/hr/payroll", icon: Wallet },
    ];

    if (
      currentUser.role === "Super Admin" ||
      currentUser.role.includes("Super") ||
      currentUser.role.includes("Admin")
    ) {
      const superAdminItems = [
        { name: "Overview", href: "/dashboard/super-admin", icon: ShieldCheck },
        { name: "Users", href: "/dashboard/super-admin/manage-users", icon: Users },
        { name: "Settings", href: "/dashboard/super-admin/settings", icon: Settings },
      ];

      navItems = [
        { name: "System Admin", isSection: true },
        ...superAdminItems,
        {
          name: "HR Operations",
          icon: Briefcase,
          children: hrItems.map((item, idx) => (idx === 0 ? { ...item, name: "HR Overview" } : item)),
        },
      ];
    } else if (currentUser.role === "HR") {
      navItems = hrItems;
    }
    else if (currentUser.role === "Store") {
      navItems = [
        { name: "Overview", href: "/dashboard/store", icon: LayoutDashboard },
        { name: "Inventory", href: "/dashboard/store/inventory", icon: Package },
        { name: "Material Logs", href: "/dashboard/store/logs", icon: ClipboardList },
        { name: "Issue Material", href: "/dashboard/store/issue", icon: ShoppingCart },
      ];
    }
    else if (currentUser.role === "Project") {
      navItems = [
        { name: "Overview", href: "/dashboard/project", icon: LayoutDashboard },
        { name: "DPR", href: "/dashboard/project/dpr", icon: HardHat },
        { name: "Requests", href: "/dashboard/project/request", icon: ShoppingCart },
        { name: "Certificates", href: "/dashboard/project/certificates", icon: FileText },
      ];
    }
    else if (currentUser.role === "Accounts") {
      navItems = [
        { name: "Overview", href: "/dashboard/accounts", icon: LayoutDashboard },
        { name: "Billing", href: "/dashboard/accounts/billing", icon: FileText },
        { name: "Payments", href: "/dashboard/accounts/payments", icon: IndianRupee },
        { name: "Ledger", href: "/dashboard/accounts/ledger", icon: Wallet },
      ];
    }
    else if (currentUser.role === "Marketing") {
      navItems = [
        { name: "Overview", href: "/dashboard/marketing", icon: LayoutDashboard },
        { name: "Leads", href: "/dashboard/marketing/leads", icon: Megaphone },
        { name: "Quotations", href: "/dashboard/marketing/quotations", icon: FileText },
      ];
    }
    else if (currentUser.role === "Design") {
      navItems = [
        { name: "Overview", href: "/dashboard/design", icon: LayoutDashboard },
        { name: "Blueprints", href: "/dashboard/design/blueprints", icon: PenTool },
        { name: "BOQ", href: "/dashboard/design/boq", icon: FileText },
      ];
    }
  }

  return (
    <div className="relative h-screen w-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-purple-400/30 dark:bg-purple-600/15 mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/30 dark:bg-blue-600/15 mix-blend-multiply dark:mix-blend-screen blur-[120px] animate-pulse" style={{ animationDelay: "3s" }}></div>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR FOR DESKTOP & MOBILE MENU */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsCollapsed={setIsCollapsed}
        currentUser={currentUser}
        navItems={navItems}
      />

      {/* Content Stream */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <Header
          setIsSidebarOpen={setIsSidebarOpen}
          handleLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />

        {/* 🚀 ADDED pb-24 padding at bottom so content doesn't hide behind mobile nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* 🚀 NEW MOBILE BOTTOM NAV */}
      <BottomNav navItems={navItems} />
    </div>
  );
}