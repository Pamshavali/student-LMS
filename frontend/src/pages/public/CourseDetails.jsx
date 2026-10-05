import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  User,
  Users,
  CheckCircle2,
  FileText,
  Video,
  FileCheck2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { courseService, contentService, assignmentService, enrollmentService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/Badge";
import LoadingSpinner from "../../components/LoadingSpinner";

export const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [notification, setNotification] = useState("");

  const { isAuthenticated, isStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const [courseRes, contentRes, assignRes] = await Promise.all([
          courseService.getById(id),
          contentService.listByCourse(id).catch(() => ({ data: [] })),
          assignmentService.listByCourse(id).catch(() => ({ data: [] })),
        ]);

        if (courseRes.success && courseRes.data) {
          setCourse(courseRes.data);
        }
        setModules(contentRes.data || []);
        setAssignments(assignRes.data || []);

        // Check if student is already enrolled
        if (isAuthenticated && isStudent) {
          try {
            const myCoursesRes = await enrollmentService.getMyCourses();
            if (myCoursesRes.success && myCoursesRes.data) {
              const enrolled = myCoursesRes.data.some((e) => Number(e.course_id) === Number(id));
              setIsEnrolled(enrolled);
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error("Error loading course details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, isAuthenticated, isStudent]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    setNotification("");
    try {
      const res = await enrollmentService.enroll(id);
      if (res.success) {
        setIsEnrolled(true);
        setNotification("Enrollment successful! You can now track progress and submit coursework.");
      }
    } catch (err) {
      alert(err.message || "Failed to enroll.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving course curriculum from database..." />;
  if (!course) return <div className="alert alert-danger">Course not found.</div>;

  const getContentIcon = (type) => {
    switch (type) {
      case "VIDEO":
        return <Video size={16} color="var(--danger)" />;
      case "DOCUMENT":
        return <FileText size={16} color="var(--info)" />;
      default:
        return <BookOpen size={16} color="var(--primary)" />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Link to="/courses" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <ArrowLeft size={16} /> Back to Course Catalog
      </Link>

      {notification && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Course Header */}
      <div
        className="card"
        style={{
          background: "linear-gradient(180deg, var(--bg-card) 0%, #101625 100%)",
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
              {course.category_name}
            </span>
            <Badge variant={course.level}>{course.level}</Badge>
            <Badge variant={course.status}>{course.status}</Badge>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: "0.75rem" }}>
            {course.title}
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, maxWidth: "760px", marginBottom: "1.5rem" }}>
            {course.description}
          </p>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.875rem", color: "var(--text-dim)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <User size={16} color="var(--primary)" />
              <span>Instructor: <strong style={{ color: "#fff" }}>{course.teacher_name}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Clock size={16} color="var(--warning)" />
              <span>Duration: <strong style={{ color: "#fff" }}>{course.duration_hours || 40} Hours</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Users size={16} color="var(--secondary)" />
              <span>Enrolled: <strong style={{ color: "#fff" }}>{course.total_enrolled || 0} Students</strong></span>
            </div>
          </div>
        </div>

        {/* Enrollment Action Box */}
        <div
          style={{
            background: "rgba(10, 14, 23, 0.6)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
            minWidth: "260px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            Free Enrollment
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            Full access to lectures, articles, and evaluated coursework
          </p>

          {isEnrolled ? (
            <Link to="/student/courses" className="btn btn-primary" style={{ width: "100%" }}>
              Access My Enrolled Course
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {enrolling ? "Enrolling..." : "Enroll in Course"}
            </button>
          )}
        </div>
      </div>

      {/* Syllabus Modules & Coursework Split View */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.75rem" }}>
        {/* Syllabus Modules */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={18} color="var(--primary)" /> Course Syllabus ({modules.length} Modules)
            </h2>
          </div>

          {modules.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No syllabus modules published yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {modules.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.9rem 1.1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ marginTop: "3px" }}>{getContentIcon(m.content_type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}>
                        {idx + 1}. {m.title}
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                        {m.content_type}
                      </span>
                    </div>
                    {m.description && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                        {m.description}
                      </p>
                    )}
                    {m.content_url && isEnrolled && (
                      <a
                        href={m.content_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.8rem",
                          color: "var(--primary)",
                          marginTop: "0.5rem",
                        }}
                      >
                        Launch Learning Resource <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Assignments */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileCheck2 size={18} color="var(--warning)" /> Coursework ({assignments.length})
            </h2>
          </div>

          {assignments.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No coursework assignments posted yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {assignments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.9rem 1.1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                    <h4 style={{ fontSize: "0.925rem", fontWeight: 600, color: "#fff" }}>{a.title}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--warning)", fontWeight: 600 }}>
                      {a.max_marks} pts
                    </span>
                  </div>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.6rem", lineHeight: 1.4 }}>
                    {a.description}
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    Due: {new Date(a.due_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
