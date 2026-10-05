import React, { useEffect, useState } from "react";
import { Users, UserPlus, Search, Edit2, Trash2, CheckCircle, XCircle, Save, AlertCircle } from "lucide-react";
import { userService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    role: "STUDENT",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10 };
      if (role) params.role = role;
      if (search.trim()) params.search = search.trim();

      const res = await userService.list(params);
      if (res.success && res.data) {
        setUsers(res.data.items || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalRecords(res.data.total_records || 0);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      role: "STUDENT",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      password: "", // leave blank unless updating
      phone: u.phone || "",
      role: u.role,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingUser) {
        const payload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role,
        };
        if (formData.password) payload.password = formData.password;
        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.is_active;
    try {
      await userService.setStatus(user.id, nextStatus);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to update user status.");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete account for "${user.first_name} ${user.last_name}"?`)) return;
    try {
      await userService.delete(user.id);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to delete user.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            User Account Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Administer system credentials, role designations, and active access states
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1rem 1.25rem",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
            />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["", "STUDENT", "TEACHER", "ADMIN"].map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${role === r ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
            >
              {r === "" ? "All Roles" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Querying user records from MySQL..." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Account Status</th>
                <th>Created Timestamp</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff" }}>
                      {u.first_name} {u.last_name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{u.email}</div>
                  </td>
                  <td>
                    <Badge variant={u.role}>{u.role}</Badge>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {u.phone || "—"}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: u.is_active ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {u.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="btn btn-secondary btn-sm"
                        title={u.is_active ? "Deactivate User" : "Activate User"}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary btn-sm"
                        title="Edit User"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(u)}
                        className="btn btn-danger btn-sm"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => setPage(p)}
      />

      {/* User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.first_name} ${editingUser.last_name}` : "Create New User"}
      >
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              {editingUser ? "New Password (Leave blank to keep current)" : "Password"}
            </label>
            <input
              type="password"
              required={!editingUser}
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? "••••••••••••" : "At least 6 characters"}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Assigned Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
