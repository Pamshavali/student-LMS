import React from "react";
import { Inbox } from "lucide-react";

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There are no records matching your criteria.",
  action = null,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem 1.5rem",
        textAlign: "center",
        background: "rgba(21, 29, 48, 0.5)",
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--border-color)",
        margin: "1rem 0",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          marginBottom: "1rem",
        }}
      >
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.4rem" }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "420px", marginBottom: action ? "1.25rem" : 0 }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
