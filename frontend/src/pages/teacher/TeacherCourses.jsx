import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, PlusCircle, Edit3, Trash2, Globe, EyeOff, Layers, FileCheck2 } from "lucide-react";
import { courseService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";

export const TeacherCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await courseService.list({ teacher_id: user.id, page_size: 50 });
      if (res.success && res.data) {
        setCourses(res.data.items || []);
      }
    } catch (err) {
      console.error("Failed to load teacher courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user.id]);

  const togglePublish = async (courseId, currentStatus) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await courseService.publish(courseId, nextStatus);
      fetchCourses();
    } catch (err) {
      alert(err.message || "Failed to update publish status.");
    }
  };

  const handleDelete = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"? This will cascade delete associated modules and assignments.`)) return;
    try {
      await courseService.delete(courseId);
      fetchCourses();
    } catch (err) {
      alert(err.message || "Failed to delete course.");
    }
  };

  if (loading) return <LoadingSpinner message="Fetching your teaching curriculum..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            My Teaching Courses
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Create course syllabi, publish lectures, and supervise enrolled students
          </p>
        </div>

        <Link to="/teacher/courses/new" className="btn btn-primary btn-sm">
          <PlusCircle size={16} /> Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses created yet"
          description="Create your first course to begin authoring curriculum modules and publishing assignments."
          action={
            <Link to="/teacher/courses/new" className="btn btn-primary btn-sm">
              Create Course Now
            </Link>
          }
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title & Category</th>
                <th>Status</th>
                <th>Level</th>
                <th>Enrolled</th>
                <th>Modules</th>
                <th>Assignments</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{c.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{c.category_name}</div>
                  </td>
                  <td>
                    <Badge variant={c.status}>{c.status}</Badge>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.level}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#fff" }}>{c.total_enrolled || 0}</td>
                  <td style={{ color: "var(--text-muted)" }}>{c.total_modules || 0}</td>
                  <td style={{ color: "var(--text-muted)" }}>{c.total_assignments || 0}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                      <Link
                        to={`/teacher/courses/${c.id}/content`}
                        className="btn btn-secondary btn-sm"
                        title="Manage Syllabus Modules"
                      >
                        <Layers size={14} /> Modules
                      </Link>

                      <Link
                        to={`/teacher/courses/${c.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        title="Edit Details"
                      >
                        <Edit3 size={14} />
                      </Link>

                      <button
                        onClick={() => togglePublish(c.id, c.status)}
                        className="btn btn-secondary btn-sm"
                        title={c.status === "PUBLISHED" ? "Unpublish (Make Draft)" : "Publish to Catalog"}
                      >
                        {c.status === "PUBLISHED" ? <EyeOff size={14} color="var(--warning)" /> : <Globe size={14} color="var(--success)" />}
                      </button>

                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="btn btn-danger btn-sm"
                        title="Delete Course"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
