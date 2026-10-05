import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 0",
        marginTop: "1rem",
        borderTop: "1px solid var(--border-color)",
        fontSize: "0.85rem",
        color: "var(--text-muted)",
      }}
    >
      <div>
        Showing page <strong style={{ color: "#fff" }}>{currentPage}</strong> of{" "}
        <strong style={{ color: "#fff" }}>{totalPages}</strong> ({totalRecords}{" "}
        total records)
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{ opacity: currentPage <= 1 ? 0.5 : 1 }}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{ opacity: currentPage >= totalPages ? 0.5 : 1 }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
