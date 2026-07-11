// src/components/dashboard/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  navItems: any[];
}

export default function BottomNav({ navItems }: BottomNavProps) {
  const pathname = usePathname();
  
  // Sirf pehle 4 items nikalenge bottom bar ke liye (excluding section headers)
  const bottomItems = navItems.filter((item) => !item.isSection && item.href).slice(0, 4);

  if (bottomItems.length === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around px-2 py-2 gap-1">
        {bottomItems.map((item) => {
          
          const isBaseRoute = item.href.split('/').length === 3; 
          const isActive = isBaseRoute 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + '/');

          const Icon = item.icon;
          const shortName = item.name.split(' ')[0]; 

          return (
            <Link 
              key={item.name} 
              href={item.href} 
              // 🚀 FIX 1: Background aur Text Color ab poore Link (Tab) par apply hoga
              className={`flex flex-col items-center justify-center w-full relative py-2.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {/* 🚀 FIX 2: Icon ka size chota kar diya (h-5 w-5) */}
              <Icon 
                className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110 mb-0.5" : "scale-100 mb-1"}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              
              {/* Text Label */}
              <span className="text-[10px] font-semibold truncate max-w-full px-1">
                {shortName}
              </span>

              {/* Active Dot Indicator (Niche ek chota sa dot) */}
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-in zoom-in" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}