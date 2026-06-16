"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Shield,
  CheckSquare,
  Square,
  Users,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Key,
  UserCog,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";

// 🚀 EXACT 6 MODULES AS PER YOUR ERP ARCHITECTURE
const rolePermissionsMap: Record<string, string[]> = {
  Marketing: [
    "manage_leads",
    "generate_quotations",
    "submit_tenders",
    "request_boq",
  ],
  Design: [
    "upload_drawings",
    "manage_versions",
    "upload_boq",
    "approve_standards",
  ],
  Project: [
    "view_site_progress",
    "add_daily_report",
    "request_material",
    "upload_completion_cert",
  ],
  Accounts: [
    "view_invoices",
    "create_invoice",
    "process_payments",
    "view_ledger",
  ],
  Store: [
    "view_inventory",
    "add_material",
    "issue_material",
    "view_material_logs",
  ],
  HR: ["view_employees", "add_employee", "edit_payroll", "manage_documents"],
};

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string[];
}

export default function ManageUsersPage() {
  const [role, setRole] = useState("");
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Edit Fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaff = async () => {
    try {
      setIsTableLoading(true);
      const [response] = await Promise.all([
        fetch("/api/users"),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);

      if (response.ok) {
        const data = await response.json();
        setStaffList(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setRole(selected);
    setActivePermissions(rolePermissionsMap[selected] || []);
  };

  const toggleCreatePermission = (permission: string) => {
    setActivePermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleSubmitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const userData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: role,
      permissions: activePermissions,
    };

    try {
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        (e.target as HTMLFormElement).reset();
        setRole("");
        setActivePermissions([]);
        fetchStaff();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("User creation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EDIT LOGIC ---
  const openEditModal = (user: StaffUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditIsActive(user.isActive);
    setEditPermissions(user.permissions || []);
    setNewPassword("");
    setIsEditModalOpen(true);
  };

  const toggleEditPermission = (permission: string) => {
    setEditPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editName,
          email: editEmail,
          isActive: editIsActive,
          permissions: editPermissions,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchStaff();
        toast.success("User completely updated!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- DELETE LOGIC ---
  const confirmDelete = (user: StaffUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        fetchStaff();
        toast.success("User account deleted permanently.");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* SECTION 1: ADD STAFF FORM */}
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <UserPlus className="mr-3 h-8 w-8 text-blue-500 drop-shadow-md" />
            Add New Staff Member
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Create and manage access for enterprise personnel.
          </p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <form onSubmit={handleSubmitCreate} className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-white/40 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-sm transition-all"
                  placeholder="Amit Sharma"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-white/40 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-sm transition-all"
                  placeholder="amit@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 ml-1">
                  Temporary Password
                </label>
                <input
                  type="text"
                  name="password"
                  required
                  className="w-full px-4 py-3 border border-white/40 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-sm transition-all"
                  placeholder="Temp@123"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 ml-1">
                  Assign Department
                </label>
                <select
                  name="role"
                  required
                  value={role}
                  onChange={handleRoleChange}
                  className="w-full px-4 py-3 border border-white/40 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-sm transition-all"
                >
                  <option
                    value=""
                    disabled
                    className="text-slate-900 dark:text-slate-900"
                  >
                    Select a role...
                  </option>
                  {Object.keys(rolePermissionsMap).map((r) => (
                    <option
                      key={r}
                      value={r}
                      className="text-slate-900 dark:text-slate-900"
                    >
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role && (
              <div className="mb-8 p-5 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-500" /> Granular
                  Permissions Framework
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {rolePermissionsMap[role].map((p) => {
                    const isChecked = activePermissions.includes(p);
                    return (
                      <div
                        key={p}
                        onClick={() => toggleCreatePermission(p)}
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border backdrop-blur-md ${isChecked ? "bg-white/80 dark:bg-slate-800/80 border-blue-500/50 shadow-sm" : "bg-transparent border-slate-200/50 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-blue-500 mr-3" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400 mr-3" />
                        )}
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">
                          {p.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !role}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? "Provisioning..." : "Create Staff Account"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 2: VIEW STAFF DATA TABLE */}
      <div>
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
              <Users className="mr-3 h-6 w-6 text-slate-700 dark:text-slate-300" />{" "}
              Active Staff Directory
            </h2>
          </div>
          <button
            onClick={fetchStaff}
            className="p-2.5 bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 backdrop-blur-md rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-all shadow-sm group"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-500 ${isTableLoading ? "animate-spin text-blue-500" : ""}`}
            />
          </button>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-white/10 text-sm text-slate-700 dark:text-slate-300">
                {isTableLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-500"
                    >
                      Loading personnel data...
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {staff.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {staff.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 backdrop-blur-sm">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${staff.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-2 ${staff.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                          />
                          {staff.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(staff)}
                            title="Edit User"
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {/* 🚀 DELETE BUTTON */}
                          <button
                            onClick={() => confirmDelete(staff)}
                            title="Delete User"
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: EDIT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl w-full max-w-2xl rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200/50 dark:border-white/10">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                  <UserCog className="h-4 w-4 text-blue-500" />
                </div>
                Edit Staff Profile
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                  Identity & Access
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                      Account Status
                    </label>
                    <select
                      value={editIsActive ? "active" : "disabled"}
                      onChange={(e) =>
                        setEditIsActive(e.target.value === "active")
                      }
                      className={`w-full px-4 py-3 border rounded-xl outline-none font-semibold transition-all ${editIsActive ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"}`}
                    >
                      <option value="active" className="text-slate-900">
                        Active (Authorized)
                      </option>
                      <option value="disabled" className="text-slate-900">
                        Disabled (Revoked)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50/50 dark:bg-orange-500/10 p-5 rounded-xl border border-orange-200/50 dark:border-orange-500/20 backdrop-blur-sm">
                <label className="block text-sm font-semibold text-orange-800 dark:text-orange-400 mb-3 flex items-center">
                  <Key className="h-4 w-4 mr-2" /> Security Reset
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-orange-200 dark:border-orange-500/20 rounded-xl bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  placeholder="Type new password (leave blank to keep current)"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-500" /> Module
                  Access ({editingUser.role})
                </h3>
                {rolePermissionsMap[editingUser.role] ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rolePermissionsMap[editingUser.role].map((p) => {
                      const isChecked = editPermissions.includes(p);
                      return (
                        <div
                          key={p}
                          onClick={() => toggleEditPermission(p)}
                          className={`flex items-center p-3.5 rounded-xl cursor-pointer transition-all border backdrop-blur-md ${isChecked ? "bg-white/80 dark:bg-slate-800/80 border-blue-500/50 shadow-sm" : "bg-transparent border-slate-200/50 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-5 w-5 text-blue-500 mr-3" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400 mr-3" />
                          )}
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">
                            {p.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-100/50 dark:bg-white/5 rounded-xl">
                    No modular permissions available for this core role.
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200/50 dark:border-white/10 flex justify-end gap-3 bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-md mt-auto">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isUpdating ? "Saving Logic..." : "Save All Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 4: NEW DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl w-full max-w-md rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col p-8 text-center relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10 mb-6 border border-red-200 dark:border-red-500/20">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Delete Staff Member?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
              You are about to permanently delete{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {userToDelete.name}
              </strong>
              . Their data and system access will be entirely wiped. This cannot
              be undone.
            </p>

            <div className="flex justify-center gap-3 w-full">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all border border-transparent dark:border-white/5"
              >
                Keep Account
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl transition-all shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
