import React, { useEffect, useState } from "react";
import { UserCheck, UserPlus, Trash2, BookOpen, AlertCircle, Save } from "lucide-react";
import { courseService, userService, enrollmentService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

export const EnrollmentManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [roster, setRoster] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [cRes, uRes] = await Promise.all([
          courseService.list({ page_size: 100 }),
          userService.list({ role: "STUDENT", page_size: 100 }),
        ]);

        if (cRes.success && cRes.data) {
          const items = cRes.data.items || [];
          setCourses(items);
          if (items.length > 0) setSelectedCourseId(String(items[0].id));
        }

        if (uRes.success && uRes.data) {
          const studs = uRes.data.items || [];
          setStudents(studs);
          if (studs.length > 0) setEnrollStudentId(String(studs[0].id));
        }
      } catch (err) {
        console.error("Failed to load enrollment context:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const loadRoster = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await enrollmentService.getCourseRoster(courseId);
      if (res.success) {
        setRoster(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load course roster:", err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadRoster(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    setError("");
    try {
      await enrollmentService.enroll(Number(selectedCourseId), Number(enrollStudentId));
      setIsModalOpen(false);
      loadRoster(selectedCourseId);
    } catch (err) {
      setError(err.message || "Failed to enroll student.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleDrop = async (enrollmentId, studentName) => {
    if (!window.confirm(`Drop student "${studentName}" from this course?`)) return;
    try {
      await enrollmentService.drop(enrollmentId);
      loadRoster(selectedCourseId);
    } catch (err) {
      alert(err.message || "Failed to drop enrollment.");
    }
  };

  if (loading) return <LoadingSpinner message="Querying enrollment rosters..." />;

  const currentCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Institutional Enrollment Roster
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Supervise course rosters, register students, and monitor syllabus completion
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ width: "auto", minWidth: "240px" }}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <button onClick={() => setIsModalOpen(true)} disabled={!selectedCourseId} className="btn btn-primary btn-sm">
            <UserPlus size={16} /> Enroll Student
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses created"
          description="Create courses first before managing enrollments."
        />
      ) : roster.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Students Enrolled"
          description={`There are no students currently enrolled in "${currentCourse?.title}".`}
          action={
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
              Enroll First Student
            </button>
          }
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Enrolled Student</th>
                <th>Contact</th>
                <th>Enrollment Date</th>
                <th>Status</th>
                <th>Syllabus Progress</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const progress = parseFloat(r.progress || 0);
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{r.student_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{r.student_email}</div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {r.student_phone || "—"}
                    </td>
                    <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                      {new Date(r.enrollment_date).toLocaleDateString()}
                    </td>
                    <td>
                      <Badge variant={r.status}>{r.status}</Badge>
                    </td>
                    <td style={{ minWidth: "160px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "3px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Progress</span>
                        <strong style={{ color: "var(--primary)" }}>{progress.toFixed(1)}%</strong>
                      </div>
                      <div className="progress-bar-bg" style={{ height: "6px" }}>
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDrop(r.id, r.student_name)}
                        className="btn btn-danger btn-sm"
                        title="Cancel Enrollment"
                      >
                        <Trash2 size={14} /> Drop
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Enroll Student in ${currentCourse?.title}`}
      >
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEnrollStudent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              Select Student Account
            </label>
            <select
              value={enrollStudentId}
              onChange={(e) => setEnrollStudentId(e.target.value)}
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={enrolling}>
              <Save size={16} /> {enrolling ? "Enrolling..." : "Confirm Enrollment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnrollmentManagement;
