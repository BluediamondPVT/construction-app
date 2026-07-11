"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

export interface PublicHolidayItem {
  _id: string;
  name: string;
  dateString: string;
  type: "National" | "Regional" | "Religious";
  isActive: boolean;
  description?: string;
}

export default function HRHolidaysPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<PublicHolidayItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHolidayItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    dateString: string;
    type: "National" | "Regional" | "Religious";
    isActive: boolean;
    description: string;
  }>({
    name: "",
    dateString: `${selectedYear}-01-01`,
    type: "National",
    isActive: true,
    description: "",
  });

  const [filterType, setFilterType] = useState<string>("ALL");

  const fetchHolidays = async (year: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/holidays?year=${year}`);
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error("Error loading holidays:", err);
      showNotification("error", "Failed to load holidays");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays(selectedYear);
  }, [selectedYear]);

  const showNotification = (type: "success" | "error", text: string) => {
    if (type === "success") toast.success(text);
    else toast.error(text);
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePreSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/hr/holidays/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      });
      const data = await res.json();
      if (res.ok) {
        setHolidays(data.holidays || []);
        showNotification("success", data.message || `Standard holidays seeded for ${selectedYear}`);
      } else {
        showNotification("error", data.message || "Seeding failed");
      }
    } catch (err) {
      showNotification("error", "Network error while seeding");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingHoliday(null);
    setFormData({
      name: "",
      dateString: `${selectedYear}-01-01`,
      type: "National",
      isActive: true,
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (holiday: PublicHolidayItem) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      dateString: holiday.dateString,
      type: holiday.type,
      isActive: holiday.isActive,
      description: holiday.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHoliday) {
        const res = await fetch("/api/hr/holidays", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingHoliday._id,
            ...formData,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showNotification("success", `Updated holiday '${formData.name}'`);
          setIsModalOpen(false);
          fetchHolidays(selectedYear);
        } else {
          showNotification("error", data.message || "Failed to update holiday");
        }
      } else {
        const res = await fetch("/api/hr/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showNotification("success", `Added holiday '${formData.name}'`);
          setIsModalOpen(false);
          fetchHolidays(selectedYear);
        } else {
          showNotification("error", data.message || "Failed to create holiday");
        }
      }
    } catch (err) {
      showNotification("error", "Error saving holiday");
    }
  };

  const handleToggleActive = async (holiday: PublicHolidayItem) => {
    try {
      const res = await fetch("/api/hr/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: holiday._id,
          isActive: !holiday.isActive,
        }),
      });
      if (res.ok) {
        setHolidays((prev) =>
          prev.map((item) =>
            item._id === holiday._id ? { ...item, isActive: !holiday.isActive } : item
          )
        );
        showNotification(
          "success",
          `${holiday.name} is now ${!holiday.isActive ? "Active" : "Inactive"}`
        );
      }
    } catch (err) {
      showNotification("error", "Failed to update status");
    }
  };

  const executeDelete = async (id: string, name: string) => {
    const toastId = toast.loading(`Deleting holiday '${name}'...`);
    try {
      const res = await fetch(`/api/hr/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHolidays((prev) => prev.filter((h) => h._id !== id));
        toast.success(`Deleted holiday '${name}'`, { id: toastId });
        setNotification({ type: "success", text: `Deleted holiday '${name}'` });
      } else {
        toast.error("Failed to delete holiday", { id: toastId });
        showNotification("error", "Failed to delete holiday");
      }
    } catch (err) {
      toast.error("Error deleting holiday", { id: toastId });
      showNotification("error", "Error deleting holiday");
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Holiday",
      message: `Are you sure you want to delete '${name}'?`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        executeDelete(id, name);
      },
    });
  };

  // 🎨 NEON THEME BADGES
  const getTypeBadge = (type: string) => {
    if (type === "National") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] uppercase tracking-wider">
          🇮🇳 National
        </span>
      );
    }
    if (type === "Regional") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)] uppercase tracking-wider">
          🏛️ Regional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] uppercase tracking-wider">
        🌙 Religious
      </span>
    );
  };

  // 🎨 NEON THEME CARD WRAPPERS
  const getCardTheme = (type: string, isActive: boolean) => {
    if (!isActive) return "border-slate-800 bg-slate-900/40 opacity-50 grayscale transition-all";
    
    if (type === "National") return "border-blue-500/30 bg-slate-900/40 hover:bg-blue-500/5 hover:border-blue-500/60 shadow-[inset_0_0_15px_rgba(59,130,246,0.02)] hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]";
    if (type === "Regional") return "border-amber-500/30 bg-slate-900/40 hover:bg-amber-500/5 hover:border-amber-500/60 shadow-[inset_0_0_15px_rgba(245,158,11,0.02)] hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]";
    return "border-emerald-500/30 bg-slate-900/40 hover:bg-emerald-500/5 hover:border-emerald-500/60 shadow-[inset_0_0_15px_rgba(16,185,129,0.02)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]";
  };

  const filteredHolidays = holidays.filter((item) => {
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 text-slate-200">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md ${
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
              : "bg-rose-950/80 border-rose-500/50 text-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold tracking-wide">{notification.text}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center tracking-tight">
            <CalendarDays className="mr-3 h-6 w-6 text-blue-500" />
            Company Public Holidays
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Manage fixed & dynamic lunar public holidays. Paid automatically by the payroll engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Tabs */}
          <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            {[currentYear, currentYear + 1].map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedYear === year
                    ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                    : "text-slate-500 hover:text-white hover:bg-slate-800"
                }`}
              >
                {year} <span className="hidden sm:inline">{year === currentYear ? "(Current)" : "(Upcoming)"}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={handlePreSeed}
              disabled={isSeeding}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/50 text-white text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              <span className="hidden sm:inline">Pre-Seed Standard</span>
              <span className="sm:hidden">Pre-Seed</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 hover:text-white text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add <span className="hidden sm:inline ml-1">Holiday</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mr-2">
            Filter:
          </span>
          {["ALL", "National", "Regional", "Religious"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                filterType === t
                  ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                  : "bg-transparent text-slate-500 border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
          Total: <span className="text-white ml-1">{filteredHolidays.length}</span>
        </div>
      </div>

      {/* Holidays Display Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-blue-400/70 bg-slate-900/30 rounded-3xl border border-slate-800">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <span className="text-xs font-bold tracking-widest uppercase">Fetching Records...</span>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-dashed border-slate-700 text-center flex flex-col items-center justify-center">
          <Calendar className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white tracking-wide">No Holidays Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
            Click 'Pre-Seed Standard Holidays' to instantly populate Republic Day, Idul Fitr, Eid ul Azha, Independence Day, and more for <strong className="text-blue-400">{selectedYear}</strong>.
          </p>
          <button
            onClick={handlePreSeed}
            disabled={isSeeding}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-105"
          >
            Pre-Seed Standard Holidays
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredHolidays.map((holiday) => {
            const dateObj = new Date(holiday.dateString);
            const formattedDate = dateObj.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={holiday._id}
                className={`group relative backdrop-blur-xl rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${getCardTheme(holiday.type, holiday.isActive)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      {formattedDate}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {holiday.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {getTypeBadge(holiday.type)}
                  </div>
                </div>

                {holiday.description && (
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {holiday.description}
                  </p>
                )}

                <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(holiday)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        holiday.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      {holiday.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(holiday)}
                      className="p-2 rounded-lg text-slate-400 border border-transparent hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Edit Holiday"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(holiday._id, holiday.name)}
                      className="p-2 rounded-lg text-slate-400 border border-transparent hover:border-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete Holiday"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✏️ ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1121] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center tracking-wide">
                <CalendarDays className="w-5 h-5 mr-2 text-blue-500"/>
                {editingHoliday ? "Edit Public Holiday" : "Add Public Holiday"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Holiday Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Republic Day or Idul Fitr"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateString}
                  onChange={(e) => setFormData({ ...formData, dateString: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white text-sm outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Holiday Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["National", "Regional", "Religious"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider border transition-all ${
                        formData.type === type
                          ? type === "National" ? "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]" :
                            type === "Regional" ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]" :
                            "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details (e.g., Subject to moon sighting)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 resize-none custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center cursor-pointer gap-3 group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${formData.isActive ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-600'}`}>
                    {formData.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-400 group-hover:text-slate-300 uppercase tracking-widest">
                    Active (Applies to Payroll)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-widest uppercase transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  {editingHoliday ? "SAVE CHANGES" : "CREATE HOLIDAY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTWEIGHT DARK ENTERPRISE CONFIRM MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-slate-700/60 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}