import React from "react";

export default function NewspaperMasthead() {
  return (
    <div 
      style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 1000,
        background: "rgba(7, 20, 38, 0.95)", 
        backdropFilter: "blur(8px)",
        borderBottom: "4px double rgba(77, 163, 255, 0.4)", 
      }}
    >
      <div className="container py-3 text-center">
        <h1 className="fw-bold text-uppercase m-0 tracking-wide" style={{ color: "#ffffff", fontSize: "1.75rem", letterSpacing: "1px" }}>
          Kenya eFootball Rankings
        </h1>
        <div 
          className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top"
          style={{ borderColor: "rgba(77, 163, 255, 0.15)", fontFamily: "system-ui, sans-serif", fontSize: "11px" }}
        >
          <span style={{ color: "#9bb9d4" }}>
            {new Date().toLocaleDateString("en-KE", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}