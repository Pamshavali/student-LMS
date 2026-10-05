import React, { useEffect, useState } from "react";
import { FileCheck2, Clock, CheckCircle2, AlertCircle, Send, Award, ExternalLink } from "lucide-react";
import { enrollmentService, assignmentService, submissionService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";

export const StudentAssignments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const enrollRes = await enrollmentService.getMyCourses();
      if (enrollRes.success && enrollRes.data) {
        setCourses(enrollRes.data);
        if (enrollRes.data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(enrollRes.data[0].course_id);
        }
      }
    } catch (err) {
      console.error("Failed to load enrolled courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const fetchCourseAssignments = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await assignmentService.listByCourse(courseId);
      if (res.success && res.data) {
        setAssignments(res.data);
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseAssignments(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleOpenSubmitModal = (assignment) => {
    setActiveAssignment(assignment);
    const existing = assignment.student_submission;
    setSubmissionText(existing?.submission_text || "");
    setSubmissionUrl(existing?.submission_url || "");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !submissionUrl.trim()) {
      setErrorMsg("Please provide written work or a project repository URL.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await submissionService.submit(activeAssignment.id, {
        submission_text: submissionText.trim(),
        submission_url: submissionUrl.trim(),
      });
      if (res.success) {
        setSuccessMsg("Assignment submitted successfully!");
        fetchCourseAssignments(selectedCourseId);
        setTimeout(() => setActiveAssignment(null), 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading academic coursework..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Coursework & Assignments
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Submit assignments before deadlines and review graded feedback
          </p>
        </div>

        {/* Course Selector */}
        {courses.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ width: "auto", minWidth: "200px" }}
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No Course Enrollments"
          description="You must be enrolled in at least one course to view coursework assignments."
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No Assignments Posted"
          description="Your instructor has not posted any coursework assignments for this course yet."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {assignments.map((a) => {
            const sub = a.student_submission;
            const isDuePassed = new Date() > new Date(a.due_date);
            const isGraded = sub?.status === "GRADED";

            return (
              <div
                key={a.id}
                className="card"
                style={{
                  borderLeft: isGraded
                    ? "4px solid var(--success)"
                    : sub
                    ? "4px solid var(--primary)"
                    : isDuePassed
                    ? "4px solid var(--danger)"
                    : "4px solid var(--warning)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff" }}>{a.title}</h3>
                      {sub ? (
                        <Badge variant={sub.status}>{sub.status}</Badge>
                      ) : (
                        <span className="badge badge-draft">Pending Submission</span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: "700px", marginBottom: "0.75rem" }}>
                      {a.description}
                    </p>
                    <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      <span>Due: <strong style={{ color: "#fff" }}>{new Date(a.due_date).toLocaleString()}</strong></span>
                      <span>Maximum Marks: <strong style={{ color: "var(--warning)" }}>{a.max_marks} pts</strong></span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", minWidth: "160px" }}>
                    {isGraded ? (
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Graded Score</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>
                          {sub.marks} / {a.max_marks}
                        </div>
                      </div>
                    ) : sub ? (
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Submitted</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => handleOpenSubmitModal(a)}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: "0.5rem" }}
                        >
                          Update Submission
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenSubmitModal(a)}
                        className="btn btn-primary btn-sm"
                      >
                        Submit Solution <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submissions & Feedback Banner */}
                {sub && (
                  <div
                    style={{
                      marginTop: "1.25rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    {sub.submission_text && (
                      <div>
                        <strong style={{ color: "var(--text-muted)" }}>My Submission Notes:</strong>
                        <p style={{ color: "#fff", marginTop: "2px" }}>{sub.submission_text}</p>
                      </div>
                    )}
                    {sub.submission_url && (
                      <div>
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--primary)" }}
                        >
                          View Repository / Project Link <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                    {sub.feedback && (
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.08)",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.6rem 0.9rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        <strong style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Award size={15} /> Teacher Feedback:
                        </strong>
                        <p style={{ color: "#e2e8f0", marginTop: "3px" }}>{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {activeAssignment && (
        <Modal
          isOpen={!!activeAssignment}
          onClose={() => setActiveAssignment(null)}
          title={`Submit Work: ${activeAssignment.title}`}
        >
          {errorMsg && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitWork} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Solution Writeup / Technical Notes
              </label>
              <textarea
                rows={4}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Explain your approach, database indexes used, algorithm complexity..."
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Project / Repository URL (Optional)
              </label>
              <input
                type="url"
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                placeholder="https://github.com/my-username/assignment-repo"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveAssignment(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Confirm & Submit"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentAssignments;
