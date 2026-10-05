import React, { useEffect, useState } from "react";
import { Award, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { submissionService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";

export const Grades = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const res = await submissionService.getMySubmissions();
        if (res.success && res.data) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch student grades:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating academic grade history..." />;

  const gradedItems = submissions.filter((s) => s.status === "GRADED");
  const totalAwarded = gradedItems.reduce((acc, curr) => acc + parseFloat(curr.marks || 0), 0);
  const totalMax = gradedItems.reduce((acc, curr) => acc + parseFloat(curr.max_marks || 0), 0);
  const cumulativePct = totalMax > 0 ? (totalAwarded / totalMax) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
          Academic Gradebook & Evaluation
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Official marks transcript and detailed instructor reviews
        </p>
      </div>

      {/* Grade Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{cumulativePct.toFixed(1)}%</div>
            <div className="stat-label">Cumulative Average</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{gradedItems.length}</div>
            <div className="stat-label">Evaluated Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{submissions.length}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      {submissions.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Grades Available"
          description="You haven't submitted any coursework assignments yet."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Assignment</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Instructor Feedback</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const max = parseFloat(sub.max_marks || 100);
                const marks = sub.marks !== null ? parseFloat(sub.marks) : null;
                const pct = marks !== null ? ((marks / max) * 100).toFixed(1) : "-";

                return (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600, color: "#fff" }}>{sub.course_title}</td>
                    <td>{sub.assignment_title}</td>
                    <td style={{ color: "var(--text-dim)" }}>
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Badge variant={sub.status}>{sub.status}</Badge>
                    </td>
                    <td style={{ fontWeight: 700, color: marks !== null ? "var(--success)" : "var(--text-dim)" }}>
                      {marks !== null ? `${marks} / ${max}` : "Pending"}
                    </td>
                    <td style={{ fontWeight: 600, color: "#fff" }}>
                      {pct !== "-" ? `${pct}%` : "-"}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "260px" }}>
                      {sub.feedback ? (
                        <span style={{ fontStyle: "italic", color: "#cbd5e1" }}>"{sub.feedback}"</span>
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>Awaiting grading</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Grades;
