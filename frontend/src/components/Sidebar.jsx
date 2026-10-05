import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileCheck2,
  Award,
  Users,
  FolderTree,
  UserCheck,
  PlusCircle,
  BarChart3,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const studentLinks = [
    { to: "/dashboard/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/courses", label: "My Enrolled Courses", icon: GraduationCap },
    { to: "/courses", label: "Browse Catalog", icon: BookOpen },
    { to: "/student/assignments", label: "Coursework & Tasks", icon: FileCheck2 },
    { to: "/student/grades", label: "Grades & Progress", icon: Award },
    { to: "/profile", label: "My Profile", icon: User },
  ];

  const teacherLinks = [
    { to: "/dashboard/teacher", label: "Dashboard", icon: LayoutDashboard },
    { to: "/teacher/courses", label: "My Teaching Courses", icon: BookOpen },
    { to: "/teacher/courses/new", label: "Create Course", icon: PlusCircle },
    { to: "/teacher/assignments", label: "Assignments", icon: FileCheck2 },
    { to: "/teacher/submissions", label: "Grade Submissions", icon: Award },
    { to: "/courses", label: "All Published Courses", icon: GraduationCap },
    { to: "/profile", label: "My Profile", icon: User },
  ];

  const adminLinks = [
    { to: "/dashboard/admin", label: "Overview & Analytics", icon: LayoutDashboard },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/courses", label: "Course Management", icon: BookOpen },
    { to: "/admin/categories", label: "Category Taxonomy", icon: FolderTree },
    { to: "/admin/enrollments", label: "Enrollment Roster", icon: UserCheck },
    { to: "/admin/statistics", label: "System Telemetry", icon: BarChart3 },
    { to: "/profile", label: "My Profile", icon: User },
  ];

  let links = studentLinks;
  if (role === "ADMIN") links = adminLinks;
  else if (role === "TEACHER") links = teacherLinks;

  return (
    <aside className="sidebar">
      <div style={{ padding: "1.25rem 1.25rem 0.5rem 1.25rem" }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-dim)",
          }}
        >
          {role} Workspace
        </p>
      </div>

      <nav style={{ padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.includes("dashboard") || link.to === "/teacher/courses/new"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.88rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "var(--text-muted)",
                backgroundColor: isActive ? "var(--bg-card)" : "transparent",
                border: isActive ? "1px solid var(--border-color)" : "1px solid transparent",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                transition: "var(--transition)",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} color={isActive ? "var(--primary)" : "var(--text-dim)"} />
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
