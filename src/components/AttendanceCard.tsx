// src/components/AttendanceCard.tsx
"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, CheckCircle, AlertTriangle, Fingerprint, CalendarDays } from "lucide-react";
import CalendarModal from "./attendance/CalendarModal";

export default function AttendanceCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // States from Backend
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [hasPunchedOut, setHasPunchedOut] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState("");
  
  // Error handling
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    // Fetch today's attendance status when dashboard loads
    fetch("/api/attendance/today")
      .then((res) => res.json())
      .then((data) => {
        setHasPunchedIn(data.hasPunchedIn);
        setHasPunchedOut(data.hasPunchedOut);
        setIsOnLeave(data.isOnLeave);
        if (data.leaveStatus) setLeaveStatus(data.leaveStatus);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch attendance:", err);
        setIsLoading(false);
      });
  }, []);

  const handlePunch = async (action: "IN" | "OUT") => {
    setIsPunching(true);
    setLocationError("");

    // 1. Request Geolocation from Browser/Mobile
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your device.");
      setIsPunching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Fetching..." // Reverse geocoding can be added later
        };

        // 2. Send Data to Backend API
        try {
          const res = await fetch("/api/attendance/punch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, location }),
          });

          if (res.ok) {
            if (action === "IN") setHasPunchedIn(true);
            if (action === "OUT") setHasPunchedOut(true);
          } else {
            const data = await res.json();
            setLocationError(data.message || "Failed to punch. Please try again.");
          }
        } catch (err) {
          setLocationError("Network error. Check your connection.");
        } finally {
          setIsPunching(false);
        }
      },
      (error) => {
        // STRICT SECURITY: User denied location
        setLocationError("Strict Policy: Geolocation access is mandatory to mark attendance. Please allow location access in your browser/phone settings.");
        setIsPunching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-white/10 shadow-sm animate-pulse flex flex-col items-center justify-center h-48">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
        <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>
    );
  }

  // UI STATE 1: User is on Leave
  if (isOnLeave) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-500/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-200 dark:border-yellow-500/20 shadow-sm text-center">
        <CalendarDays className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">You are on Leave Today</h3>
        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">Status: {leaveStatus}</p>
      </div>
    );
  }

 return (
    <> {/* 🚀 ADDED REACT FRAGMENT HERE */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-slate-200/50 dark:border-white/10 shadow-lg relative overflow-hidden transition-all">
        {/* Background glowing orb */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none transition-colors duration-1000 ${hasPunchedOut ? 'bg-slate-500' : hasPunchedIn ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Left Side: Info */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center md:justify-start">
              <Clock className="mr-2 h-6 w-6 text-blue-500" />
              Daily Attendance
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center md:justify-start">
              <MapPin className="mr-1 h-4 w-4" /> Device location tracking active
            </p>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            
            {/* STATE 2: Done for the day */}
            {hasPunchedIn && hasPunchedOut ? (
              <div className="flex items-center px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl border border-slate-200 dark:border-slate-700">
                <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                Shift Completed
              </div>
            ) : (
              /* STATE 3 & 4: IN / OUT Buttons */
              <button
                onClick={() => handlePunch(hasPunchedIn ? "OUT" : "IN")}
                disabled={isPunching}
                className={`relative group flex items-center justify-center w-full md:w-64 px-8 py-4 text-white font-bold text-lg rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:hover:translate-y-0
                  ${hasPunchedIn 
                    ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-rose-500/30" 
                    : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/30"
                  }
                `}
              >
                {isPunching ? (
                  <span className="flex items-center animate-pulse">
                    <MapPin className="mr-2 h-5 w-5 animate-bounce" /> Locating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Fingerprint className="mr-2 h-6 w-6 opacity-80 group-hover:scale-110 transition-transform" /> 
                    {hasPunchedIn ? "PUNCH OUT" : "PUNCH IN"}
                  </span>
                )}
              </button>
            )}

            {/* Leave Request Button */}
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2 flex items-center transition-colors"
            >
              🌴 Request Leave / View Calendar
            </button>
          </div>
        </div>

        {/* Strict Security Location Error Banner */}
        {locationError && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 backdrop-blur-md rounded-xl border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-semibold flex items-start animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <p>{locationError}</p>
          </div>
        )}
      </div>

      {/* 🚀 MODAL KO DIV KE BAHAR RAKHA HAI TAAKI FULL SCREEN AAYE */}
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
    </>
  );
}