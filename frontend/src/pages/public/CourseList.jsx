import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  User,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { courseService, categoryService, enrollmentService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";

export const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollMsg, setEnrollMsg] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const { isAuthenticated, isStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.list();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 6,
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryId) params.category_id = categoryId;
      if (level) params.level = level;

      const res = await courseService.list(params);
      if (res.success && res.data) {
        setCourses(res.data.items || []);
        setTotalPages(res.data.total_pages || 1);
        setTotalRecords(res.data.total_records || 0);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, categoryId, level, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleEnroll = async (courseId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setEnrollingId(courseId);
    setEnrollMsg("");
    try {
      const res = await enrollmentService.enroll(courseId);
      if (res.success) {
        setEnrollMsg(`Successfully enrolled in course!`);
        setTimeout(() => navigate("/student/courses"), 1200);
      }
    } catch (err) {
      alert(err.message || "Failed to enroll");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", marginBottom: "0.4rem" }}>
          Course Catalog
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Explore interactive curriculum powered by raw MySQL database queries
        </p>
      </div>

      {enrollMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{enrollMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 280px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={17}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}
            />
            <input
              type="text"
              placeholder="Search title, keywords, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "160px" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.total_courses})
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "140px" }}
          >
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: "auto", minWidth: "130px" }}
          >
            <option value="newest">Newest First</option>
            <option value="title">Course Title</option>
            <option value="duration">Duration (High-Low)</option>
          </select>
        </div>
      </div>

      {/* Course List Grid */}
      {loading ? (
        <LoadingSpinner message="Querying MySQL course records..." />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try broadening your search term or selecting a different category filter."
          action={
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch("");
                setCategoryId("");
                setLevel("");
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="card"
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)", textTransform: "uppercase" }}>
                    {course.category_name}
                  </span>
                  <Badge variant={course.level}>{course.level}</Badge>
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem", lineHeight: 1.35 }}>
                  {course.title}
                </h3>

                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                  {course.description.length > 130
                    ? `${course.description.substring(0, 130)}...`
                    : course.description}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    padding: "0.75rem 0",
                    borderTop: "1px solid var(--border-color)",
                    fontSize: "0.8rem",
                    color: "var(--text-dim)",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <User size={14} color="var(--primary)" />
                    <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {course.teacher_name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Clock size={14} color="var(--warning)" />
                    <span>{course.duration_hours || 40} Hours</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Users size={14} color="var(--secondary)" />
                    <span>{course.total_enrolled || 0} Students</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <BookOpen size={14} color="var(--success)" />
                    <span>{course.total_modules || 0} Modules</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link
                    to={`/courses/${course.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Details <ArrowRight size={14} />
                  </Link>

                  {(!isAuthenticated || isStudent) && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                    >
                      {enrollingId === course.id ? "Enrolling..." : "Enroll Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SQL Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default CourseList;
