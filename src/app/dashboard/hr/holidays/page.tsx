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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      const res = await fetch(`/api/hr/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHolidays((prev) => prev.filter((h) => h._id !== id));
        showNotification("success", `Deleted holiday '${name}'`);
      } else {
        showNotification("error", "Failed to delete holiday");
      }
    } catch (err) {
      showNotification("error", "Error deleting holiday");
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "National") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20">
          🇮🇳 National
        </span>
      );
    }
    if (type === "Regional") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          🏛️ Regional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
        🌙 Religious
      </span>
    );
  };

  const filteredHolidays = holidays.filter((item) => {
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Header & Year Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <CalendarDays className="mr-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
            Company Public Holidays
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage fixed & dynamic lunar public holidays. Paid automatically by the payroll engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Tabs */}
          <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300/40 dark:border-slate-700">
            {[currentYear, currentYear + 1].map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedYear === year
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {year} {year === currentYear ? "(Current)" : "(Upcoming)"}
              </button>
            ))}
          </div>

          {/* Pre-Seed Standard Holidays Button */}
          <button
            onClick={handlePreSeed}
            disabled={isSeeding}
            className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isSeeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Pre-Seed Standard Holidays ({selectedYear})
          </button>

          {/* Add Holiday Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Holiday
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Filter Type:
          </span>
          {["ALL", "National", "Regional", "Religious"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total: <span className="text-slate-900 dark:text-white">{filteredHolidays.length}</span>
        </div>
      </div>

      {/* Holidays Display Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
          <span className="text-sm font-medium">Loading {selectedYear} Public Holidays...</span>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-10 border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Holidays Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Click &apos;Pre-Seed Standard Holidays&apos; to instantly populate Republic Day, Idul Fitr, Eid ul Azha, Independence Day, and more for {selectedYear}.
          </p>
          <button
            onClick={handlePreSeed}
            disabled={isSeeding}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg"
          >
            Pre-Seed Standard Holidays
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className={`group relative bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
                  holiday.isActive
                    ? "border-slate-200 dark:border-slate-700/80"
                    : "border-slate-200/50 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {formattedDate}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {holiday.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getTypeBadge(holiday.type)}
                  </div>
                </div>

                {holiday.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {holiday.description}
                  </p>
                )}

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(holiday)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors border ${
                        holiday.isActive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {holiday.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(holiday)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Edit Holiday"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(holiday._id, holiday.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
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

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingHoliday ? "Edit Public Holiday" : "Add Public Holiday"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Holiday Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Republic Day or Idul Fitr"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateString}
                  onChange={(e) => setFormData({ ...formData, dateString: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Holiday Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["National", "Regional", "Religious"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.type === type
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Description / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details (e.g., Subject to moon sighting)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Active (Applies to Payroll & Calendar)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
                >
                  {editingHoliday ? "Save Changes" : "Create Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
