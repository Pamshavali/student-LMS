import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  Circle,
  Video,
  FileText,
  ExternalLink,
  Award,
} from "lucide-react";
import { courseService, contentService, enrollmentService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import Badge from "../../components/Badge";

export const StudentCourseView = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [completedModules, setCompletedModules] = useState(() => {
    const saved = localStorage.getItem(`course_${id}_completed_modules`);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, contentRes, enrollmentsRes] = await Promise.all([
          courseService.getById(id),
          contentService.listByCourse(id),
          enrollmentService.getMyCourses(),
        ]);

        if (courseRes.success) setCourse(courseRes.data);
        if (contentRes.success) setModules(contentRes.data);

        if (enrollmentsRes.success && enrollmentsRes.data) {
          const match = enrollmentsRes.data.find((e) => Number(e.course_id) === Number(id));
          setEnrollment(match);
        }
      } catch (err) {
        console.error("Failed to load course view", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleModuleComplete = async (moduleId) => {
    let nextCompleted;
    if (completedModules.includes(moduleId)) {
      nextCompleted = completedModules.filter((mId) => mId !== moduleId);
    } else {
      nextCompleted = [...completedModules, moduleId];
    }
    setCompletedModules(nextCompleted);
    localStorage.setItem(`course_${id}_completed_modules`, JSON.stringify(nextCompleted));

    // Calculate dynamic progress: (completed / total) * 100
    if (modules.length > 0 && enrollment) {
      const calculatedProgress = (nextCompleted.length / modules.length) * 100;
      try {
        const updated = await enrollmentService.updateProgress(
          enrollment.id,
          calculatedProgress
        );
        if (updated.success) {
          setEnrollment((prev) => ({
            ...prev,
            progress: calculatedProgress,
            status: calculatedProgress >= 100 ? "COMPLETED" : "ACTIVE",
          }));
        }
      } catch (err) {
        console.error("Failed to update progress:", err);
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading syllabus study module..." />;
  if (!course) return <div className="alert alert-danger">Course not found.</div>;

  const progressPct = parseFloat(enrollment?.progress || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Link to="/student/courses" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <ArrowLeft size={16} /> Back to My Courses
      </Link>

      {/* Course Progress Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--bg-card) 0%, #131c31 100%)",
          padding: "1.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
                {course.category_name}
              </span>
              <Badge variant={course.level}>{course.level}</Badge>
              {enrollment && <Badge variant={enrollment.status}>{enrollment.status}</Badge>}
            </div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>
              {course.title}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Instructor: {course.teacher_name} &bull; {modules.length} Learning Modules
            </p>
          </div>

          <div style={{ minWidth: "220px", textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Calculated Progress
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: progressPct >= 100 ? "var(--success)" : "var(--primary)" }}>
              {progressPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              {completedModules.length} of {modules.length} Modules Completed
            </div>
          </div>
        </div>

        <div className="progress-bar-bg" style={{ marginTop: "1rem", height: "10px" }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Modules List */}
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BookOpen size={18} color="var(--primary)" /> Learning Modules
        </h2>

        {modules.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No syllabus content available for this course yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {modules.map((m, idx) => {
              const isCompleted = completedModules.includes(m.id);
              return (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    borderColor: isCompleted ? "rgba(16, 185, 129, 0.4)" : "var(--border-color)",
                    background: isCompleted ? "rgba(16, 185, 129, 0.03)" : "var(--bg-card)",
                  }}
                >
                  <button
                    onClick={() => toggleModuleComplete(m.id)}
                    title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
                    style={{
                      marginTop: "3px",
                      color: isCompleted ? "var(--success)" : "var(--text-dim)",
                      cursor: "pointer",
                    }}
                  >
                    {isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: isCompleted ? "#a7f3d0" : "#fff",
                          textDecoration: isCompleted ? "line-through" : "none",
                        }}
                      >
                        Module {idx + 1}: {m.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {m.content_type}
                      </span>
                    </div>

                    {m.description && (
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.4rem", lineHeight: 1.5 }}>
                        {m.description}
                      </p>
                    )}

                    {m.content_url && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <a
                          href={m.content_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          Access Resource <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourseView;
