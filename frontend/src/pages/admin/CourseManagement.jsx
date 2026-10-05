import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, PlusCircle, Edit3, Trash2, Search, Globe, EyeOff, Layers } from "lucide-react";
import { courseService, categoryService } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import Badge from "../../components/Badge";

export const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    categoryService.list().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10 };
      if (search.trim()) params.search = search.trim();
      if (categoryId) params.category_id = categoryId;
      if (status) params.status = status;

      const res = await courseService.list(params);
      if (res.success && res.data) {
        setCourses(res.data.items || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalRecords(res.data.total_records || 0);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, categoryId, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await courseService.publish(courseId, nextStatus);
      fetchCourses();
    } catch (err) {
      alert(err.message || "Failed to update course status.");
    }
  };

  const handleDelete = async (courseId, title) => {
    if (!window.confirm(`Delete course "${title}"? This permanently drops all enrolled students and coursework.`)) return;
    try {
      await courseService.delete(courseId);
      fetchCourses();
    } catch (err) {
      alert(err.message || "Failed to delete course.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
            Course Catalog Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Supervise all academic offerings, reassign faculty instructors, and manage publish states
          </p>
        </div>

        <Link to="/teacher/courses/new" className="btn btn-primary btn-sm">
          <PlusCircle size={16} /> Create Course
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1rem 1.25rem",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
            />
            <input
              type="text"
              placeholder="Search course title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "150px" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "140px" }}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Course Table */}
      {loading ? (
        <LoadingSpinner message="Querying course records from MySQL..." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Category</th>
                <th>Assigned Teacher</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Modules</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{c.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Level: {c.level}</div>
                  </td>
                  <td>{c.category_name}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: "#fff" }}>{c.teacher_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{c.teacher_email}</div>
                  </td>
                  <td>
                    <Badge variant={c.status}>{c.status}</Badge>
                  </td>
                  <td style={{ fontWeight: 600, color: "#fff" }}>{c.total_enrolled || 0}</td>
                  <td style={{ color: "var(--text-muted)" }}>{c.total_modules || 0}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                      <Link
                        to={`/teacher/courses/${c.id}/content`}
                        className="btn btn-secondary btn-sm"
                        title="Manage Modules"
                      >
                        <Layers size={14} />
                      </Link>

                      <Link
                        to={`/teacher/courses/${c.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        title="Edit Course / Reassign Teacher"
                      >
                        <Edit3 size={14} />
                      </Link>

                      <button
                        onClick={() => handleTogglePublish(c.id, c.status)}
                        className="btn btn-secondary btn-sm"
                        title={c.status === "PUBLISHED" ? "Unpublish" : "Publish"}
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

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default CourseManagement;
