import React, { useEffect, useState } from "react";
import { BarChart3, Database, ShieldCheck, Activity, Users, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { dashboardService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";

export const SystemStatistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      setLoading(true);
      try {
        const res = await dashboardService.getAdminStats();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTelemetry();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating MySQL relational statistics..." />;

  const stats = data?.stats || {};
  const topCourses = data?.top_courses || [];
  const categories = data?.category_distribution || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
          System Telemetry & Database Analytics
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Relational performance metrics, institutional storage health, and distribution analytics
        </p>
      </div>

      {/* Database State Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
          border: "1px solid #334161",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--success)",
            }}
          >
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>
              MySQL 8.0 InnoDB Connection Pool
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Engine Status: Connected &bull; Isolation Level: Repeatable Read &bull; ORM Overhead: 0% (RAW SQL)
            </p>
          </div>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--success)", fontSize: "0.9rem", fontWeight: 600 }}>
          <CheckCircle2 size={18} /> Production Schema Online
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.75rem" }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={18} color="var(--primary)" /> Academic Category Distribution
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {categories.map((c) => (
              <div
                key={c.category_name}
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
                <span style={{ fontWeight: 600, color: "#fff" }}>{c.category_name}</span>
                <span style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 700 }}>
                  {c.course_count} courses
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top 5 Enrollment Leaders */}
        <section className="card">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={18} color="var(--secondary)" /> Enrollment Popularity Ranking
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {topCourses.map((c, i) => (
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
                  <div style={{ fontWeight: 600, color: "#fff" }}>
                    #{i + 1} {c.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {c.category_name} &bull; {c.teacher_name}
                  </div>
                </div>

                <div style={{ textAlign: "right", fontWeight: 700, color: "var(--secondary)" }}>
                  {c.enrollment_count || 0} students
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemStatistics;
