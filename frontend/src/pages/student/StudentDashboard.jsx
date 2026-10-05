import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
  FileCheck2,
  Calendar,
} from "lucide-react";
import { dashboardService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import Badge from "../../components/Badge";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getStudentStats();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load student dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating student progress metrics from MySQL..." />;

  const stats = data?.stats || {};
  const recentCourses = data?.recent_courses || [];
  const pendingAssignments = data?.pending_assignments || [];
  const recentGrades = data?.recent_grades || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
          Welcome back, {user?.first_name}!
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Student Academic Portal &mdash; Track your course progress, pending submissions, and grades
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_enrolled_courses || 0}</div>
            <div className="stat-label">Enrolled Courses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.active_courses || 0}</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.pending_assignments_count || 0}</div>
            <div className="stat-label">Pending Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--secondary)" }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.average_grade ? `${stats.average_grade}%` : "N/A"}</div>
            <div className="stat-label">Average Grade</div>
          </div>
        </div>
      </div>

      {/* Course Progress Section */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen size={18} color="var(--primary)" /> Enrolled Course Progress
          </h2>
          <Link to="/student/courses" className="btn btn-secondary btn-sm">
            View All Enrolled <ArrowRight size={14} />
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            You are not enrolled in any courses yet.{" "}
            <Link to="/courses" style={{ color: "var(--primary)", textDecoration: "underline" }}>
              Browse the course catalog
            </Link>.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {recentCourses.map((c) => {
              const progressPct = parseFloat(c.progress || 0);
              return (
                <div
                  key={c.course_id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1rem 1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>
                        {c.course_title}
                      </h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                        Instructor: {c.teacher_name} &bull; {c.total_modules || 0} Modules
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge variant={c.enrollment_status}>{c.enrollment_status}</Badge>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)", marginTop: "3px" }}>
                        {progressPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar-bg" style={{ marginTop: "0.5rem" }}>
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                    <Link
                      to={`/student/courses/${c.course_id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.8rem" }}
                    >
                      Study Modules <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Grid: Upcoming Coursework & Recent Grades */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Upcoming Coursework */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Clock size={16} color="var(--warning)" /> Upcoming Assignments
            </h3>
            <Link to="/student/assignments" className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem" }}>
              All Tasks
            </Link>
          </div>

          {pendingAssignments.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No pending assignments. You are completely caught up!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {pendingAssignments.map((a) => (
                <div
                  key={a.assignment_id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.75rem 1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h5 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                      {a.assignment_title}
                    </h5>
                    <span style={{ fontSize: "0.75rem", color: "var(--warning)", fontWeight: 600 }}>
                      {a.max_marks} pts
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                    Course: {a.course_title} &bull; Due: {new Date(a.due_date).toLocaleDateString()}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <Link
                      to="/student/assignments"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                    >
                      Submit Work
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Grades */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Award size={16} color="var(--success)" /> Recent Graded Work
            </h3>
            <Link to="/student/grades" className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem" }}>
              Full Gradebook
            </Link>
          </div>

          {recentGrades.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No grades recorded yet. Submitted work is awaiting evaluation.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentGrades.map((g) => (
                <div
                  key={g.submission_id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.75rem 1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h5 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                        {g.assignment_title}
                      </h5>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {g.course_title}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--success)" }}>
                        {g.marks} / {g.max_marks}
                      </span>
                    </div>
                  </div>
                  {g.feedback && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem", fontStyle: "italic" }}>
                      "{g.feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
