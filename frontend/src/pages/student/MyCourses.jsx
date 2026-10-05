import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Clock, Trash2, ArrowRight } from "lucide-react";
import { enrollmentService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";

export const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await enrollmentService.getMyCourses();
      if (res.success && res.data) {
        setEnrollments(res.data);
      }
    } catch (err) {
      console.error("Failed to load enrolled courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleDrop = async (enrollmentId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to drop "${courseTitle}"?`)) return;
    try {
      await enrollmentService.drop(enrollmentId);
      fetchEnrollments();
    } catch (err) {
      alert(err.message || "Failed to drop course.");
    }
  };

  if (loading) return <LoadingSpinner message="Fetching enrolled courses from database..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            My Enrolled Courses
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Access lectures, track syllabus completion, and participate in coursework
          </p>
        </div>
        <Link to="/courses" className="btn btn-primary btn-sm">
          Browse More Courses <BookOpen size={15} />
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrollments found"
          description="You are currently not enrolled in any academic courses."
          action={
            <Link to="/courses" className="btn btn-primary btn-sm">
              Explore Course Catalog
            </Link>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {enrollments.map((e) => {
            const progress = parseFloat(e.progress || 0);
            return (
              <div
                key={e.id}
                className="card"
                style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
                      {e.category_name}
                    </span>
                    <Badge variant={e.status}>{e.status}</Badge>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem", lineHeight: 1.35 }}>
                    {e.course_title}
                  </h3>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.4 }}>
                    {e.course_description.substring(0, 100)}...
                  </p>

                  <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
                    Instructor: <strong style={{ color: "#fff" }}>{e.teacher_name}</strong>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Course Progress</span>
                      <strong style={{ color: "var(--primary)" }}>{progress.toFixed(1)}%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <Link
                    to={`/student/courses/${e.course_id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Open Modules <ArrowRight size={14} />
                  </Link>

                  <button
                    onClick={() => handleDrop(e.id, e.course_title)}
                    className="btn btn-danger btn-sm"
                    title="Drop Course"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
