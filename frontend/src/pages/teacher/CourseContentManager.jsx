import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  PlusCircle,
  Edit2,
  Trash2,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  Save,
  AlertCircle,
} from "lucide-react";
import { courseService, contentService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";

export const CourseContentManager = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "ARTICLE",
    content_url: "",
    order_index: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, mRes] = await Promise.all([
        courseService.getById(id),
        contentService.listByCourse(id),
      ]);
      if (cRes.success) setCourse(cRes.data);
      if (mRes.success) setModules(mRes.data || []);
    } catch (err) {
      console.error("Failed to load content manager data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenAdd = () => {
    setEditingModule(null);
    setFormData({
      title: "",
      description: "",
      content_type: "ARTICLE",
      content_url: "",
      order_index: modules.length + 1,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mod) => {
    setEditingModule(mod);
    setFormData({
      title: mod.title,
      description: mod.description || "",
      content_type: mod.content_type,
      content_url: mod.content_url || "",
      order_index: mod.order_index,
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
        order_index: Number(formData.order_index),
      };
      if (editingModule) {
        await contentService.update(editingModule.id, payload);
      } else {
        await contentService.create(id, payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save syllabus module.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (moduleId, title) => {
    if (!window.confirm(`Delete module "${title}"?`)) return;
    try {
      await contentService.delete(moduleId);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete module.");
    }
  };

  if (loading) return <LoadingSpinner message="Loading syllabus curriculum manager..." />;

  const getModuleIcon = (type) => {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <Link to="/teacher/courses" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        <ArrowLeft size={16} /> Back to My Courses
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Syllabus Curriculum: {course?.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Add lecture notes, video recordings, technical documentation, and learning resources
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
          <PlusCircle size={16} /> Add Module
        </button>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No syllabus modules yet"
          description="Build your course step-by-step by adding syllabus modules, video lectures, and documentation."
          action={
            <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
              Add First Module
            </button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {modules.map((m, idx) => (
            <div
              key={m.id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", flex: 1 }}>
                <div style={{ marginTop: "3px" }}>{getModuleIcon(m.content_type)}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 700 }}>
                      #{m.order_index}
                    </span>
                    <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>
                      {m.title}
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                      {m.content_type}
                    </span>
                  </div>
                  {m.description && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {m.description}
                    </p>
                  )}
                  {m.content_url && (
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
                        marginTop: "0.35rem",
                      }}
                    >
                      {m.content_url} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="btn btn-secondary btn-sm"
                  title="Edit Module"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.title)}
                  className="btn btn-danger btn-sm"
                  title="Delete Module"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? `Edit Module: ${editingModule.title}` : "Add Syllabus Module"}
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
              Module Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Relational Normalization & Functional Dependencies"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              Module Description / Overview
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of lecture concepts, required reading..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Content Medium
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              >
                <option value="ARTICLE">Article / Notes</option>
                <option value="VIDEO">Video Lecture</option>
                <option value="DOCUMENT">Document / PDF</option>
                <option value="LINK">External Link</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Syllabus Order Index
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              Resource URL (YouTube, PDF link, or Github repo)
            </label>
            <input
              type="url"
              value={formData.content_url}
              onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
              placeholder="https://..."
            />
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
              <Save size={16} /> {saving ? "Saving..." : "Save Module"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseContentManager;
