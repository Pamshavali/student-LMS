import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  ShieldCheck,
  Zap,
  GraduationCap,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { courseService } from "../../services/api";
import Badge from "../../components/Badge";

export const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await courseService.list({ page_size: 3, sort_by: "newest" });
        if (res.success && res.data) {
          setCourses(res.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load featured courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", paddingBottom: "3rem" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(10, 14, 23, 0) 100%)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          padding: "3.5rem 2.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.3rem 0.9rem",
            borderRadius: "var(--radius-full)",
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            fontSize: "0.825rem",
            color: "#a5b4fc",
            marginBottom: "1.25rem",
          }}
        >
          <Database size={15} />
          <span>Production Python 3.11 + FastAPI + MySQL 8 + RAW SQL</span>
        </div>

        <h1
          style={{
            fontSize: "2.75rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            maxWidth: "760px",
            margin: "0 auto 1.25rem auto",
            color: "#fff",
          }}
        >
          Master Complex Systems with Real{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Relational Architecture
          </span>
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-muted)",
            maxWidth: "640px",
            margin: "0 auto 2rem auto",
            lineHeight: 1.6,
          }}
        >
          A battle-tested Student LMS built with zero ORM abstractions. Featuring ACID transactions,
          indexed query optimization, strict role-based access control, and complete coursework workflows.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link to="/courses" className="btn btn-primary" style={{ padding: "0.75rem 1.4rem", fontSize: "0.95rem" }}>
            Explore Courses <ArrowRight size={17} />
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: "0.75rem 1.4rem", fontSize: "0.95rem" }}>
            Demo Portal Sign In
          </Link>
        </div>

        {/* Demo Credentials Card */}
        <div
          style={{
            marginTop: "2.5rem",
            maxWidth: "680px",
            margin: "2.5rem auto 0 auto",
            background: "rgba(15, 21, 35, 0.9)",
            border: "1px solid #334161",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem 1.5rem",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Lock size={16} color="var(--primary)" />
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Demo Credentials (Password: <code style={{ color: "#38bdf8" }}>Password123!</code>)
            </h4>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", fontSize: "0.825rem" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
              <span style={{ color: "#f87171", fontWeight: 600 }}>ADMIN:</span>
              <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>admin@lms.com</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
              <span style={{ color: "#818cf8", fontWeight: 600 }}>TEACHER:</span>
              <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>teacher@lms.com</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
              <span style={{ color: "#22d3ee", fontWeight: 600 }}>STUDENT:</span>
              <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>student@lms.com</div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Highlights */}
      <section>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            Enterprise Architecture Pillars
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Engineered to demonstrate production backend and relational database capabilities
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem" }}>
          <div className="card">
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                marginBottom: "1rem",
              }}
            >
              <Database size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>
              Zero-ORM Raw SQL
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Handcrafted parameterized SQL queries with composite joins, window functions, and B-Tree indexes without ORM query overhead.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--success)",
                marginBottom: "1rem",
              }}
            >
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>
              ACID Transactions
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Atomic enrollment and grading pipelines with managed connection leases, automated commits, and error-triggered rollbacks.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                background: "rgba(6, 182, 212, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--secondary)",
                marginBottom: "1rem",
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>
              Role-Based Guards
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Strict backend RBAC dependencies for Admin, Teacher, and Student roles with cryptographic JWT signatures and bcrypt passwords.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--warning)",
                marginBottom: "1rem",
              }}
            >
              <GraduationCap size={22} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>
              Full Academic Lifecycle
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              From syllabus delivery and assignment submissions to deadline enforcement, teacher grading, and dynamic progress calculation.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>Featured Course Catalog</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Top-rated engineering and computer science curricula</p>
          </div>
          <Link to="/courses" className="btn btn-secondary btn-sm">
            View All ({courses.length}+) <ArrowRight size={15} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {courses.map((course) => (
            <div key={course.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
                    {course.category_name}
                  </span>
                  <Badge variant={course.level}>{course.level}</Badge>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.6rem" }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                  {course.description.substring(0, 110)}...
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
                  <span>Instructor: <strong style={{ color: "var(--text-muted)" }}>{course.teacher_name}</strong></span>
                  <span>{course.duration_hours || 40} hrs</span>
                </div>
                <Link to={`/courses/${course.id}`} className="btn btn-secondary" style={{ width: "100%" }}>
                  Course Syllabus & Details <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
