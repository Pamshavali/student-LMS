import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  PlusCircle,
  Edit2,
  Trash2,
  Clock,
  Award,
  Calendar,
  Save,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { courseService, assignmentService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";

export const TeacherAssignments = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    max_marks: 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await courseService.list({ teacher_id: user.id, page_size: 50 });
      if (res.success && res.data) {
        setCourses(res.data.items || []);
        if (res.data.items?.length > 0 && !selectedCourseId) {
          setSelectedCourseId(res.data.items[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user.id]);

  const loadAssignments = async (cId) => {
    if (!cId) return;
    try {
      const res = await assignmentService.listByCourse(cId);
      if (res.success) {
        setAssignments(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load course assignments:", err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadAssignments(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const dateStr = inSevenDays.toISOString().slice(0, 16);

    setFormData({
      title: "",
      description: "",
      due_date: dateStr,
      max_marks: 100,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAssignment(a);
    const dateStr = new Date(a.due_date).toISOString().slice(0, 16);
    setFormData({
      title: a.title,
      description: a.description,
      due_date: dateStr,
      max_marks: a.max_marks,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...formData,
        max_marks: Number(formData.max_marks),
        due_date: new Date(formData.due_date).toISOString(),
      };

      if (editingAssignment) {
        await assignmentService.update(editingAssignment.id, payload);
      } else {
        await assignmentService.create(selectedCourseId, payload);
      }
      setIsModalOpen(false);
      loadAssignments(selectedCourseId);
    } catch (err) {
      setError(err.message || "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aId, title) => {
    if (!window.confirm(`Delete assignment "${title}"?`)) return;
    try {
      await assignmentService.delete(aId);
      loadAssignments(selectedCourseId);
    } catch (err) {
      alert(err.message || "Failed to delete assignment.");
    }
  };

  if (loading) return <LoadingSpinner message="Loading coursework manager..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Coursework & Assignment Manager
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Publish homework tasks, set deadlines, and configure grading criteria
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ width: "auto", minWidth: "220px" }}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <button onClick={handleOpenAdd} disabled={!selectedCourseId} className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> New Assignment
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No Teaching Courses"
          description="You need to create a course before you can publish assignments."
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No assignments posted yet"
          description="Add coursework for students enrolled in this course."
          action={
            <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
              Create First Assignment
            </button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {assignments.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{a.title}</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--warning)", fontWeight: 700 }}>
                    Max: {a.max_marks} pts
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "680px", marginBottom: "0.5rem" }}>
                  {a.description}
                </p>
                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  <span>Due: <strong style={{ color: "#fff" }}>{new Date(a.due_date).toLocaleString()}</strong></span>
                  <span>Submissions: <strong style={{ color: "var(--primary)" }}>{a.total_submissions || 0}</strong></span>
                  <span>Graded: <strong style={{ color: "var(--success)" }}>{a.graded_submissions || 0}</strong></span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Link
                  to={`/teacher/submissions?assignment_id=${a.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                >
                  <Award size={14} /> Review ({a.total_submissions || 0})
                </Link>

                <button
                  onClick={() => handleOpenEdit(a)}
                  className="btn btn-secondary btn-sm"
                  title="Edit Assignment"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  onClick={() => handleDelete(a.id, a.title)}
                  className="btn btn-danger btn-sm"
                  title="Delete Assignment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? `Edit Assignment: ${editingAssignment.title}` : "Create Assignment"}
      >
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Query Plan Optimization & B-Tree Indexing"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              Task Instructions & Rubric
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed guidelines, submission criteria, repository expectations..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Maximum Marks
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherAssignments;
