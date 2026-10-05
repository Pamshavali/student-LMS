import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, User, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Badge from "./Badge";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 8px var(--primary-glow)",
            }}
          >
            <GraduationCap size={22} />
          </div>
          <span style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>
            Student<span style={{ color: "var(--primary)" }}>LMS</span>
          </span>
        </Link>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <Link
          to="/courses"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <BookOpen size={16} /> Course Catalog
        </Link>

        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Badge variant={user?.role}>{user?.role}</Badge>

            <Link
              to="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                color: "#fff",
              }}
            >
              <User size={15} color="var(--primary)" />
              <span>{user?.first_name} {user?.last_name}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{ padding: "0.4rem 0.6rem" }}
            >
              <LogOut size={16} />
              <span style={{ display: "none" }}>Sign Out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
