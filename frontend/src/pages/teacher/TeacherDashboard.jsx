import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  FileCheck2,
  Clock,
  Award,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { dashboardService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import Badge from "../../components/Badge";

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getTeacherStats();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load teacher stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating instructor telemetry from database..." />;

  const stats = data?.stats || {};
  const recentSubmissions = data?.recent_submissions || [];
  const courses = data?.courses || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Faculty Portal: Welcome, Dr. {user?.last_name || user?.first_name}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Manage curriculum, supervise student progress, and grade incoming coursework
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/teacher/courses/new" className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Create New Course
          </Link>
          <Link to="/teacher/submissions" className="btn btn-secondary btn-sm">
            <Award size={15} /> Grade Queue ({stats.pending_submissions || 0})
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_courses || 0}</div>
            <div className="stat-label">Assigned Courses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--secondary)" }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_students || 0}</div>
            <div className="stat-label">Enrolled Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.pending_submissions || 0}</div>
            <div className="stat-label">Pending Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.average_student_grade ? `${stats.average_student_grade}%` : "N/A"}</div>
            <div className="stat-label">Average Class Grade</div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Queue */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileCheck2 size={18} color="var(--primary)" /> Student Submissions to Review
          </h2>
          <Link to="/teacher/submissions" className="btn btn-secondary btn-sm">
            View Complete Queue <ArrowRight size={14} />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No pending coursework submissions requiring review.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{sub.student_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{sub.student_email}</div>
                    </td>
                    <td>{sub.assignment_title}</td>
                    <td style={{ color: "var(--text-muted)" }}>{sub.course_title}</td>
                    <td style={{ color: "var(--text-dim)" }}>
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Badge variant={sub.status}>{sub.status}</Badge>
                    </td>
                    <td>
                      <Link to="/teacher/submissions" className="btn btn-primary btn-sm">
                        Grade Work
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Courses Assigned to this Teacher */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen size={18} color="var(--secondary)" /> My Teaching Portfolio ({courses.length})
          </h2>
          <Link to="/teacher/courses" className="btn btn-secondary btn-sm">
            Manage Courses <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {courses.map((c) => (
            <div
              key={c.id}
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
                  {c.category_name}
                </span>
                <Badge variant={c.status}>{c.status}</Badge>
              </div>

              <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>
                {c.title}
              </h4>

              <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
                <span>Students: <strong style={{ color: "#fff" }}>{c.enrolled_students || 0}</strong></span>
                <span>Assignments: <strong style={{ color: "#fff" }}>{c.assignments_count || 0}</strong></span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link to={`/teacher/courses/${c.id}/content`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Syllabus
                </Link>
                <Link to={`/teacher/courses/${c.id}/edit`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TeacherDashboard;
