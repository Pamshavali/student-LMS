import React from "react";

export const Badge = ({ children, variant = "default" }) => {
  const getVariantClass = () => {
    switch (variant.toLowerCase()) {
      case "published":
      case "active":
      case "completed":
      case "graded":
        return "badge-published";
      case "draft":
      case "submitted":
        return "badge-draft";
      case "archived":
      case "dropped":
      case "late":
        return "badge-archived";
      case "admin":
        return "badge-role-admin";
      case "teacher":
        return "badge-role-teacher";
      case "student":
        return "badge-role-student";
      default:
        return "badge-draft";
    }
  };

  return <span className={`badge ${getVariantClass()}`}>{children}</span>;
};

export default Badge;
