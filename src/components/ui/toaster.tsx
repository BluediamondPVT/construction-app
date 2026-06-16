"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<Toast>;
      const newToast = customEvent.detail;
      
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener("toast", handleToast);
    return () => window.removeEventListener("toast", handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClass = "bg-blue-500/10 border-blue-500/20 text-blue-500";
        
        if (toast.type === "success") {
          Icon = CheckCircle;
          colorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
        } else if (toast.type === "error") {
          Icon = XCircle;
          colorClass = "bg-rose-500/10 border-rose-500/20 text-rose-500";
        } else if (toast.type === "warning") {
          Icon = AlertTriangle;
          colorClass = "bg-amber-500/10 border-amber-500/20 text-amber-500";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center p-4 rounded-2xl border shadow-lg backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70 w-[350px] animate-in slide-in-from-bottom-5 fade-in duration-300 ${colorClass.split(" ")[1]}`}
          >
            <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full border ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{toast.type}</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 ml-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const toast = {
  success: (message: string) => dispatch("success", message),
  error: (message: string) => dispatch("error", message),
  warning: (message: string) => dispatch("warning", message),
  info: (message: string) => dispatch("info", message),
};

function dispatch(type: ToastType, message: string) {
  if (typeof window !== "undefined") {
    const id = Math.random().toString(36).substring(2, 9);
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { id, type, message },
      })
    );
  }
}
