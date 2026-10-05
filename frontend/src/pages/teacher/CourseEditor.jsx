import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { courseService, categoryService, userService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

export const CourseEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    teacher_id: user?.id || "",
    duration_hours: 40,
    level: "BEGINNER",
    status: "DRAFT",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const catRes = await categoryService.list();
        if (catRes.success) setCategories(catRes.data);

        if (isAdmin) {
          const userRes = await userService.list({ role: "TEACHER", page_size: 100 });
          if (userRes.success) setTeachers(userRes.data.items || []);
        }

        if (isEditing) {
          const courseRes = await courseService.getById(id);
          if (courseRes.success && courseRes.data) {
            const c = courseRes.data;
            setFormData({
              title: c.title,
              description: c.description,
              category_id: c.category_id,
              teacher_id: c.teacher_id,
              duration_hours: c.duration_hours || 40,
              level: c.level,
              status: c.status,
            });
          }
        } else if (catRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: catRes.data[0].id }));
        }
      } catch (err) {
        setError("Failed to initialize course form data.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isEditing, isAdmin, user?.id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        duration_hours: Number(formData.duration_hours),
      };
      if (isAdmin && formData.teacher_id) {
        payload.teacher_id = Number(formData.teacher_id);
      }

      if (isEditing) {
        await courseService.update(id, payload);
        setSuccess("Course updated successfully!");
      } else {
        const res = await courseService.create(payload);
        setSuccess("Course created successfully!");
        setTimeout(() => {
          navigate(isAdmin ? "/admin/courses" : "/teacher/courses");
        }, 1200);
      }
    } catch (err) {
      setError(err.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading course editor..." />;

  const backLink = isAdmin ? "/admin/courses" : "/teacher/courses";

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Link to={backLink} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <ArrowLeft size={16} /> Back to Course Roster
      </Link>

      <div className="card" style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
          {isEditing ? "Edit Course Information" : "Create New Course"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Define title, academic categorization, difficulty tier, and publish state
        </p>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Course Title
            </label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Relational Database Engineering & RAW SQL Mastery"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Course Description
            </label>
            <textarea
              name="description"
              required
              rows={4}
              minLength={10}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed syllabus description, course objectives, and target audience..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Academic Category
              </label>
              <select name="category_id" required value={formData.category_id} onChange={handleChange}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Difficulty Level
              </label>
              <select name="level" value={formData.level} onChange={handleChange}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Estimated Duration (Hours)
              </label>
              <input
                type="number"
                name="duration_hours"
                min={1}
                max={1000}
                value={formData.duration_hours}
                onChange={handleChange}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Publish Status
              </label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="DRAFT">DRAFT (Hidden from catalog)</option>
                <option value="PUBLISHED">PUBLISHED (Available for enrollment)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Assigned Faculty Instructor
              </label>
              <select name="teacher_id" value={formData.teacher_id} onChange={handleChange}>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <Link to={backLink} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditor;
