import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  FileCheck2,
  FolderTree,
  ArrowRight,
  UserPlus,
  Shield,
  Activity,
} from "lucide-react";
import { dashboardService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import Badge from "../../components/Badge";

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await dashboardService.getAdminStats();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <LoadingSpinner message="Querying system telemetry from MySQL..." />;

  const stats = data?.stats || {};
  const recentUsers = data?.recent_users || [];
  const topCourses = data?.top_courses || [];
  const categoryDist = data?.category_distribution || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            System Administration & Telemetry
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Institutional metrics, database state overview, and administrative user controls
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/admin/users" className="btn btn-primary btn-sm">
            <UserPlus size={15} /> User Management
          </Link>
          <Link to="/admin/categories" className="btn btn-secondary btn-sm">
            <FolderTree size={15} /> Categories
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--secondary)" }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_students || 0}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_teachers || 0}</div>
            <div className="stat-label">Faculty Teachers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_courses || 0}</div>
            <div className="stat-label">Total Courses ({stats.published_courses || 0} Published)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_enrollments || 0}</div>
            <div className="stat-label">Total Enrollments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--danger)" }}>
            <FileCheck2 size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_assignments || 0}</div>
            <div className="stat-label">Course Assignments</div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Registrations & Top Enrolled Courses */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.75rem" }}>
        {/* Recent Registrations */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} color="var(--primary)" /> Recent User Registrations
            </h2>
            <Link to="/admin/users" className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem" }}>
              Manage Users <ArrowRight size={13} />
            </Link>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
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
                    <td>
                      <span style={{ fontSize: "0.8rem", color: u.is_active ? "var(--success)" : "var(--danger)" }}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top Courses Leaderboard */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={18} color="var(--secondary)" /> Top Enrolled Courses
            </h2>
            <Link to="/admin/courses" className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem" }}>
              All Courses <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {topCourses.map((c, idx) => (
              <div
                key={c.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.85rem" }}>
                      #{idx + 1}
                    </span>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>
                      {c.title}
                    </h4>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "2px" }}>
                    {c.category_name} &bull; {c.teacher_name}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                    {c.enrollment_count || 0}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                    Enrolled
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
