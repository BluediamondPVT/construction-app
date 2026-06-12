"use client";

import { useState, useEffect } from "react";
import { UserPlus, Shield, CheckSquare, Square, Users, RefreshCw, Edit2, X, Key, UserCog } from "lucide-react";

const rolePermissionsMap: Record<string, string[]> = {
  HR: ["view_employees", "add_employee", "edit_payroll", "view_reports"],
  Store: ["view_inventory", "add_material", "issue_material", "delete_material"],
  Project: ["view_site_progress", "add_daily_report", "request_material"],
  Accounts: ["view_invoices", "create_invoice", "process_payments"],
  Purchase: ["view_vendors", "create_po", "approve_po", "view_quotations"], // NAYA
  CRM: ["view_clients", "add_lead", "track_sales", "view_contracts"],       // NAYA
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
  
  // New Editable Fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

const fetchStaff = async () => {
    try {
      setIsTableLoading(true);
      
      // Promise.all use kar rahe hain taaki API call aur 1-second ka timer ek saath chalein
      const [response] = await Promise.all([
        fetch("/api/users"),
        new Promise((resolve) => setTimeout(resolve, 1000)) // Artificial 1 second delay
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
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
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
        alert("Success: " + data.message);
        (e.target as HTMLFormElement).reset();
        setRole("");
        setActivePermissions([]);
        fetchStaff(); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("User creation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EDIT MODAL LOGIC ---
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
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
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
        fetchStaff(); // Refresh table data automatically
        alert("User completely updated!");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      
      {/* SECTION 1: ADD STAFF FORM */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <UserPlus className="mr-3 h-6 w-6 text-blue-600" />
            Add New Staff Member
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <form onSubmit={handleSubmitCreate} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input type="text" name="name" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Amit Sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input type="email" name="email" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="amit@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Temporary Password</label>
                <input type="text" name="password" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Temp@123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Department / Role</label>
                <select name="role" required value={role} onChange={handleRoleChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="" disabled>Select a role...</option>
                  {Object.keys(rolePermissionsMap).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {role && (
              <div className="mb-6 p-5 bg-blue-50 dark:bg-slate-700/50 rounded-lg border border-blue-100 dark:border-slate-600">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" /> Granular Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {rolePermissionsMap[role].map((p) => {
                    const isChecked = activePermissions.includes(p);
                    return (
                      <div key={p} onClick={() => toggleCreatePermission(p)} className={`flex items-center p-3 rounded-md cursor-pointer transition-colors border ${isChecked ? "bg-white dark:bg-slate-800 border-blue-500 shadow-sm" : "bg-transparent border-slate-200 dark:border-slate-600 opacity-70"}`}>
                        {isChecked ? <CheckSquare className="h-5 w-5 text-blue-600 mr-3" /> : <Square className="h-5 w-5 text-slate-400 mr-3" />}
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{p.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={isLoading || !role} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
                {isLoading ? "Creating Staff..." : "Create Staff Account"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 2: VIEW STAFF DATA TABLE */}
      <div>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="mr-3 h-6 w-6 text-slate-700 dark:text-slate-300" /> Active Staff Directory
          </h2>
          <button onClick={fetchStaff} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${isTableLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300">
                {isTableLoading ? (
                  <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{staff.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold ${staff.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                          <span className={`h-2 w-2 rounded-full mr-2 ${staff.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                          {staff.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openEditModal(staff)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: FULL EDIT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <UserCog className="mr-2 h-5 w-5 text-blue-500" /> Edit Staff Profile
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-6 space-y-8 overflow-y-auto">
              
              {/* Basic Info Edit */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                    <input 
                      type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                    <input 
                      type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Account Status</label>
                    <select 
                      value={editIsActive ? "active" : "disabled"} 
                      onChange={(e) => setEditIsActive(e.target.value === "active")}
                      className={`w-full px-4 py-2 border rounded-lg outline-none font-medium ${editIsActive ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 border-red-200 text-red-700 dark:text-red-400"}`}
                    >
                      <option value="active">Active (Can Login)</option>
                      <option value="disabled">Disabled (Cannot Login)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Reset */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800/50">
                <label className="block text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center">
                  <Key className="h-4 w-4 mr-2" /> Reset Password
                </label>
                <input 
                  type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-orange-200 dark:border-orange-800/50 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" 
                  placeholder="Leave blank to keep current password" 
                />
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" /> Update Permissions ({editingUser.role})
                </h3>
                {rolePermissionsMap[editingUser.role] ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rolePermissionsMap[editingUser.role].map((p) => {
                      const isChecked = editPermissions.includes(p);
                      return (
                        <div key={p} onClick={() => toggleEditPermission(p)} className={`flex items-center p-3 rounded-md cursor-pointer transition-colors border ${isChecked ? "bg-blue-50 dark:bg-slate-700 border-blue-500" : "bg-transparent border-slate-200 dark:border-slate-600"}`}>
                          {isChecked ? <CheckSquare className="h-5 w-5 text-blue-600 mr-3" /> : <Square className="h-5 w-5 text-slate-400 mr-3" />}
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{p.replace(/_/g, " ")}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No modular permissions available for this role.</p>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50 mt-auto">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateUser} disabled={isUpdating} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                {isUpdating ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}