import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, CheckCircle2, AlertCircle, ExternalLink, Save, Filter, Clock } from "lucide-react";
import { courseService, assignmentService, submissionService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

export const TeacherSubmissions = () => {
  const [searchParams] = useSearchParams();
  const preselectedAssignmentId = searchParams.get("assignment_id");

  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(preselectedAssignmentId || "");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading Modal
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacherContext = async () => {
      setLoading(true);
      try {
        const cRes = await courseService.list({ teacher_id: user.id, page_size: 50 });
        if (cRes.success && cRes.data) {
          const teacherCourses = cRes.data.items || [];
          setCourses(teacherCourses);

          // Collect assignments across teacher's courses
          const assignPromises = teacherCourses.map((c) =>
            assignmentService.listByCourse(c.id).catch(() => ({ data: [] }))
          );
          const assignResults = await Promise.all(assignPromises);
          const allAssignments = assignResults.flatMap((r) => r.data || []);
          setAssignments(allAssignments);

          if (!selectedAssignmentId && allAssignments.length > 0) {
            setSelectedAssignmentId(String(allAssignments[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to load teacher context:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherContext();
  }, [user.id]);

  const loadSubmissions = async (aId) => {
    if (!aId) return;
    try {
      const res = await submissionService.listByAssignment(aId);
      if (res.success) {
        setSubmissions(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  const handleOpenGradeModal = (sub) => {
    setActiveSubmission(sub);
    setMarks(sub.marks !== null ? String(sub.marks) : "");
    setFeedback(sub.feedback || "");
    setError("");
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    const numMarks = parseFloat(marks);
    const maxMarks = parseFloat(activeSubmission.max_marks);

    if (isNaN(numMarks) || numMarks < 0) {
      setError("Please enter a valid positive score.");
      return;
    }

    if (numMarks > maxMarks) {
      setError(`Awarded marks (${numMarks}) cannot exceed maximum allowed marks (${maxMarks}).`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await submissionService.grade(activeSubmission.id, {
        marks: numMarks,
        feedback: feedback.trim(),
      });
      setActiveSubmission(null);
      loadSubmissions(selectedAssignmentId);
    } catch (err) {
      setError(err.message || "Failed to grade submission.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading coursework submissions and evaluation queue..." />;

  const currentAssignment = assignments.find((a) => String(a.id) === String(selectedAssignmentId));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Grade Submissions & Review
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Inspect student solutions, award marks, and provide constructive feedback
          </p>
        </div>

        {assignments.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Assignment:</span>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              style={{ width: "auto", minWidth: "260px" }}
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.max_marks} pts)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No assignments created"
          description="Create assignments in your courses to collect student submissions."
        />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No submissions received"
          description={`No students have submitted work for "${currentAssignment?.title}" yet.`}
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Submission Time</th>
                <th>Status</th>
                <th>Work Details</th>
                <th>Marks</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const isGraded = sub.status === "GRADED";
                return (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{sub.student_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{sub.student_email}</div>
                    </td>
                    <td style={{ color: "var(--text-dim)" }}>
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td>
                      <Badge variant={sub.status}>{sub.status}</Badge>
                    </td>
                    <td style={{ maxWidth: "280px" }}>
                      {sub.submission_text && (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.submission_text}
                        </div>
                      )}
                      {sub.submission_url && (
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--primary)" }}
                        >
                          Repo Link <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: isGraded ? "var(--success)" : "var(--text-dim)" }}>
                      {isGraded ? `${sub.marks} / ${sub.max_marks}` : "Ungraded"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenGradeModal(sub)}
                        className={`btn ${isGraded ? "btn-secondary" : "btn-primary"} btn-sm`}
                      >
                        <Award size={14} /> {isGraded ? "Edit Grade" : "Grade Work"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Modal */}
      {activeSubmission && (
        <Modal
          isOpen={!!activeSubmission}
          onClose={() => setActiveSubmission(null)}
          title={`Evaluate: ${activeSubmission.student_name}`}
        >
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              marginBottom: "1.25rem",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ marginBottom: "0.4rem" }}>
              <strong style={{ color: "#fff" }}>Assignment:</strong> {activeSubmission.assignment_title} (Max: {activeSubmission.max_marks} pts)
            </div>
            {activeSubmission.submission_text && (
              <div style={{ marginTop: "0.5rem" }}>
                <strong style={{ color: "var(--text-muted)" }}>Submitted Solution Notes:</strong>
                <p style={{ color: "#e2e8f0", marginTop: "3px", whiteSpace: "pre-wrap" }}>
                  {activeSubmission.submission_text}
                </p>
              </div>
            )}
            {activeSubmission.submission_url && (
              <div style={{ marginTop: "0.5rem" }}>
                <a
                  href={activeSubmission.submission_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--primary)" }}
                >
                  Open Submitted Project URL <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveGrade} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Awarded Marks (Out of {activeSubmission.max_marks})
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={Number(activeSubmission.max_marks)}
                required
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g. 95.0"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Instructor Feedback & Comments
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Praise strengths, explain point deductions, suggest optimizations..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveSubmission(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? "Saving Grade..." : "Submit Official Grade"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TeacherSubmissions;
