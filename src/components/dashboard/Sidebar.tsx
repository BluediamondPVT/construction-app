"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser: any;
  navItems: any[];
}

export default function Sidebar({ isOpen, isCollapsed, setIsSidebarOpen, setIsCollapsed, currentUser, navItems }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "HR Operations": pathname.startsWith("/dashboard/hr"),
  });

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl border-r border-slate-200 dark:border-white/10 transition-all duration-300 ease-in-out lg:static lg:h-screen ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isCollapsed ? "w-64 lg:w-20" : "w-64"}`}>
      
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
        {navItems.map((item, idx) => {
          if (item.isSection) {
            if (isCollapsed) {
              return <div key={`sec-${idx}`} className="my-2 border-t border-slate-200 dark:border-white/10" />;
            }
            return (
              <div key={`sec-${idx}`} className="pt-4 pb-1.5 px-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {item.name}
                </span>
              </div>
            );
          }

          if (item.children) {
            const isGroupExpanded = !!expandedGroups[item.name];
            const isChildActive = item.children.some((child: any) => {
              const isBase = child.href?.split("/").length === 3;
              return isBase ? pathname === child.href : pathname === child.href || pathname.startsWith(child.href + "/");
            });

            const ParentIcon = item.icon;

            return (
              <div key={item.name + idx} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.name)}
                  title={isCollapsed ? item.name : ""}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group font-bold ${
                    isChildActive
                      ? "bg-blue-600/15 dark:bg-blue-500/25 border border-blue-600/30 dark:border-blue-400/30 text-blue-800 dark:text-blue-300 shadow-sm"
                      : "border border-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  <div className="flex items-center">
                    {ParentIcon && (
                      <ParentIcon
                        className={`h-5 w-5 flex-shrink-0 transition-colors ${
                          isChildActive
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}
                      />
                    )}
                    {!isCollapsed && <span className="ml-3 text-sm tracking-wide whitespace-nowrap">{item.name}</span>}
                  </div>
                  {!isCollapsed && (
                    <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-200 transition-transform duration-300">
                      {isGroupExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  )}
                </button>

                {/* Collapsible Children */}
                {!isCollapsed && isGroupExpanded && (
                  <div className="pl-3 pr-1 space-y-1 border-l-2 border-slate-200 dark:border-white/10 ml-5 transition-all duration-300 animate-in slide-in-from-top-1">
                    {item.children.map((child: any, cIdx: number) => {
                      const isBaseRoute = child.href?.split("/").length === 3;
                      const isChildLinkActive = isBaseRoute
                        ? pathname === child.href
                        : pathname === child.href || pathname.startsWith(child.href + "/");
                      const ChildIcon = child.icon;

                      return (
                        <Link
                          key={child.name + cIdx}
                          href={child.href}
                          className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                            isChildLinkActive
                              ? "bg-blue-600/10 dark:bg-blue-500/20 border border-blue-600/20 dark:border-blue-400/20 shadow-sm"
                              : "border border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                          }`}
                        >
                          {ChildIcon && (
                            <ChildIcon
                              className={`h-4 w-4 flex-shrink-0 transition-colors ${
                                isChildLinkActive
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                              }`}
                            />
                          )}
                          <span
                            className={`ml-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                              isChildLinkActive
                                ? "text-blue-800 dark:text-blue-300"
                                : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                            }`}
                          >
                            {child.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // 🚀 FIX: Smart Active Link Logic
          // Agar yeh base route hai (jaise /dashboard/hr), toh sirf Exact match check karega
          // Warna sub-pages (jaise /dashboard/hr/employees) ke liye startsWith allow karega
          const isBaseRoute = item.href?.split('/').length === 3; 
          const isActive = isBaseRoute 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + '/');

          const Icon = item.icon;
          return (
            <Link 
              key={item.name + idx} 
              href={item.href} 
              title={isCollapsed ? item.name : ""} 
              className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-blue-600/10 dark:bg-blue-500/20 border border-blue-600/20 dark:border-blue-400/20 shadow-sm" : "border border-transparent hover:bg-slate-100 dark:hover:bg-white/5"} ${isCollapsed ? "justify-center" : ""}`}
            >
              {Icon && <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />}
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
  );
}