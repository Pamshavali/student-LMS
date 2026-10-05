import React, { useState } from "react";
import { User, Save, AlertCircle, CheckCircle2, Shield, Mail, Phone, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/api";
import Badge from "../../components/Badge";

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await userService.update(user.id, payload);
      if (res.success && res.data) {
        updateUserProfile(res.data);
        setSuccess("Profile information updated successfully!");
        setPassword("");
      }
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
          User Profile & Security
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Manage your personal details and account access credentials
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        {/* Profile Card Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
              {user?.first_name} {user?.last_name}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.25rem" }}>
              <Badge variant={user?.role}>{user?.role}</Badge>
              <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
                ID #{user?.id}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Email Address (Fixed Identity)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0100"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Change Password (Leave blank to keep unchanged)
            </label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? "Updating..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
